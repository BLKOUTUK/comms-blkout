import { Layout } from '@/components/layout/Layout';
import { useState, useMemo } from 'react';
import {
  Calendar,
  Mail,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Video,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  LayoutGrid,
  FileText,
  CalendarDays,
  Activity,
  Zap,
  Download,
  Send,
  RefreshCw,
  ChevronRight,
  Eye,
  Edit,
  GripVertical,
  PlayCircle,
  FileDown,
  ClipboardList,
  BarChart3,
  Image,
} from 'lucide-react';
import { useCampaigns, usePipelineHealth, useCampaignSummaries } from '@/hooks/useCampaign';
import type {
  HealthCheck,
  ContentItemStatus,
} from '@/types/campaign';

type TabView = 'overview' | 'content' | 'schedule' | 'pipeline' | 'automation';

// Platform icons mapping
const platformIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  tiktok: Video,
  youtube: PlayCircle,
  email: Mail,
  internal: FileText,
};

// Platform colors for badges and icons
const platformColors: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  twitter: 'bg-blue-400',
  linkedin: 'bg-blue-700',
  facebook: 'bg-blue-600',
  tiktok: 'bg-black',
  youtube: 'bg-red-600',
  email: 'bg-green-600',
  internal: 'bg-gray-600',
};

// Status colors for content items
const statusColors: Record<ContentItemStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
  ready: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Ready' },
  scheduled: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Scheduled' },
  published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Published' },
};

// Kanban columns configuration - 6 status columns
const kanbanColumns: { key: ContentItemStatus; label: string; color: string }[] = [
  { key: 'draft', label: 'Idea', color: 'bg-gray-400' },
  { key: 'draft', label: 'Drafted', color: 'bg-blue-400' },
  { key: 'ready', label: 'Designed', color: 'bg-purple-400' },
  { key: 'ready', label: 'Approved', color: 'bg-green-400' },
  { key: 'scheduled', label: 'Scheduled', color: 'bg-yellow-400' },
  { key: 'published', label: 'Published', color: 'bg-emerald-500' },
];

// Health check icons
const healthIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  config: FileText,
  content: LayoutGrid,
  scheduling: Calendar,
  agents: Activity,
  metrics: BarChart3,
  newsletter: Mail,
  social: Instagram,
  visuals: Image,
};

