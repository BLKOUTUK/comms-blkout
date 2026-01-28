/**
 * Campaign Loader Service
 * Loads and parses campaign JSON files into normalized Campaign objects
 */

import type {
  Campaign,
  CampaignContentItem,
  CampaignAgentTask,
  CampaignPhase,
  CampaignSummary,
  ContentItemStatus,
  PlatformType,
} from '@/types/campaign';

// Import campaign JSON files
import boardRecruitmentJson from '@/data/campaign-content-board-recruitment-2026.json';
import anniversaryJson from '@/data/campaign-content-10th-anniversary-2026.json';

/**
 * Parse a campaign JSON file into a normalized Campaign object
 */
function parseCampaignJson(json: Record<string, unknown>, id: string): Campaign {
  const campaign = json.campaign as Record<string, unknown> || {};
  const contentCalendar = json.content_calendar as Record<string, unknown> || {};
  const agentTasks = json.agent_tasks as Record<string, unknown>[] || [];
  const newsletter = json.newsletter as Record<string, unknown> || null;
  const metrics = json.metrics as Record<string, unknown> || {};

  // Extract content items from various sources in the JSON
  const contentItems: CampaignContentItem[] = [];

  // Parse content calendar phases
  const phases: CampaignPhase[] = [];
  if (contentCalendar.phases) {
    const phasesData = contentCalendar.phases as Record<string, unknown>[];
    phasesData.forEach((phase, idx) => {
      phases.push({
        id: `${id}-phase-${idx}`,
        name: String(phase.name || `Phase ${idx + 1}`),
        dates: String(phase.dates || ''),
        theme: String(phase.theme || ''),
        activities: Array.isArray(phase.activities) ? phase.activities.map(String) : [],
      });

      // Extract content from phase if present
      if (phase.content && Array.isArray(phase.content)) {
        (phase.content as Record<string, unknown>[]).forEach((item, contentIdx) => {
          contentItems.push(parseContentItem(item, `${id}-phase${idx}-${contentIdx}`, id));
        });
      }
    });
  }

  // Parse social_media_content (nested platform objects)
  const socialMediaContent = json.social_media_content as Record<string, unknown> || {};
  Object.entries(socialMediaContent).forEach(([platform, platformData]) => {
    if (platformData && typeof platformData === 'object') {
      const platformObj = platformData as Record<string, unknown>;
      Object.entries(platformObj).forEach(([postKey, postData]) => {
        if (postData && typeof postData === 'object') {
          const post = postData as Record<string, unknown>;
          // Handle carousel/post items
          if (post.type || post.content || post.caption || post.text) {
            contentItems.push({
              id: `${id}-${platform}-${postKey}`,
              type: String(post.type || 'social') as CampaignContentItem['type'],
              platform: platform as CampaignContentItem['platform'],
              title: postKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              content: post.caption ? String(post.caption) :
                       post.text ? String(post.text) :
                       Array.isArray(post.content) ? post.content.map((c: unknown) =>
                         typeof c === 'object' && c !== null ? String((c as Record<string, unknown>).text || '') : String(c)
                       ) : String(post.content || ''),
              timing: String(post.timing || ''),
              status: 'ready',
              hashtags: Array.isArray(post.hashtags) ? post.hashtags.map(String) : [],
              metadata: { postKey, slides: post.slides },
            });
          }
          // Handle thread items (twitter)
          if (post.tweets && Array.isArray(post.tweets)) {
            contentItems.push({
              id: `${id}-${platform}-thread`,
              type: 'twitter_thread',
              platform: 'twitter',
              title: 'Twitter Thread',
              content: post.tweets.map(String),
              timing: String(post.timing || ''),
              status: 'ready',
              hashtags: [],
              metadata: { tweetCount: post.tweets.length },
            });
          }
          // Handle single posts array
          if (Array.isArray(post)) {
            post.forEach((item: unknown, idx: number) => {
              if (item && typeof item === 'object') {
                const singlePost = item as Record<string, unknown>;
                contentItems.push({
                  id: `${id}-${platform}-${postKey}-${idx}`,
                  type: 'social',
                  platform: platform as CampaignContentItem['platform'],
                  title: `${platform} Post ${idx + 1}`,
                  content: String(singlePost.text || singlePost.content || ''),
                  timing: String(singlePost.timing || ''),
                  status: 'ready',
                  hashtags: [],
                  metadata: {},
                });
              }
            });
          }
        }
      });
    }
  });

  // Also check for cross_platform_strategy (anniversary campaign structure)
  const crossPlatform = json.cross_platform_strategy as Record<string, unknown> || {};

  // Parse campaign phases
  const campaignPhases = crossPlatform.campaign_phases as Record<string, unknown> || {};
  Object.entries(campaignPhases).forEach(([phaseKey, phaseData]) => {
    if (phaseData && typeof phaseData === 'object') {
      const phase = phaseData as Record<string, unknown>;
      phases.push({
        id: `${id}-${phaseKey}`,
        name: phaseKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        dates: String(phase.dates || ''),
        theme: String(phase.theme || ''),
        activities: Array.isArray(phase.content) ? phase.content.map(String) : [],
      });
    }
  });

  // Parse platform content from cross_platform_strategy
  ['instagram', 'twitter', 'linkedin', 'tiktok', 'facebook'].forEach(platform => {
    const platformData = crossPlatform[platform] as Record<string, unknown>;
    if (platformData && typeof platformData === 'object') {
      Object.entries(platformData).forEach(([postKey, postData]) => {
        if (postData && typeof postData === 'object') {
          const post = postData as Record<string, unknown>;
          if (post.type || post.content || post.concept || post.timing) {
            contentItems.push({
              id: `${id}-xplat-${platform}-${postKey}`,
              type: String(post.type || 'social') as CampaignContentItem['type'],
              platform: platform as CampaignContentItem['platform'],
              title: postKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              content: Array.isArray(post.content) ? post.content.map(String) :
                       String(post.content || post.concept || ''),
              timing: String(post.timing || ''),
              status: 'ready',
              hashtags: [],
              metadata: { slides: post.slides, duration: post.duration, tweet_count: post.tweet_count },
            });
          }
        }
      });
    }
  });

  // Also check for platform_content (alternative structure)
  const platformContent = json.platform_content as Record<string, unknown> || {};
  Object.entries(platformContent).forEach(([platform, items]) => {
    if (Array.isArray(items)) {
      items.forEach((item: Record<string, unknown>, idx: number) => {
        contentItems.push(parseContentItem(item, `${id}-${platform}-${idx}`, id, platform as PlatformType));
      });
    }
  });

  // Parse agent tasks
  const parsedAgentTasks: CampaignAgentTask[] = [];
  if (Array.isArray(agentTasks)) {
    agentTasks.forEach((task, idx) => {
      parsedAgentTasks.push({
        agentType: String(task.agent || task.agentType || 'unknown'),
        agentName: String(task.agent_name || task.agentName || task.agent || ''),
        taskId: `${id}-task-${idx}`,
        prompt: String(task.prompt || task.task || ''),
        targetPlatform: (task.platform || task.targetPlatform || 'all') as PlatformType | 'all',
        priority: (task.priority || 'medium') as 'high' | 'medium' | 'low',
        status: deriveStatus(task),
        tasks: Array.isArray(task.tasks) ? task.tasks.map(String) : [],
      });
    });
  }

  // Determine platforms used
  const platforms = new Set<PlatformType>();
  contentItems.forEach(item => {
    if (item.platform && item.platform !== 'all' && item.platform !== 'internal') {
      platforms.add(item.platform as PlatformType);
    }
  });

  return {
    id,
    name: String(campaign.name || 'Unnamed Campaign'),
    slug: String(campaign.slug || id),
    launchDate: String(campaign.launch_date || campaign.launchDate || ''),
    endDate: String(campaign.end_date || campaign.endDate || ''),
    tagline: String(campaign.tagline || ''),
    mission: String(campaign.mission || ''),
    voice: String(campaign.voice || ''),
    signaturePhrases: Array.isArray(campaign.signature_phrases)
      ? campaign.signature_phrases.map(String)
      : [],
    phases,
    platforms: Array.from(platforms),
    content: contentItems,
    contentItems,
    agentTasks: parsedAgentTasks,
    newsletter: newsletter ? {
      enabled: true,
      subject: String(newsletter.subject || newsletter.subject_line || ''),
      subjectLine: String(newsletter.subject_line || ''),
      preheader: String(newsletter.preheader || ''),
      body: String(newsletter.body || ''),
      sendDate: String(newsletter.send_date || ''),
      status: 'draft',
    } : { enabled: false },
    visuals: {
      enabled: !!json.visual_assets,
      canvaFolderId: json.canva_folder_id as string | undefined,
      requiredAssets: Array.isArray(json.required_assets)
        ? json.required_assets.map(String)
        : [],
    },
    metrics: {
      trackingEnabled: !!metrics,
      kpis: Array.isArray(metrics.kpis) ? metrics.kpis.map(String) : [],
      targetReach: Number(metrics.target_reach || metrics.targetReach) || undefined,
      targetEngagementRate: Number(metrics.engagement_rate || metrics.targetEngagementRate) || undefined,
      targetApplications: Number(metrics.applications || metrics.targetApplications) || undefined,
    },
    rawData: json,
  };
}

