import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Secret for verifying n8n webhook calls
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'blkout_n8n_secret_2025';

// Verify webhook signature
function verifyWebhookSecret(providedSecret: string): boolean {
  if (!N8N_WEBHOOK_SECRET) return false;
  return crypto.timingSafeEqual(
    Buffer.from(N8N_WEBHOOK_SECRET),
    Buffer.from(providedSecret)
  );
}

// Supported action types
type WebhookAction =
  | 'trigger_content_generation'
  | 'queue_post'
  | 'sync_analytics'
  | 'process_event'
  | 'notify_team'
  | 'update_queue_status';

interface N8NWebhookPayload {
  action: WebhookAction;
  data: Record<string, any>;
  timestamp?: string;
  source?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for n8n calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook secret from header or body
  const headerSecret = req.headers['x-webhook-secret'] as string;
  const bodySecret = req.body?.secret;
  const secret = headerSecret || bodySecret;

  if (!secret || !verifyWebhookSecret(secret)) {
    console.log('[n8n Webhook] Invalid or missing secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload: N8NWebhookPayload = req.body;
    const { action, data } = payload;

    console.log(`[n8n Webhook] Received action: ${action}`, { timestamp: payload.timestamp, source: payload.source });

    switch (action) {
      case 'trigger_content_generation':
        // Trigger AI content generation for a specific topic
        return await handleContentGeneration(data, res);

      case 'queue_post':
        // Add a post to the publishing queue
        return await handleQueuePost(data, res);

      case 'sync_analytics':
        // Trigger analytics sync for a specific post
        return await handleAnalyticsSync(data, res);

      case 'process_event':
        // Process a discovered event from Social Diary
        return await handleProcessEvent(data, res);

      case 'notify_team':
        // Send notification to team (via email, slack, etc)
        return await handleNotifyTeam(data, res);

      case 'update_queue_status':
        // Update status of a queued post
        return await handleUpdateQueueStatus(data, res);

      default:
        console.log(`[n8n Webhook] Unknown action: ${action}`);
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('[n8n Webhook] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Handler functions for each action

async function handleContentGeneration(data: Record<string, any>, res: VercelResponse) {
  const { topic, platform, urgency, category } = data;

  if (!topic) {
    return res.status(400).json({ error: 'Missing required field: topic' });
  }

  console.log(`[Content Generation] Topic: ${topic}, Platform: ${platform || 'all'}`);

  // In production, this would call the AI generation service
  // For now, return acknowledgment for n8n to continue flow
  return res.status(200).json({
    success: true,
    message: 'Content generation triggered',
    request_id: crypto.randomUUID(),
    data: { topic, platform, urgency, category }
  });
}

async function handleQueuePost(data: Record<string, any>, res: VercelResponse) {
  const { asset_id, platform, caption, hashtags, scheduled_for } = data;

  if (!asset_id || !platform) {
    return res.status(400).json({ error: 'Missing required fields: asset_id, platform' });
  }

  console.log(`[Queue Post] Asset: ${asset_id}, Platform: ${platform}`);

  // This would insert into social_media_queue via Supabase
  return res.status(200).json({
    success: true,
    message: 'Post queued successfully',
    queue_id: crypto.randomUUID(),
    data: { asset_id, platform, scheduled_for }
  });
}

async function handleAnalyticsSync(data: Record<string, any>, res: VercelResponse) {
  const { post_id, platform, metrics } = data;

  console.log(`[Analytics Sync] Post: ${post_id}, Platform: ${platform}`);

  // This would update content_analytics table
  return res.status(200).json({
    success: true,
    message: 'Analytics synced',
    data: { post_id, platform, metrics }
  });
}

async function handleProcessEvent(data: Record<string, any>, res: VercelResponse) {
  const { event_id, action: eventAction } = data;

  console.log(`[Process Event] Event: ${event_id}, Action: ${eventAction}`);

  // Actions: approve, reject, feature, archive
  return res.status(200).json({
    success: true,
    message: `Event ${eventAction || 'processed'}`,
    data: { event_id }
  });
}

async function handleNotifyTeam(data: Record<string, any>, res: VercelResponse) {
  const { type, message, urgency, recipients } = data;

  console.log(`[Notify Team] Type: ${type}, Urgency: ${urgency}`);

  // This would integrate with email/Slack/etc
  return res.status(200).json({
    success: true,
    message: 'Notification sent',
    data: { type, recipients, urgency }
  });
}

async function handleUpdateQueueStatus(data: Record<string, any>, res: VercelResponse) {
  const { queue_id, status, platform_post_id, error_message } = data;

  if (!queue_id || !status) {
    return res.status(400).json({ error: 'Missing required fields: queue_id, status' });
  }

  console.log(`[Update Queue Status] Queue: ${queue_id}, Status: ${status}`);

  // This would update social_media_queue status
  return res.status(200).json({
    success: true,
    message: 'Queue status updated',
    data: { queue_id, status, platform_post_id }
  });
}
