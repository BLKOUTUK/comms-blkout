
/**
 * BLKOUT Hub News Channel Integration Service
 *
 * Handles posting newsletter content to the BLKOUT Hub news channel
 * 24 hours after email distribution.
 *
 * BLKOUT Hub is powered by Heartbeat (heartbeat.chat)
 * API Documentation: https://heartbeat.readme.io/reference/authorization
 *
 * Integration points:
 * - Heartbeat API for thread/post creation
 * - Database tracking for posted newsletters
 * - Auto-publish scheduling
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Heartbeat API configuration (BLKOUT Hub is on Heartbeat)
// API Key generated from Settings → API Keys in Heartbeat admin
const HEARTBEAT_API_BASE = 'https://api.heartbeat.chat/v0';
const HEARTBEAT_API_KEY = import.meta.env.VITE_HEARTBEAT_API_KEY || null;
const NEWS_CHANNEL_ID = import.meta.env.VITE_HEARTBEAT_NEWS_CHANNEL_ID || null;


export interface HubNewsPost {
  title: string;
  summary: string;
  content: string; // HTML or markdown
  category: 'newsletter' | 'announcement' | 'update';
  editionId: string;
  editionType: 'weekly' | 'monthly';
  originalSentAt: Date;
}

export interface HubPostResult {
  success: boolean;
  hubPostId?: string;
  error?: string;
}

/**
 * Check if Hub API is configured
 */
export function isHubConfigured(): boolean {
  return !!HEARTBEAT_API_KEY && !!NEWS_CHANNEL_ID;
}

/**
 * Post newsletter content to BLKOUT Hub news channel
 */
export async function postToHubNewsChannel(post: HubNewsPost): Promise<HubPostResult> {
  // If Hub API not configured, log and return success (mock mode)
  if (!isHubConfigured()) {
    console.log('📦 Hub API not configured - mock posting:', post.title);

    // Still update database to track the "post"
    if (isSupabaseConfigured()) {
      await supabase
        .from('newsletter_editions')
        .update({
          published_to_hub_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.editionId);
    }

    return { success: true, hubPostId: `mock-${Date.now()}` };
  }

  try {
    // Heartbeat API: Create a thread in the news channel
    // POST /channels/{channelId}/threads
    const response = await fetch(`${HEARTBEAT_API_BASE}/channels/${NEWS_CHANNEL_ID}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Thread content - title becomes the thread subject
        title: post.title,
        // Body supports rich text/HTML
        body: formatNewsletterForHeartbeat(post),
        // Optional: pin important newsletters
        pinned: post.editionType === 'monthly',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Heartbeat API error:', response.status, errorText);
      return { success: false, error: `Heartbeat API error: ${response.status}` };
    }

    const result = await response.json();

    // Update database to track the post
    if (isSupabaseConfigured()) {
      await supabase
        .from('newsletter_editions')
        .update({
          published_to_hub_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.editionId);
    }

    return { success: true, hubPostId: result.id };
  } catch (error) {
    console.error('Failed to post to Hub:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check for newsletters ready to be posted to Hub (24+ hours after sending)
 * Returns editions that are sent but not yet posted to Hub
 */
export async function getNewslettersReadyForHub(): Promise<{
  editions: Array<{
    id: string;
    title: string;
    summary: string | null;
    htmlContent: string | null;
    editionType: string;
    sentAt: Date;
  }>;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { editions: [] };
  }

  try {
    const { data, error } = await supabase
      .from('newsletter_editions')
      .select('id, title, preview_text, html_content, edition_type, sent_at')
      .eq('status', 'sent')
      .eq('publish_to_hub', true)
      .is('published_to_hub_at', null)
      .lte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const editions = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      summary: row.preview_text,
      htmlContent: row.html_content,
      editionType: row.edition_type,
      sentAt: new Date(row.sent_at),
    }));

    return { editions };
  } catch (error) {
    return {
      editions: [],
      error: error instanceof Error ? error.message : 'Failed to fetch editions'
    };
  }
}

/**
 * Auto-publish all newsletters that are 24+ hours old
 * This can be called by a cron job or edge function
 */
export async function autoPublishToHub(): Promise<{
  published: number;
  failed: number;
  errors: string[];
}> {
  const result = { published: 0, failed: 0, errors: [] as string[] };

  const { editions, error } = await getNewslettersReadyForHub();

  if (error) {
    result.errors.push(error);
    return result;
  }

  for (const edition of editions) {
    const postResult = await postToHubNewsChannel({
      title: edition.title,
      summary: edition.summary || '',
      content: edition.htmlContent || '',
      category: 'newsletter',
      editionId: edition.id,
      editionType: edition.editionType as 'weekly' | 'monthly',
      originalSentAt: edition.sentAt,
    });

    if (postResult.success) {
      result.published++;
    } else {
      result.failed++;
      result.errors.push(`${edition.title}: ${postResult.error}`);
    }
  }

  return result;
}

/**
 * Manually trigger Hub posting for a specific edition
 */
export async function manualPostToHub(editionId: string): Promise<HubPostResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('newsletter_editions')
      .select('id, title, preview_text, html_content, edition_type, sent_at')
      .eq('id', editionId)
      .single();

    if (error) throw error;
    if (!data) return { success: false, error: 'Edition not found' };

    return postToHubNewsChannel({
      title: data.title,
      summary: data.preview_text || '',
      content: data.html_content || '',
      category: 'newsletter',
      editionId: data.id,
      editionType: data.edition_type as 'weekly' | 'monthly',
      originalSentAt: new Date(data.sent_at),
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to post to Hub'
    };
  }
}

/**
 * Format newsletter content for Heartbeat thread
 * Converts HTML newsletter to Heartbeat-friendly format
 */
function formatNewsletterForHeartbeat(post: HubNewsPost): string {
  // Build the thread body with newsletter content
  const parts: string[] = [];

  // Add summary/intro
  if (post.summary) {
    parts.push(post.summary);
    parts.push('');
  }

  // Add the main content (HTML is supported in Heartbeat)
  if (post.content) {
    parts.push(post.content);
  }

  // Add footer with metadata
  parts.push('');
  parts.push('---');
  parts.push(`📧 *This ${post.editionType} newsletter was originally sent to subscribers on ${post.originalSentAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}*`);
  parts.push('');
  parts.push('🔔 [Subscribe to get newsletters in your inbox](https://blkouthub.com/newsletter)');

  return parts.join('\n');
}

/**
 * Get list of available channels from Heartbeat
 * Useful for admin to select which channel to post to
 */
export async function getHeartbeatChannels(): Promise<{
  channels: Array<{ id: string; name: string; type: string }>;
  error?: string;
}> {
  if (!HEARTBEAT_API_KEY) {
    return { channels: [], error: 'Heartbeat API not configured' };
  }

  try {
    const response = await fetch(`${HEARTBEAT_API_BASE}/channels`, {
      headers: {
        'Authorization': `Bearer ${HEARTBEAT_API_KEY}`,
      },
    });

    if (!response.ok) {
      return { channels: [], error: `API error: ${response.status}` };
    }

    const data = await response.json();
    return {
      channels: (data.channels || []).map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
      })),
    };
  } catch (error) {
    return {
      channels: [],
      error: error instanceof Error ? error.message : 'Failed to fetch channels'
    };
  }
}
