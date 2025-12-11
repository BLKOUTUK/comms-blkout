import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Secret for verifying webhook calls from IVOR or other sources
const WEBHOOK_SECRET = process.env.COMMUNITY_WEBHOOK_SECRET || 'blkout_community_secret_2025';
const N8N_WEBHOOK_URL = process.env.N8N_COMMUNITY_RESPONSE_WEBHOOK;

// Verify webhook secret
function verifySecret(providedSecret: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(WEBHOOK_SECRET),
      Buffer.from(providedSecret)
    );
  } catch {
    return false;
  }
}

interface CommunityQuestionPayload {
  question: string;
  context?: string;
  member_name?: string;
  urgency?: 'low' | 'normal' | 'high' | 'critical';
  category?: 'resources' | 'events' | 'support' | 'general' | 'feedback';
  platforms?: string[];
  source?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const headerSecret = req.headers['x-webhook-secret'] as string;
  const authHeader = req.headers['authorization'];
  const bodySecret = req.body?.secret;

  // Check any valid auth method
  const isAuthorized =
    (headerSecret && verifySecret(headerSecret)) ||
    (bodySecret && verifySecret(bodySecret)) ||
    (authHeader && authHeader.startsWith('Bearer ') && verifySecret(authHeader.replace('Bearer ', '')));

  if (!isAuthorized) {
    console.log('[Community Question] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload: CommunityQuestionPayload = req.body;

    // Validate required fields
    if (!payload.question || payload.question.trim().length < 10) {
      return res.status(400).json({
        error: 'Invalid question',
        message: 'Question must be at least 10 characters long'
      });
    }

    // Sanitize and prepare payload
    const sanitizedPayload = {
      question: payload.question.trim().substring(0, 1000),
      context: payload.context?.trim().substring(0, 500) || '',
      member_name: payload.member_name?.trim().substring(0, 100) || 'Community Member',
      urgency: payload.urgency || 'normal',
      category: payload.category || 'general',
      platforms: payload.platforms || ['instagram'],
      source: payload.source || 'api',
      received_at: new Date().toISOString()
    };

    console.log('[Community Question] Received:', {
      question_preview: sanitizedPayload.question.substring(0, 50) + '...',
      category: sanitizedPayload.category,
      urgency: sanitizedPayload.urgency,
      source: sanitizedPayload.source
    });

    // Forward to n8n for AI processing if webhook URL is configured
    if (N8N_WEBHOOK_URL) {
      try {
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sanitizedPayload)
        });

        if (!n8nResponse.ok) {
          console.error('[Community Question] n8n webhook failed:', n8nResponse.status);
          // Don't fail the request, just log the error
        } else {
          const n8nResult = await n8nResponse.json();
          console.log('[Community Question] n8n response:', n8nResult);

          // If n8n processed successfully, return the generated content
          if (n8nResult.generated_content) {
            return res.status(200).json({
              success: true,
              message: 'Question received and content generated',
              request_id: crypto.randomUUID(),
              generated_content: n8nResult.generated_content,
              status: 'pending_review'
            });
          }
        }
      } catch (n8nError) {
        console.error('[Community Question] n8n call error:', n8nError);
        // Continue without n8n response
      }
    }

    // Default response when n8n is not configured or fails
    return res.status(202).json({
      success: true,
      message: 'Question received and queued for processing',
      request_id: crypto.randomUUID(),
      data: {
        category: sanitizedPayload.category,
        urgency: sanitizedPayload.urgency,
        estimated_response_time: sanitizedPayload.urgency === 'high' ? '1 hour' : '24 hours'
      }
    });

  } catch (error) {
    console.error('[Community Question] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