export function CampaignDashboard() {
  const [activeTab, setActiveTab] = useState<TabView>('overview');

  // Load campaigns using the hook
  const { campaigns, isLoading, error, refresh } = useCampaigns();

  // Get campaign summaries
  const campaignSummaries = useCampaignSummaries(campaigns);

  // Run pipeline health checks
  const { checks, isRunning, lastRun, overallStatus, runChecks } = usePipelineHealth(campaigns);

  // Calculate aggregate stats
  const aggregateStats = useMemo(() => {
    const totalContent = campaigns.reduce((sum, c) => sum + c.contentItems.length, 0);
    const platforms = new Set<string>();
    campaigns.forEach((c) => {
      c.contentItems.forEach((item) => platforms.add(item.platform));
    });
    const completedContent = campaigns.reduce(
      (sum, c) =>
        sum + c.contentItems.filter((i) => i.status === 'published' || i.status === 'scheduled').length,
      0
    );
    const completionPercentage = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;

    return {
      totalContent,
      platforms: platforms.size,
      completionPercentage,
      totalCampaigns: campaigns.length,
    };
  }, [campaigns]);

  // Get all content items across campaigns
  const allContentItems = useMemo(() => {
    return campaigns.flatMap((c) =>
      c.contentItems.map((item) => ({
        ...item,
        campaignId: c.id,
        campaignName: c.name,
      }))
    );
  }, [campaigns]);

  // Group content by status for kanban
  const contentByStatus = useMemo(() => {
    const grouped: Record<ContentItemStatus, typeof allContentItems> = {
      draft: [],
      ready: [],
      scheduled: [],
      published: [],
    };
    allContentItems.forEach((item) => {
      grouped[item.status].push(item);
    });
    return grouped;
  }, [allContentItems]);

  // Generate 3-month timeline events
  const timelineEvents = useMemo(() => {
    const events: Array<{
      date: Date;
      title: string;
      campaign: string;
      type: 'launch' | 'end' | 'phase';
      color: string;
    }> = [];

    campaigns.forEach((campaign) => {
      // Add launch date
      if (campaign.launchDate) {
        events.push({
          date: new Date(campaign.launchDate),
          title: `${campaign.name} Launch`,
          campaign: campaign.name,
          type: 'launch',
          color: 'bg-green-500',
        });
      }

      // Add end date
      if (campaign.endDate) {
        events.push({
          date: new Date(campaign.endDate),
          title: `${campaign.name} End`,
          campaign: campaign.name,
          type: 'end',
          color: 'bg-red-500',
        });
      }

      // Add phase milestones
      campaign.phases.forEach((phase) => {
        if (phase.dates) {
          const dateMatch = phase.dates.match(/(\w+ \d+)/);
          if (dateMatch) {
            events.push({
              date: new Date(dateMatch[1] + ', 2026'),
              title: phase.name,
              campaign: campaign.name,
              type: 'phase',
              color: 'bg-blkout-500',
            });
          }
        }
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [campaigns]);

  // Get checks grouped by campaign
  const checksByCampaign = useMemo(() => {
    const grouped: Record<string, HealthCheck[]> = {};
    checks.forEach((check) => {
      if (!grouped[check.campaignId]) {
        grouped[check.campaignId] = [];
      }
      grouped[check.campaignId].push(check);
    });
    return grouped;
  }, [checks]);

  // Render loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw size={48} className="animate-spin text-blkout-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Render error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load campaigns</h2>
            <p className="text-gray-600 mb-4">{error?.message || 'Unknown error'}</p>
            <button onClick={refresh} className="btn btn-primary inline-flex items-center gap-2">
              <RefreshCw size={18} />
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs: { key: TabView; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutGrid },
    { key: 'content', label: 'Content', icon: FileText },
    { key: 'schedule', label: 'Schedule', icon: CalendarDays },
    { key: 'pipeline', label: 'Pipeline', icon: Activity },
    { key: 'automation', label: 'Automation', icon: Zap },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Campaign Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and monitor all BLKOUT campaigns</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <FileText size={16} />
                {aggregateStats.totalContent} content items
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <LayoutGrid size={16} />
                {aggregateStats.platforms} platforms
              </span>
              <span
                className={`inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
                  aggregateStats.completionPercentage >= 80
                    ? 'bg-green-50 text-green-600'
                    : aggregateStats.completionPercentage >= 50
                    ? 'bg-yellow-50 text-yellow-600'
                    : 'bg-gray-50 text-gray-600'
                }`}
              >
                <CheckCircle2 size={16} />
                {aggregateStats.completionPercentage}% complete
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={refresh} className="btn-secondary inline-flex items-center gap-2">
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button className="btn-primary inline-flex items-center gap-2">
              <Send size={18} />
              Deploy All
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blkout-600 text-blkout-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Campaign Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaignSummaries.map(({ campaign, summary }) => (
                <div key={campaign.id} className="card card-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{campaign.tagline}</p>
                    </div>
                    <span
                      className={`badge ${
                        summary.isActive ? 'badge-active' : 'badge-inactive'
                      }`}
                    >
                      {summary.isActive ? 'Active' : 'Upcoming'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blkout-600">
                        {summary.totalContentItems}
                      </div>
                      <div className="text-xs text-gray-500">Content Items</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blkout-600">
                        {summary.progressPercentage}%
                      </div>
                      <div className="text-xs text-gray-500">Complete</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-blkout-600 rounded-full transition-all duration-300"
                      style={{ width: `${summary.progressPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      <Calendar size={14} className="inline mr-1" />
                      {campaign.launchDate}
                    </span>
                    <button className="text-blkout-600 hover:text-blkout-700 inline-flex items-center gap-1">
                      View Details
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 3-Month Timeline */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3-Month Timeline</h2>
              <div className="space-y-4">
                {timelineEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No upcoming events</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    {timelineEvents.slice(0, 10).map((event, index) => (
                      <div key={index} className="relative flex items-start gap-4 pb-4">
                        <div
                          className={`w-8 h-8 rounded-full ${event.color} flex items-center justify-center text-white flex-shrink-0 z-10`}
                        >
                          {event.type === 'launch' ? (
                            <PlayCircle size={16} />
                          ) : event.type === 'end' ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <Calendar size={16} />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-500">
                            {event.date.toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content Gallery */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {allContentItems.slice(0, 12).map((item) => {
                  const Icon = platformIcons[item.platform] || FileText;
                  return (
                    <div
                      key={item.id}
                      className="aspect-square rounded-lg border border-gray-200 hover:border-blkout-300 hover:shadow-md transition-all p-3 flex flex-col"
                    >
                      <div
                        className={`w-8 h-8 rounded ${platformColors[item.platform] || 'bg-gray-400'} flex items-center justify-center text-white mb-2`}
                      >
                        <Icon size={16} />
                      </div>
                      <p className="text-xs font-medium text-gray-900 line-clamp-2 flex-1">
                        {item.title}
                      </p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${statusColors[item.status].bg} ${statusColors[item.status].text} mt-2`}
                      >
                        {statusColors[item.status].label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {allContentItems.length > 12 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setActiveTab('content')}
                    className="text-blkout-600 hover:text-blkout-700 text-sm font-medium"
                  >
                    View all {allContentItems.length} items
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Tab - Kanban Board */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Content Pipeline</h2>
              <div className="text-sm text-gray-500">
                Drag and drop to update status (coming soon)
              </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-6 gap-4 min-h-[600px]">
              {kanbanColumns.map((column, colIndex) => {
                // For simplicity, distribute items across columns based on status
                let columnItems: typeof allContentItems = [];
                if (colIndex === 0) {
                  columnItems = contentByStatus.draft.slice(
                    0,
                    Math.ceil(contentByStatus.draft.length / 2)
                  );
                } else if (colIndex === 1) {
                  columnItems = contentByStatus.draft.slice(
                    Math.ceil(contentByStatus.draft.length / 2)
                  );
                } else if (colIndex === 2) {
                  columnItems = contentByStatus.ready.slice(
                    0,
                    Math.ceil(contentByStatus.ready.length / 2)
                  );
                } else if (colIndex === 3) {
                  columnItems = contentByStatus.ready.slice(
                    Math.ceil(contentByStatus.ready.length / 2)
                  );
                } else if (colIndex === 4) {
                  columnItems = contentByStatus.scheduled;
                } else if (colIndex === 5) {
                  columnItems = contentByStatus.published;
                }

                return (
                  <div key={colIndex} className="flex flex-col">
                    {/* Column Header */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      <span className="font-medium text-gray-700 text-sm">{column.label}</span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {columnItems.length}
                      </span>
                    </div>

                    {/* Column Content */}
                    <div className="flex-1 space-y-3 bg-gray-50 rounded-lg p-2 min-h-[500px]">
                      {columnItems.map((item) => {
                        const Icon = platformIcons[item.platform] || FileText;
                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-grab"
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <GripVertical size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
                              <div
                                className={`w-6 h-6 rounded ${platformColors[item.platform] || 'bg-gray-400'} flex items-center justify-center text-white flex-shrink-0`}
                              >
                                <Icon size={12} />
                              </div>
                              <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                                {item.title}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 pl-6">
                              <span>{item.campaignName}</span>
                              <div className="flex gap-1">
                                <button className="p-1 hover:bg-gray-100 rounded">
                                  <Eye size={12} />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded">
                                  <Edit size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Schedule Tab - Timeline View */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Publishing Schedule</h2>
              <div className="flex gap-2">
                {Object.entries(platformColors)
                  .filter(([key]) => key !== 'internal')
                  .map(([platform, color]) => {
                    const Icon = platformIcons[platform];
                    return (
                      <div
                        key={platform}
                        className="flex items-center gap-1 text-xs text-gray-600"
                      >
                        <div
                          className={`w-4 h-4 rounded ${color} flex items-center justify-center text-white`}
                        >
                          <Icon size={10} />
                        </div>
                        <span className="capitalize">{platform}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Timeline by Campaign */}
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                  <span className="text-sm text-gray-500">
                    {campaign.launchDate} - {campaign.endDate}
                  </span>
                </div>

                {/* Content Timeline */}
                <div className="space-y-3">
                  {campaign.contentItems.map((item) => {
                    const Icon = platformIcons[item.platform] || FileText;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div
                          className={`w-10 h-10 rounded-lg ${platformColors[item.platform] || 'bg-gray-400'} flex items-center justify-center text-white flex-shrink-0`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.title}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="capitalize">{item.platform}</span>
                            {item.timing && (
                              <>
                                <span>|</span>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {item.timing}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status].bg} ${statusColors[item.status].text}`}
                        >
                          {statusColors[item.status].label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Campaign Phases */}
                {campaign.phases.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Campaign Phases</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {campaign.phases.map((phase) => (
                        <div key={phase.id} className="bg-blkout-50 rounded-lg p-3">
                          <p className="font-medium text-blkout-700">{phase.name}</p>
                          <p className="text-xs text-blkout-600 mt-1">{phase.dates}</p>
                          {phase.activities.length > 0 && (
                            <ul className="mt-2 text-xs text-gray-600 space-y-1">
                              {phase.activities.slice(0, 3).map((activity, i) => (
                                <li key={i} className="truncate">
                                  - {activity}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pipeline Tab - Health Checks */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Pipeline Health</h2>
                {lastRun && (
                  <p className="text-sm text-gray-500 mt-1">
                    Last checked: {lastRun.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    overallStatus === 'healthy'
                      ? 'bg-green-100 text-green-700'
                      : overallStatus === 'warning'
                      ? 'bg-yellow-100 text-yellow-700'
                      : overallStatus === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {overallStatus === 'healthy' && <CheckCircle2 size={16} />}
                  {overallStatus === 'warning' && <AlertTriangle size={16} />}
                  {overallStatus === 'critical' && <XCircle size={16} />}
                  {overallStatus === 'unknown' && <Activity size={16} />}
                  <span className="capitalize">{overallStatus}</span>
                </div>
                <button
                  onClick={runChecks}
                  disabled={isRunning}
                  className="btn btn-secondary inline-flex items-center gap-2"
                >
                  <RefreshCw size={18} className={isRunning ? 'animate-spin' : ''} />
                  Run Checks
                </button>
              </div>
            </div>

            {/* Health Checks by Campaign */}
            {campaigns.map((campaign) => {
              const campaignChecks = checksByCampaign[campaign.id] || [];
              const passCount = campaignChecks.filter((c) => c.status === 'pass').length;
              const failCount = campaignChecks.filter((c) => c.status === 'fail').length;
              const warningCount = campaignChecks.filter((c) => c.status === 'warning').length;

              return (
                <div key={campaign.id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      <p className="text-sm text-gray-500">
                        {passCount} passed | {warningCount} warnings | {failCount} failed
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600">{passCount}/8 checks</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${(passCount / 8) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {campaignChecks.map((check) => {
                      const Icon = healthIcons[check.category] || Activity;
                      return (
                        <div
                          key={check.id}
                          className={`p-3 rounded-lg border ${
                            check.status === 'pass'
                              ? 'border-green-200 bg-green-50'
                              : check.status === 'warning'
                              ? 'border-yellow-200 bg-yellow-50'
                              : check.status === 'fail'
                              ? 'border-red-200 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon
                              size={16}
                              className={
                                check.status === 'pass'
                                  ? 'text-green-600'
                                  : check.status === 'warning'
                                  ? 'text-yellow-600'
                                  : check.status === 'fail'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }
                            />
                            <span className="font-medium text-sm text-gray-900">
                              {check.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{check.message}</p>
                          <div className="mt-2">
                            {check.status === 'pass' && (
                              <CheckCircle2 size={14} className="text-green-500" />
                            )}
                            {check.status === 'warning' && (
                              <AlertTriangle size={14} className="text-yellow-500" />
                            )}
                            {check.status === 'fail' && (
                              <XCircle size={14} className="text-red-500" />
                            )}
                            {check.status === 'pending' && (
                              <Clock size={14} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Automation Tab - Quick Actions */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Newsletter Brief */}
              <div className="card card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Newsletter Brief</h3>
                    <p className="text-sm text-gray-500">Generate newsletter content</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Auto-generate newsletter briefs from campaign content with AI assistance.
                </p>
                <button className="btn btn-primary w-full">Generate Brief</button>
              </div>

              {/* ICS Export */}
              <div className="card card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">ICS Export</h3>
                    <p className="text-sm text-gray-500">Export to calendar</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Export all campaign events as ICS files for Google Calendar, Outlook, etc.
                </p>
                <button className="btn btn-secondary w-full inline-flex items-center justify-center gap-2">
                  <Download size={18} />
                  Export ICS
                </button>
              </div>

              {/* Status Report */}
              <div className="card card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Status Report</h3>
                    <p className="text-sm text-gray-500">Generate progress report</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Create a comprehensive status report of all campaigns for stakeholders.
                </p>
                <button className="btn btn-secondary w-full inline-flex items-center justify-center gap-2">
                  <FileDown size={18} />
                  Generate Report
                </button>
              </div>

              {/* Content Sync */}
              <div className="card card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <RefreshCw size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Content Sync</h3>
                    <p className="text-sm text-gray-500">Sync with platforms</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Synchronize content status with connected social media platforms.
                </p>
                <button className="btn btn-secondary w-full">Sync Now</button>
              </div>

              {/* AI Content Review */}
              <div className="card card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
                    <Eye size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Content Review</h3>
                    <p className="text-sm text-gray-500">Quality check all content</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Run AI review on all draft content for tone, grammar, and brand alignment.
                </p>
                <button className="btn btn-secondary w-full">Start Review</button>
              </div>

              {/* Bulk Schedule */}
              <div className="card card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Bulk Schedule</h3>
                    <p className="text-sm text-gray-500">Schedule all ready content</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Auto-schedule all approved content based on optimal posting times.
                </p>
                <button className="btn btn-secondary w-full">Schedule All</button>
              </div>
            </div>

            {/* Recent Automation Activity */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle2 size={20} className="text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Pipeline health checks completed
                    </p>
                    <p className="text-xs text-gray-500">
                      {lastRun?.toLocaleString() || 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <RefreshCw size={20} className="text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Campaigns refreshed
                    </p>
                    <p className="text-xs text-gray-500">
                      {aggregateStats.totalCampaigns} campaigns loaded
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
