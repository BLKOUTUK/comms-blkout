/**
 * SendFox Metrics Sync — Phase 1 of Communications Intelligence
 *
 * Pulls campaign metrics from SendFox back into the database.
 * This single service activates the entire feedback loop:
 *   SendFox metrics → content_performance INSERT → process_performance_feedback() trigger
 *   → ivor_intelligence relevance adjustments → feedback_loop_events logged
 *   → next Herald generation uses updated scores
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, SENDFOX_API_KEY } from '../config.js';

// ─── Types ───────────────────────────────────────────────────────────

interface SendFoxCampaign {
  id: number;
  name: string;
  subject: string;
  status: string;
  created_at: string;
  // Metrics fields — exact shape depends on SendFox response
  sent_count?: number;
  open_count?: number;
  click_count?: number;
  unsubscribe_count?: number;
  bounce_count?: number;
  spam_count?: number;
  unique_opens?: number;
  unique_clicks?: number;
  open_rate?: number;
  click_rate?: number;
  [key: string]: any; // Allow extra fields we haven't mapped yet
}

interface SyncResult {
  edition_id: string;
  edition_title: string;
  sendfox_campaign_id: number;
  metrics_updated: boolean;
  feedback_loop_triggered: boolean;
  error?: string;
}

// ─── SendFox API helpers ─────────────────────────────────────────────

async function sendfoxGet(endpoint: string): Promise<any> {
  const url = `https://api.sendfox.com${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SENDFOX_API_KEY}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SendFox API ${response.status}: ${text}`);
  }

  return response.json();
}

/**
 * Fetch all recent campaigns from SendFox (paginated)
 */
async function fetchSendFoxCampaigns(pages = 3): Promise<SendFoxCampaign[]> {
  const campaigns: SendFoxCampaign[] = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const data = await sendfoxGet(`/campaigns?page=${page}`);
      const items = data?.data || data || [];

      if (Array.isArray(items)) {
        campaigns.push(...items);
      } else if (items.data && Array.isArray(items.data)) {
        campaigns.push(...items.data);
      }

      // Stop if no more pages
      if (!data?.next_page_url) break;
    } catch (err) {
      console.error(`[MetricsSync] Error fetching campaigns page ${page}:`, err);
      break;
    }
  }

  return campaigns;
}

/**
 * Fetch detailed campaign data by ID
 */
async function fetchCampaignDetail(campaignId: number): Promise<SendFoxCampaign | null> {
  try {
    const data = await sendfoxGet(`/campaigns/${campaignId}`);
    return data?.data || data || null;
  } catch (err) {
    console.error(`[MetricsSync] Error fetching campaign ${campaignId}:`, err);
    return null;
  }
}

// ─── Matching logic ──────────────────────────────────────────────────

/**
 * Try to match SendFox campaigns to newsletter_editions.
 * Matching by: sendfox_campaign_id (exact) > subject line similarity > date proximity
 */
