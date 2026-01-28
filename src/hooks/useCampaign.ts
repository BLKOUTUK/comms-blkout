/**
 * Campaign Hooks
 * React hooks for campaign data management
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Campaign,
  CampaignContentItem,
  CampaignSummary,
  ContentItemStatus,
  HealthCheck,
  PipelineStatus,
  ScheduleEvent,
  StatusColumn,
  ContentTotals,
} from '@/types/campaign';
import { loadAllCampaigns, getCampaignSummary } from '@/services/campaignLoader';

/**
 * Hook to load and manage campaigns
 */
export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadAllCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load campaigns'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  return {
    campaigns,
    isLoading,
    error,
    refresh: loadCampaigns,
  };
}

/**
 * Hook to get content organized by status columns
 */
export function useContentStatus(campaigns: Campaign[]) {
  const allContent: CampaignContentItem[] = campaigns.flatMap(c => c.contentItems);

  const statusOrder: ContentItemStatus[] = ['draft', 'ready', 'scheduled', 'published'];

  const byStatus = allContent.reduce((acc, item) => {
    if (!acc[item.status]) acc[item.status] = [];
    acc[item.status].push(item);
    return acc;
  }, {} as Record<ContentItemStatus, CampaignContentItem[]>);

  const columns: StatusColumn[] = statusOrder.map(status => ({
    status,
    items: byStatus[status] || [],
    count: byStatus[status]?.length || 0,
  }));

  const totals: ContentTotals = {
    total: allContent.length,
    completed: (byStatus.published?.length || 0) + (byStatus.scheduled?.length || 0),
    inProgress: byStatus.ready?.length || 0,
    notStarted: byStatus.draft?.length || 0,
    review: 0,
  };

  return { columns, totals, allContent };
}

/**
 * Hook to generate schedule events for calendar
 */
export function useScheduleEvents(campaigns: Campaign[]): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];

  campaigns.forEach(campaign => {
    // Add phase events
    campaign.phases.forEach(phase => {
      if (phase.dates) {
        const dateMatch = phase.dates.match(/(\w+ \d+)/);
        if (dateMatch) {
          events.push({
            id: phase.id,
            campaignId: campaign.id,
            campaignName: campaign.name,
            title: phase.name,
            description: phase.theme,
            date: new Date(phase.dates),
            type: 'phase_start',
            status: 'draft',
          });
        }
      }
    });

    // Add content events
    campaign.contentItems.forEach(item => {
      if (item.scheduledFor) {
        events.push({
          id: item.id,
          campaignId: campaign.id,
          campaignName: campaign.name,
          title: item.title,
          date: item.scheduledFor,
          type: 'publish',
          platform: item.platform,
          contentId: item.id,
          status: item.status,
        });
      }
    });

    // Add campaign milestones
    if (campaign.launchDate) {
      events.push({
        id: `${campaign.id}-launch`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        title: `${campaign.name} Launch`,
        date: new Date(campaign.launchDate),
        type: 'milestone',
        status: 'scheduled',
        color: '#10B981',
      });
    }

    if (campaign.endDate) {
      events.push({
        id: `${campaign.id}-end`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        title: `${campaign.name} End`,
        date: new Date(campaign.endDate),
        type: 'milestone',
        status: 'scheduled',
        color: '#EF4444',
      });
    }
  });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Hook for pipeline health checks
 */