/**
 * Parse a content item from JSON
 */
function parseContentItem(
  item: Record<string, unknown>,
  id: string,
  _campaignId: string,
  defaultPlatform?: PlatformType
): CampaignContentItem {
  return {
    id,
    type: String(item.type || item.content_type || 'social') as CampaignContentItem['type'],
    platform: (item.platform || defaultPlatform || 'all') as CampaignContentItem['platform'],
    title: String(item.title || item.name || 'Untitled'),
    content: Array.isArray(item.content)
      ? item.content.map(String)
      : String(item.content || item.copy || item.text || ''),
    timing: String(item.timing || item.scheduled_time || ''),
    scheduledFor: item.scheduled_for || item.scheduledFor
      ? new Date(String(item.scheduled_for || item.scheduledFor))
      : undefined,
    status: deriveStatus(item),
    hashtags: Array.isArray(item.hashtags) ? item.hashtags.map(String) : [],
    metadata: item.metadata as Record<string, unknown> || {},
    assignedAgent: String(item.assigned_agent || item.assignedAgent || ''),
  };
}

/**
 * Derive content status from item properties
 */
function deriveStatus(item: Record<string, unknown>): ContentItemStatus {
  if (item.status) {
    const status = String(item.status).toLowerCase();
    if (['published', 'live', 'sent'].includes(status)) return 'published';
    if (['scheduled', 'queued'].includes(status)) return 'scheduled';
    if (['ready', 'approved', 'complete', 'completed'].includes(status)) return 'ready';
    return 'draft';
  }

  // Infer status from content presence
  if (item.published_at || item.publishedAt) return 'published';
  if (item.scheduled_for || item.scheduledFor) return 'scheduled';
  if (item.content || item.copy || item.text) return 'ready';
  return 'draft';
}

