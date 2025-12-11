import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_ORGANIZATION_ID = process.env.LINKEDIN_ORGANIZATION_ID;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// Initialize Supabase
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

interface QueuedPost {
  id: string;
  asset_id: string;
  platform: string;
  caption: string;
  hashtags: string[];
  scheduled_for: string;
  media_url?: string;
}

// Publish to LinkedIn
async function publishToLinkedIn(post: QueuedPost): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_ORGANIZATION_ID) {
    return { success: false, error: 'LinkedIn credentials not configured' };
  }

  try {
    const caption = `${post.caption}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}`;

    // LinkedIn API v2 - Create share
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: `urn:li:organization:${LINKEDIN_ORGANIZATION_ID}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: caption
            },
            shareMediaCategory: post.media_url ? 'IMAGE' : 'NONE',
            ...(post.media_url && {
              media: [{
                status: 'READY',
                originalUrl: post.media_url
              }]
            })
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[LinkedIn] Publish failed:', errorData);
      return { success: false, error: `LinkedIn API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, postId: data.id };

  } catch (error) {
    console.error('[LinkedIn] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Publish to Twitter/X
async function publishToTwitter(post: QueuedPost): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (!TWITTER_BEARER_TOKEN) {
    return { success: false, error: 'Twitter credentials not configured' };
  }

  try {
    const tweetText = `${post.caption}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}`;

    // Twitter API v2 - Create tweet
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: tweetText
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Twitter] Publish failed:', errorData);
      return { success: false, error: `Twitter API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, postId: data.data.id };

  } catch (error) {
    console.error('[Twitter] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Update queue status in Supabase
async function updateQueueStatus(
  queueId: string,
  status: 'published' | 'failed',
  platformPostId?: string,
  errorMessage?: string
): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('social_media_queue')
    .update({
      status,
      platform_post_id: platformPostId,
      error_message: errorMessage,
      published_at: status === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', queueId);
}

// Get posts ready to publish
async function getScheduledPosts(): Promise<QueuedPost[]> {
  if (!supabase) return [];

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('social_media_queue')
    .select(`
      id,
      asset_id,
      platform,
      caption,
      hashtags,
      scheduled_for,
      generated_assets (
        url
      )
    `)
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(10);

  if (error) {
    console.error('[Supabase] Error fetching queue:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    asset_id: item.asset_id,
    platform: item.platform,
    caption: item.caption,
    hashtags: item.hashtags || [],
    scheduled_for: item.scheduled_for,
    media_url: (item as any).generated_assets?.url
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authorization
  const cronSecret = req.headers['authorization'];
  const isAuthorized =
    cronSecret === `Bearer ${process.env.CRON_SECRET}` ||
    req.headers['x-vercel-cron'] === '1' ||
    process.env.NODE_ENV === 'development';

  if (!isAuthorized && req.method === 'GET') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[Publish] Starting publishing run...');

  try {
    // Get scheduled posts
    const posts = await getScheduledPosts();
    console.log(`[Publish] Found ${posts.length} posts ready to publish`);

    const results: Array<{
      id: string;
      platform: string;
      success: boolean;
      postId?: string;
      error?: string;
    }> = [];

    for (const post of posts) {
      console.log(`[Publish] Publishing to ${post.platform}: ${post.id}`);

      let result: { success: boolean; postId?: string; error?: string };

      switch (post.platform) {
        case 'linkedin':
          result = await publishToLinkedIn(post);
          break;

        case 'instagram':
          // Instagram requires different flow - skip for now
          result = { success: false, error: 'Instagram publishing not yet implemented' };
          break;

        case 'twitter':
          result = await publishToTwitter(post);
          break;

        default:
          result = { success: false, error: `Unsupported platform: ${post.platform}` };
      }

      // Update queue status
      await updateQueueStatus(
        post.id,
        result.success ? 'published' : 'failed',
        result.postId,
        result.error
      );

      results.push({
        id: post.id,
        platform: post.platform,
        ...result
      });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[Publish] Complete: ${successful} published, ${failed} failed`);

    // Step 2: Collect analytics for recently published posts (last 7 days)
    let analyticsCount = 0;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentPosts } = await supabase
        .from('social_media_queue')
        .select('id, platform, platform_post_id')
        .eq('status', 'published')
        .not('platform_post_id', 'is', null)
        .gte('published_at', sevenDaysAgo.toISOString());

      if (recentPosts && recentPosts.length > 0) {
        console.log(`[Analytics] Syncing metrics for ${recentPosts.length} recent posts`);

        for (const post of recentPosts) {
          if (post.platform === 'linkedin' && LINKEDIN_ACCESS_TOKEN && post.platform_post_id) {
            try {
              const metricsResponse = await fetch(
                `https://api.linkedin.com/v2/socialActions/${post.platform_post_id}?count=true`,
                {
                  headers: {
                    'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                  }
                }
              );

              if (metricsResponse.ok) {
                const metrics = await metricsResponse.json();
                const likes = metrics.likesSummary?.totalLikes || 0;
                const comments = metrics.commentsSummary?.totalFirstLevelComments || 0;

                // Calculate connection score
                const connectionScore = Math.min(100, Math.round(((comments * 3) + (likes * 1)) / 50 * 100));

                await supabase.from('content_analytics').upsert({
                  queue_id: post.id,
                  platform: post.platform,
                  likes,
                  comments,
                  shares: 0,
                  connection_score: connectionScore,
                  fetched_at: new Date().toISOString()
                }, { onConflict: 'queue_id' });

                analyticsCount++;
              }
            } catch (metricError) {
              console.error(`[Analytics] Error fetching metrics for ${post.id}:`, metricError);
            }
          }
        }
        console.log(`[Analytics] Updated metrics for ${analyticsCount} posts`);
      }
    } catch (analyticsError) {
      console.error('[Analytics] Error in analytics sync:', analyticsError);
    }

    return res.status(200).json({
      success: true,
      message: 'Publishing run complete',
      stats: {
        total: posts.length,
        published: successful,
        failed: failed,
        analyticsUpdated: analyticsCount,
        runDate: new Date().toISOString()
      },
      results
    });

  } catch (error) {
    console.error('[Publish] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