export function usePipelineHealth(campaigns: Campaign[]) {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [overallStatus, setOverallStatus] = useState<PipelineStatus>('unknown');
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runChecks = useCallback(() => {
    setIsRunning(true);
    const allChecks: HealthCheck[] = [];
    const now = new Date();

    campaigns.forEach(campaign => {
      // 1. Config Valid
      allChecks.push({
        id: `${campaign.id}-config`,
        name: 'Config Valid',
        description: 'Campaign configuration is valid',
        status: campaign.id && campaign.name ? 'pass' : 'fail',
        message: campaign.id ? 'Configuration loaded successfully' : 'Missing required fields',
        category: 'config',
        campaignId: campaign.id,
        checkedAt: now,
      });

      // 2. Content Complete
      const totalContent = campaign.contentItems.length;
      const readyContent = campaign.contentItems.filter(
        i => i.status === 'ready' || i.status === 'scheduled' || i.status === 'published'
      ).length;
      const contentPercent = totalContent > 0 ? Math.round((readyContent / totalContent) * 100) : 0;

      allChecks.push({
        id: `${campaign.id}-content`,
        name: 'Content Complete',
        description: 'Content items are ready',
        status: contentPercent >= 80 ? 'pass' : contentPercent >= 50 ? 'warning' : 'fail',
        message: `${readyContent}/${totalContent} items ready (${contentPercent}%)`,
        category: 'content',
        campaignId: campaign.id,
        checkedAt: now,
      });

      // 3. Scheduling Set
      const scheduledCount = campaign.contentItems.filter(i => i.scheduledFor).length;
      const schedulePercent = totalContent > 0 ? Math.round((scheduledCount / totalContent) * 100) : 0;

      allChecks.push({
        id: `${campaign.id}-scheduling`,
        name: 'Scheduling Set',
        description: 'Content has scheduled dates',
        status: schedulePercent >= 50 ? 'pass' : scheduledCount > 0 ? 'warning' : 'pending',
        message: `${scheduledCount} items scheduled`,
        category: 'scheduling',
        campaignId: campaign.id,
        checkedAt: now,
      });

      // 4. Agents Assigned
      const agentCount = campaign.agentTasks.length;

      allChecks.push({
        id: `${campaign.id}-agents`,
        name: 'Agents Assigned',
        description: 'AI agents have tasks',
        status: agentCount >= 3 ? 'pass' : agentCount > 0 ? 'warning' : 'pending',
        message: `${agentCount} agent tasks defined`,
        category: 'agents',
        campaignId: campaign.id,
        checkedAt: now,
      });

      // 5. Metrics Defined
      const hasMetrics = campaign.metrics.trackingEnabled || (campaign.metrics.kpis?.length || 0) > 0;

      allChecks.push({
        id: `${campaign.id}-metrics`,
        name: 'Metrics Defined',
        description: 'Success metrics configured',
        status: hasMetrics ? 'pass' : 'warning',
        message: hasMetrics ? 'Metrics configured' : 'No metrics defined',
        category: 'metrics',
        campaignId: campaign.id,
        checkedAt: now,
      });

      // 6. Newsletter Ready
      const newsletterReady = !campaign.newsletter?.enabled ||
        (campaign.newsletter.subject && campaign.newsletter.sendDate);

      allChecks.push({
        id: `${campaign.id}-newsletter`,
        name: 'Newsletter Ready',
        description: 'Newsletter configured or disabled',
        status: !campaign.newsletter?.enabled ? 'pass' : newsletterReady ? 'pass' : 'warning',
        message: !campaign.newsletter?.enabled
          ? 'Newsletter not required'
          : newsletterReady
            ? 'Newsletter configured'
            : 'Newsletter needs configuration',
        category: 'newsletter',
        campaignId: campaign.id,
        checkedAt: now,
      });

      // 7. Social Content Ready
      const socialContent = campaign.contentItems.filter(
        i => i.platform !== 'email' && i.platform !== 'newsletter'
      );
      const readySocial = socialContent.filter(
        i => i.status === 'ready' || i.status === 'scheduled' || i.status === 'published'
      ).length;

      allChecks.push({
        id: `${campaign.id}-social`,
        name: 'Social Content Ready',
        description: 'Social media content prepared',
        status: socialContent.length === 0
          ? 'pass'
          : readySocial >= socialContent.length * 0.5
            ? 'pass'
            : readySocial > 0
              ? 'warning'
              : 'fail',
        message: `${readySocial}/${socialContent.length} social posts ready`,
        category: 'social',
        campaignId: campaign.id,
        checkedAt: now,
      });

      // 8. Visual Assets Ready
      const visualsReady = !campaign.visuals.enabled ||
        campaign.visuals.canvaFolderId ||
        (campaign.visuals.requiredAssets?.length || 0) > 0;

      allChecks.push({
        id: `${campaign.id}-visuals`,
        name: 'Visual Assets Ready',
        description: 'Graphics and visuals configured',
        status: !campaign.visuals.enabled ? 'pass' : visualsReady ? 'pass' : 'warning',
        message: !campaign.visuals.enabled
          ? 'Visuals not required'
          : visualsReady
            ? 'Visual assets configured'
            : 'Visual assets need setup',
        category: 'visuals',
        campaignId: campaign.id,
        checkedAt: now,
      });
    });

    setChecks(allChecks);
    setLastRun(now);

    // Calculate overall status
    const failCount = allChecks.filter(c => c.status === 'fail').length;
    const warningCount = allChecks.filter(c => c.status === 'warning').length;

    let newStatus: PipelineStatus;
    if (failCount > 0) {
      newStatus = 'critical';
    } else if (warningCount > 0) {
      newStatus = 'warning';
    } else if (allChecks.length > 0) {
      newStatus = 'healthy';
    } else {
      newStatus = 'unknown';
    }

    setOverallStatus(newStatus);
    setIsRunning(false);
  }, [campaigns]);

  useEffect(() => {
    if (campaigns.length > 0) {
      runChecks();
    }
  }, [campaigns, runChecks]);

  return {
    checks,
    overallStatus,
    lastRun,
    isRunning,
    runChecks,
  };
}

/**
 * Hook for campaign summaries
 */
export function useCampaignSummaries(campaigns: Campaign[]): Array<{ campaign: Campaign; summary: CampaignSummary }> {
  return campaigns.map(campaign => ({
    campaign,
    summary: getCampaignSummary(campaign),
  }));
}