/**
 * Load all campaigns
 */
export async function loadAllCampaigns(): Promise<Campaign[]> {
  const campaigns: Campaign[] = [];

  try {
    campaigns.push(parseCampaignJson(
      boardRecruitmentJson as Record<string, unknown>,
      'board-recruitment-2026'
    ));
  } catch (e) {
    console.error('Failed to load board recruitment campaign:', e);
  }

  try {
    campaigns.push(parseCampaignJson(
      anniversaryJson as Record<string, unknown>,
      '10th-anniversary-2026'
    ));
  } catch (e) {
    console.error('Failed to load anniversary campaign:', e);
  }

  return campaigns;
}

/**
 * Get campaign summary
 */
export function getCampaignSummary(campaign: Campaign): CampaignSummary {
  const now = new Date();
  const launchDate = new Date(campaign.launchDate);
  const endDate = new Date(campaign.endDate);

  const totalContent = campaign.contentItems.length;
  const completedContent = campaign.contentItems.filter(
    item => item.status === 'published' || item.status === 'scheduled'
  ).length;

  const totalTasks = campaign.agentTasks.length;
  const completedTasks = campaign.agentTasks.filter(
    task => task.status === 'ready' || task.status === 'published'
  ).length;

  const isActive = now >= launchDate && now <= endDate;
  const progress = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;

  return {
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
    launchDate: campaign.launchDate,
    endDate: campaign.endDate,
    tagline: campaign.tagline,
    totalContentItems: totalContent,
    completedContentItems: completedContent,
    totalAgentTasks: totalTasks,
    completedAgentTasks: completedTasks,
    isActive,
    progressPercentage: progress,
  };
}
