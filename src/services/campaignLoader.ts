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
import boardRecruitmentJson from '../../campaign-content-board-recruitment-2026.json';
import anniversaryJson from '../../campaign-content-10th-anniversary-2026.json';

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

  // Parse platform-specific content
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
