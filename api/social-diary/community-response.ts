import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'berkeley@blkoutuk.com';

// Initialize Supabase
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

interface CommunityQuestion {
  question: string;
  context?: string;
  member_name?: string;
  urgency?: 'normal' | 'high';
  category?: 'resources' | 'events' | 'support' | 'general';
  platforms?: string[];
}

interface GeneratedResponse {
  instagram_caption: string;
  linkedin_post: string;
  key_points: string[];
  suggested_hashtags: string[];
  tone: string;
}

// Generate response using Claude
async function generateCommunityResponse(question: CommunityQuestion): Promise<GeneratedResponse | null> {
  if (!OPENROUTER_API_KEY) {
    console.error('[OpenRouter] Missing API key');
    return null;
  }

  const prompt = `You are the BLKOUT Community Voice - an AI assistant helping create responses to community questions for Black LGBTQ+ people in the UK.

## Question Details
- Question: ${question.question}
- Context: ${question.context || 'No additional context'}
- Category: ${question.category || 'general'}
- Urgency: ${question.urgency || 'normal'}

## Your Task
Create a warm, informative response that:
1. Centers the lived experiences of Black LGBTQ+ people
2. Uses affirming and inclusive language
3. Provides practical, actionable information where possible
4. Reflects BLKOUT's values: community, liberation, joy, authenticity

## Output Format
Return a JSON object with this structure:
{
  "instagram_caption": "A 150-300 word response formatted for Instagram (with line breaks, emojis sparingly)",
  "linkedin_post": "A 200-400 word professional version for LinkedIn",
  "key_points": ["3-5 key takeaways"],
  "suggested_hashtags": ["5-8 relevant hashtags without the # symbol"],
  "tone": "Brief description of the tone used"
}

## BLKOUT Voice Guidelines
- Warm and welcoming, never clinical
- Celebrate Blackness and queerness
- Acknowledge intersectionality
- Build community, not dependency
- Center joy alongside struggle

Return ONLY the JSON object, no additional text.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://comms-blkout.vercel.app',
        'X-Title': 'BLKOUT Community Response'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate community voice for BLKOUT UK, serving Black LGBTQ+ people. Always be affirming, practical, and rooted in Black feminist thought. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OpenRouter] API error: ${response.status}`, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[OpenRouter] No content in response');
      return null;
    }

    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[OpenRouter] Failed to parse JSON:', parseError);
      return null;
    }

  } catch (error) {
    console.error('[OpenRouter] Error:', error);
    return null;
  }
}

// Save response to Supabase
async function saveResponse(
  question: CommunityQuestion,
  response: GeneratedResponse
): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('community_responses')
    .insert({
      question: question.question,
      context: question.context,
      member_name: question.member_name || 'Anonymous',
      category: question.category || 'general',
      urgency: question.urgency || 'normal',
      target_platforms: question.platforms || ['instagram'],
      instagram_response: response.instagram_caption,
      linkedin_response: response.linkedin_post,
      key_points: response.key_points,
      suggested_hashtags: response.suggested_hashtags,
      tone: response.tone,
      status: 'pending_review',
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Supabase] Save error:', error);
    return null;
  }

  return data?.id || null;
}

// Send notification for high urgency
async function notifyHighUrgency(question: CommunityQuestion, responseId: string): Promise<void> {
  console.log('[Notification] High urgency alert:', {
    to: NOTIFICATION_EMAIL,
    subject: '🚨 URGENT: Community Question Needs Review',
    body: `
A high-urgency community question has been received and a response generated.

Question: ${question.question}
Category: ${question.category}
Response ID: ${responseId}

Please review and approve/edit the response in the admin dashboard.
    `
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for external triggers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook secret
  const webhookSecret = req.headers['x-webhook-secret'] || req.body?.secret;
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET || 'blkout_n8n_secret_2025';

  if (webhookSecret !== expectedSecret && process.env.NODE_ENV !== 'development') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const question: CommunityQuestion = req.body;

    if (!question.question) {
      return res.status(400).json({ error: 'Missing required field: question' });
    }

    console.log(`[Community Response] Processing question: ${question.question.substring(0, 50)}...`);

    // Generate AI response
    const response = await generateCommunityResponse(question);

    if (!response) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate response'
      });
    }

    // Save to database
    const responseId = await saveResponse(question, response);

    // Notify if high urgency
    if (question.urgency === 'high' && responseId) {
      await notifyHighUrgency(question, responseId);
    }

    console.log(`[Community Response] Generated and saved: ${responseId}`);

    return res.status(200).json({
      success: true,
      message: 'Community response generated',
      response_id: responseId,
      response: {
        instagram: response.instagram_caption,
        linkedin: response.linkedin_post,
        hashtags: response.suggested_hashtags,
        key_points: response.key_points
      },
      status: 'pending_review'
    });

  } catch (error) {
    console.error('[Community Response] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
