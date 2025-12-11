import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_ORGANIZATION_ID = process.env.LINKEDIN_ORGANIZATION_ID;

// Initialize Supabase
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// BLKOUT Connection Score weights
// Comments (meaningful engagement) > Shares (community spread) > Likes (passive engagement)
const SCORE_WEIGHTS = {
  comments: 3,
  shares: 2,
  likes: 1
};

interface PostMetrics {
  queueId: string;
  platformPostId: string;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
}

interface ConnectionScore {
  raw: number;
  normalized: number;
  breakdown: {
    comments: number;
    shares: number;
    likes: number;
  };
}

// Calculate BLKOUT Connection Score
function calculateConnectionScore(metrics: PostMetrics): ConnectionScore {
  const commentScore = metrics.comments * SCORE_WEIGHTS.comments;
  const shareScore = metrics.shares * SCORE_WEIGHTS.shares;
  const likeScore = metrics.likes * SCORE_WEIGHTS.likes;

  const raw = commentScore + shareScore + likeScore;

  // Normalize to 0-100 scale (adjust divisor based on expected engagement)
  const normalized = Math.min(100, Math.round((raw / 50) * 100));

  return {
    raw,
    normalized,
    breakdown: {
      comments: commentScore,
      shares: shareScore,
      likes: likeScore
    }
  };
}

// Fetch LinkedIn post analytics
async function fetchLinkedInMetrics(postId: string): Promise<Partial<PostMetrics> | null> {
  if (!LINKEDIN_ACCESS_TOKEN) {
    console.error('[LinkedIn] Missing access token');
    return null;
  }

  try {
    // LinkedIn Analytics API - requires Marketing Developer Platform access
    const response = await fetch(
      `https://api.linkedin.com/v2/socialActions/${postId}?count=true`,
      {
        headers: {
          'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    if (!response.ok) {
      console.error(`[LinkedIn] Analytics fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();

    return {
      likes: data.likesSummary?.totalLikes || 0,
      comments: data.commentsSummary?.totalFirstLevelComments || 0,
      shares: 0, // Requires separate endpoint
      impressions: 0,
      reach: 0
    };

  } catch (error) {
    console.error('[LinkedIn] Analytics error:', error);
    return null;
  }
}

// Get published posts from last N days
async function getRecentPublishedPosts(days: number = 7): Promise<Array<{
  id: string;
  platform: string;
  platform_post_id: string;
  published_at: string;
}>> {
  if (!supabase) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from('social_media_queue')
    .select('id, platform, platform_post_id, published_at')
    .eq('status', 'published')
    .not('platform_post_id', 'is', null)
    .gte('published_at', cutoffDate.toISOString())
    .order('published_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching posts:', error);
    return [];
  }

  return data || [];
}

// Save analytics to database
async function saveAnalytics(
  queueId: string,
  metrics: PostMetrics,
  connectionScore: ConnectionScore
): Promise<void> {
  if (!supabase) return;

  // Upsert to content_analytics
  const { error } = await supabase
    .from('content_analytics')
    .upsert({
      queue_id: queueId,
      platform: metrics.platform,
      platform_post_id: metrics.platformPostId,
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      impressions: metrics.impressions,
      reach: metrics.reach,
      connection_score: connectionScore.normalized,
      connection_score_raw: connectionScore.raw,
      score_breakdown: connectionScore.breakdown,
      fetched_at: new Date().toISOString()
    }, {
      onConflict: 'queue_id'
    });

  if (error) {
    console.error('[Supabase] Analytics save error:', error);
  }
}

// Create daily summary
async function createDailySummary(): Promise<{
  totalPosts: number;
  avgConnectionScore: number;
  topPerformer: string | null;
}> {
  if (!supabase) {
    return { totalPosts: 0, avgConnectionScore: 0, topPerformer: null };
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('content_analytics')
    .select('queue_id, connection_score, platform_post_id')
    .gte('fetched_at', `${today}T00:00:00`)
    .order('connection_score', { ascending: false });

  if (error || !data || data.length === 0) {
    return { totalPosts: 0, avgConnectionScore: 0, topPerformer: null };
  }

  const totalPosts = data.length;
  const avgConnectionScore = Math.round(
    data.reduce((sum, d) => sum + (d.connection_score || 0), 0) / totalPosts
  );
  const topPerformer = data[0]?.platform_post_id || null;

  // Save to analytics_summaries
  await supabase
    .from('analytics_summaries')
    .upsert({
      date: today,
      total_posts_analyzed: totalPosts,
      avg_connection_score: avgConnectionScore,
      top_performer_id: topPerformer,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'date'
    });

  return { totalPosts, avgConnectionScore, topPerformer };
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

  console.log('[Analytics] Starting analytics sync...');

  try {
    // Get recently published posts
    const posts = await getRecentPublishedPosts(7);
    console.log(`[Analytics] Found ${posts.length} posts to analyze`);

    const results: Array<{
      id: string;
      platform: string;
      connectionScore: number;
      success: boolean;
    }> = [];

    for (const post of posts) {
      console.log(`[Analytics] Fetching metrics for ${post.platform}: ${post.platform_post_id}`);

      let metrics: Partial<PostMetrics> | null = null;

      switch (post.platform) {
        case 'linkedin':
          metrics = await fetchLinkedInMetrics(post.platform_post_id);
          break;

        case 'instagram':
          // Instagram Insights API - implement when credentials ready
          metrics = null;
          break;

        default:
          metrics = null;
      }

      if (metrics) {
        const fullMetrics: PostMetrics = {
          queueId: post.id,
          platformPostId: post.platform_post_id,
          platform: post.platform,
          likes: metrics.likes || 0,
          comments: metrics.comments || 0,
          shares: metrics.shares || 0,
          impressions: metrics.impressions || 0,
          reach: metrics.reach || 0
        };

        const connectionScore = calculateConnectionScore(fullMetrics);
        await saveAnalytics(post.id, fullMetrics, connectionScore);

        results.push({
          id: post.id,
          platform: post.platform,
          connectionScore: connectionScore.normalized,
          success: true
        });
      } else {
        results.push({
          id: post.id,
          platform: post.platform,
          connectionScore: 0,
          success: false
        });
      }
    }

    // Create daily summary
    const summary = await createDailySummary();

    console.log(`[Analytics] Complete: ${results.filter(r => r.success).length}/${posts.length} successful`);

    return res.status(200).json({
      success: true,
      message: 'Analytics sync complete',
      stats: {
        postsAnalyzed: posts.length,
        successful: results.filter(r => r.success).length,
        avgConnectionScore: summary.avgConnectionScore,
        runDate: new Date().toISOString()
      },
      summary,
      results
    });

  } catch (error) {
    console.error('[Analytics] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