async function matchCampaignsToEditions(campaigns: SendFoxCampaign[]) {
  if (!supabase) return [];

  // Get editions that are sent/approved and need metrics
  const { data: editions, error } = await supabase
    .from('newsletter_editions')
    .select('id, title, subject_line, status, sent_at, sendfox_campaign_id, open_rate')
    .in('status', ['sent', 'approved'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !editions) {
    console.error('[MetricsSync] Error fetching editions:', error);
    return [];
  }

  const matches: Array<{ edition: typeof editions[0]; campaign: SendFoxCampaign }> = [];

  for (const edition of editions) {
    // Already linked — find by campaign ID
    if (edition.sendfox_campaign_id) {
      const campaign = campaigns.find(c => String(c.id) === String(edition.sendfox_campaign_id));
      if (campaign) {
        matches.push({ edition, campaign });
        continue;
      }
    }

    // Try matching by subject line
    const subjectNorm = (edition.subject_line || edition.title || '').toLowerCase().trim();
    const matched = campaigns.find(c => {
      const campSubject = (c.subject || c.name || '').toLowerCase().trim();
      // Exact match or one contains the other
      return campSubject === subjectNorm
        || campSubject.includes(subjectNorm)
        || subjectNorm.includes(campSubject);
    });

    if (matched) {
      matches.push({ edition, campaign: matched });
    }
  }

  return matches;
}

// ─── Core sync logic ─────────────────────────────────────────────────

/**
 * Extract metrics from a SendFox campaign response.
 * SendFox's API response structure isn't fully documented,
 * so we handle multiple possible field names gracefully.
 */
function extractMetrics(campaign: SendFoxCampaign) {
  const sent = campaign.sent_count || campaign.recipients || campaign.total_sent || 0;
  const opens = campaign.open_count || campaign.opens || campaign.total_opens || 0;
  const uniqueOpens = campaign.unique_opens || opens;
  const clicks = campaign.click_count || campaign.clicks || campaign.total_clicks || 0;
  const uniqueClicks = campaign.unique_clicks || clicks;
  const unsubs = campaign.unsubscribe_count || campaign.unsubscribes || 0;
  const bounces = campaign.bounce_count || campaign.bounces || 0;
  const spam = campaign.spam_count || campaign.spam_complaints || campaign.spam_reports || 0;

  const openRate = sent > 0 ? (uniqueOpens / sent) : (campaign.open_rate || 0);
  const clickRate = sent > 0 ? (uniqueClicks / sent) : (campaign.click_rate || 0);
  const deliveredCount = sent - bounces;

  return {
    recipients_count: sent,
    delivered_count: deliveredCount,
    open_count: opens,
    unique_opens: uniqueOpens,
    open_rate: Math.round(openRate * 10000) / 10000, // 4 decimal places
    click_count: clicks,
    unique_clicks: uniqueClicks,
    click_rate: Math.round(clickRate * 10000) / 10000,
    unsubscribe_count: unsubs,
    bounce_count: bounces,
    spam_complaints: spam,
  };
}

/**
 * Sync metrics for a single edition/campaign pair
 */
async function syncEditionMetrics(
  editionId: string,
  editionTitle: string,
  campaign: SendFoxCampaign
): Promise<SyncResult> {
  if (!supabase) {
    return { edition_id: editionId, edition_title: editionTitle, sendfox_campaign_id: campaign.id, metrics_updated: false, feedback_loop_triggered: false, error: 'No database' };
  }

  const result: SyncResult = {
    edition_id: editionId,
    edition_title: editionTitle,
    sendfox_campaign_id: campaign.id,
    metrics_updated: false,
    feedback_loop_triggered: false,
  };

  try {
    // Get detailed campaign data
    const detail = await fetchCampaignDetail(campaign.id);
    const campaignData = detail || campaign;
    const metrics = extractMetrics(campaignData);

    // Log the raw response for debugging (first sync only)
    console.log(`[MetricsSync] Campaign ${campaign.id} raw keys:`, Object.keys(campaignData));
    console.log(`[MetricsSync] Extracted metrics:`, metrics);

    // 1. Update newsletter_editions with metrics
    const { error: updateError } = await supabase
      .from('newsletter_editions')
      .update({
        sendfox_campaign_id: String(campaign.id),
        status: 'sent',
        sent_at: campaign.created_at || new Date().toISOString(),
        recipients_count: metrics.recipients_count,
        delivered_count: metrics.delivered_count,
        open_count: metrics.open_count,
        open_rate: metrics.open_rate,
        unique_opens: metrics.unique_opens,
        click_count: metrics.click_count,
        click_rate: metrics.click_rate,
        unique_clicks: metrics.unique_clicks,
        unsubscribe_count: metrics.unsubscribe_count,
        bounce_count: metrics.bounce_count,
        spam_complaints: metrics.spam_complaints,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editionId);

    if (updateError) {
      result.error = `Edition update failed: ${updateError.message}`;
      console.error(`[MetricsSync] ${result.error}`);
      return result;
    }

    result.metrics_updated = true;

    // 2. Upsert into newsletter_performance
    const { error: perfError } = await supabase
      .from('newsletter_performance')
      .upsert({
        newsletter_id: editionId,
        newsletter_name: editionTitle,
        send_date: campaign.created_at || new Date().toISOString(),
        total_sent: metrics.recipients_count,
        total_delivered: metrics.delivered_count,
        total_bounced: metrics.bounce_count,
        total_opens: metrics.open_count,
        unique_opens: metrics.unique_opens,
        total_clicks: metrics.click_count,
        unique_clicks: metrics.unique_clicks,
        unsubscribes: metrics.unsubscribe_count,
        spam_reports: metrics.spam_complaints,
        top_clicked_links: campaignData.top_links || campaignData.links || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'newsletter_id' });

    if (perfError) {
      console.error(`[MetricsSync] newsletter_performance upsert error:`, perfError);
      // Non-fatal — continue
    }

    // 3. Insert into content_performance — THIS FIRES THE TRIGGER
    // Insert one record per metric type for this edition
    const contentPerfRecords = [
      {
        content_calendar_id: editionId,
        reach: metrics.recipients_count,
        impressions: metrics.delivered_count,
        engagement_count: metrics.open_count + metrics.click_count,
        engagement_rate: metrics.open_rate,
        shares: 0,
        comments: 0,
        saves: 0,
        meaningful_interactions: metrics.unique_clicks,
        conversations_started: 0,
        resources_accessed: metrics.unique_clicks,
        community_actions_taken: metrics.unique_clicks,
        sentiment_score: metrics.unsubscribe_count > 0
          ? Math.max(0, 1 - (metrics.unsubscribe_count / Math.max(1, metrics.recipients_count)) * 10)
          : 1.0,
        sentiment_summary: `Opens: ${metrics.unique_opens}, Clicks: ${metrics.unique_clicks}, Unsubs: ${metrics.unsubscribe_count}`,
        data_source: 'sendfox_sync',
        metadata: {
          sync_type: 'metrics_sync',
          sendfox_campaign_id: campaign.id,
          edition_id: editionId,
          synced_at: new Date().toISOString(),
          raw_metrics: metrics,
        },
      },
    ];

    const { error: cpError } = await supabase
      .from('content_performance')
      .insert(contentPerfRecords);

    if (cpError) {
      console.error(`[MetricsSync] content_performance insert error:`, cpError);
      // This is important — the trigger won't fire without this
      result.error = `Feedback loop insert failed: ${cpError.message}`;
    } else {
      result.feedback_loop_triggered = true;
      console.log(`[MetricsSync] Feedback loop triggered for edition ${editionId}`);
    }

    return result;
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[MetricsSync] Error syncing edition ${editionId}:`, err);
    return result;
  }
}

// ─── API Handlers ────────────────────────────────────────────────────

/**
 * POST action: sync_metrics
 * Pulls latest metrics from SendFox for all sent editions.
 * Can also accept { sendfox_campaign_id, edition_id } for manual linking.
 */
export async function handleMetricsSync(req: VercelRequest, res: VercelResponse) {
  if (!SENDFOX_API_KEY) {
    return res.status(500).json({ error: 'SendFox API key not configured. Set SENDFOX_API_KEY in environment.' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const { sendfox_campaign_id, edition_id } = req.body || {};

  // Manual linking mode: link a specific campaign to an edition
  if (sendfox_campaign_id && edition_id) {
    console.log(`[MetricsSync] Manual link: campaign ${sendfox_campaign_id} → edition ${edition_id}`);

    const { data: edition } = await supabase
      .from('newsletter_editions')
      .select('id, title')
      .eq('id', edition_id)
      .single();

    if (!edition) {
      return res.status(404).json({ error: 'Edition not found' });
    }

    const campaign = await fetchCampaignDetail(sendfox_campaign_id);
    if (!campaign) {
      return res.status(404).json({ error: 'SendFox campaign not found' });
    }

    const result = await syncEditionMetrics(edition.id, edition.title, campaign);
    return res.status(200).json({ success: true, results: [result] });
  }

  // Auto-sync mode: match all campaigns to editions
  console.log('[MetricsSync] Starting auto-sync...');

  try {
    // Fetch recent SendFox campaigns
    const campaigns = await fetchSendFoxCampaigns(3);
    console.log(`[MetricsSync] Found ${campaigns.length} SendFox campaigns`);

    if (campaigns.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No SendFox campaigns found',
        results: [],
        debug: { api_key_set: !!SENDFOX_API_KEY },
      });
    }

    // Match campaigns to editions
    const matches = await matchCampaignsToEditions(campaigns);
    console.log(`[MetricsSync] Matched ${matches.length} campaigns to editions`);

    // Sync each match
    const results: SyncResult[] = [];
    for (const { edition, campaign } of matches) {
      const result = await syncEditionMetrics(edition.id, edition.title, campaign);
      results.push(result);
    }

    // Summary
    const updated = results.filter(r => r.metrics_updated).length;
    const triggered = results.filter(r => r.feedback_loop_triggered).length;
    const errors = results.filter(r => r.error);

    console.log(`[MetricsSync] Complete: ${updated} updated, ${triggered} triggers fired, ${errors.length} errors`);

    return res.status(200).json({
      success: true,
      summary: {
        campaigns_found: campaigns.length,
        editions_matched: matches.length,
        metrics_updated: updated,
        feedback_loops_triggered: triggered,
        errors: errors.length,
      },
      results,
      unmatched_campaigns: campaigns
        .filter(c => !matches.some(m => m.campaign.id === c.id))
        .map(c => ({ id: c.id, name: c.name, subject: c.subject, status: c.status })),
    });
  } catch (err) {
    console.error('[MetricsSync] Fatal error:', err);
    return res.status(500).json({
      error: 'Metrics sync failed',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * GET cron job: metrics_sync
 * Called on schedule (daily 8am UTC) or manually.
 */
export async function runMetricsSync(): Promise<string> {
  if (!SENDFOX_API_KEY || !supabase) {
    return 'Skipped: SendFox API key or database not configured';
  }

  console.log('[MetricsSync] Cron: starting scheduled sync');

  try {
    const campaigns = await fetchSendFoxCampaigns(2);
    if (campaigns.length === 0) return 'No campaigns found';

    const matches = await matchCampaignsToEditions(campaigns);
    if (matches.length === 0) return `Found ${campaigns.length} campaigns but no matching editions`;

    let updated = 0;
    let triggered = 0;
    for (const { edition, campaign } of matches) {
      const result = await syncEditionMetrics(edition.id, edition.title, campaign);
      if (result.metrics_updated) updated++;
      if (result.feedback_loop_triggered) triggered++;
    }

    const summary = `Synced ${updated}/${matches.length} editions, ${triggered} feedback loops triggered`;
    console.log(`[MetricsSync] Cron: ${summary}`);
    return summary;
  } catch (err) {
    const msg = `Cron sync error: ${err instanceof Error ? err.message : 'Unknown'}`;
    console.error(`[MetricsSync] ${msg}`);
    return msg;
  }
}
