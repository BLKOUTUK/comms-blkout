/**
 * Merged Content Calendar
 * Combines Campaign Dashboard and Content Calendar functionality
 *
 * Features:
 * - Calendar View: Month grid with generous space (scrollable day cells for 5+ posts)
 * - List View: Sortable table with filters
 * - Campaign filter/selector
 * - Pipeline health panel
 * - Quick actions (newsletter brief, ICS export, status report)
 * - ContentEditor integration for editing content
 *
 * Design inspiration: Hootsuite, PostSyncer, Sked Social
 * https://blog.hootsuite.com/social-media-calendar/
 * https://postsyncer.com/blog/social-media-content-calendar-examples
 */

import { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import {
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Mail,
  FileDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Image,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Video,
  PlayCircle,
  FileText,
  Edit,
  Eye,
  ArrowUpDown,
  Loader2,
  Activity,
  Zap,
  Send,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isValid,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { useCampaigns, usePipelineHealth } from '@/hooks/useCampaign';
import { useContentEditor } from '@/hooks/useContentEditor';
import { ContentEditor } from '@/components/campaigns/ContentEditor';
import type {
  CampaignContentItem,
  ContentItemStatus,
} from '@/types/campaign';

// View modes
type ViewMode = 'calendar' | 'list';
type SortField = 'date' | 'title' | 'platform' | 'status' | 'campaign';
type SortDirection = 'asc' | 'desc';

// Platform configuration
const platformIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  tiktok: Video,
  youtube: PlayCircle,
  email: Mail,
  newsletter: Mail,
  website: FileText,
  internal: FileText,
  all: Activity,
};

const platformColors: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  twitter: 'bg-sky-500',
  linkedin: 'bg-blue-700',
  facebook: 'bg-blue-600',
  tiktok: 'bg-black',
  youtube: 'bg-red-600',
  email: 'bg-green-600',
  newsletter: 'bg-emerald-600',
  website: 'bg-gray-700',
  internal: 'bg-gray-500',
  all: 'bg-blkout-600',
};

const platformDotColors: Record<string, string> = {
  instagram: 'bg-pink-500',
  twitter: 'bg-sky-500',
  linkedin: 'bg-blue-700',
  facebook: 'bg-blue-600',
  tiktok: 'bg-purple-600',
  youtube: 'bg-red-600',
  email: 'bg-green-600',
  newsletter: 'bg-emerald-600',
  website: 'bg-gray-700',
  internal: 'bg-gray-500',
  all: 'bg-blkout-600',
};

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  twitter: 'X/Twitter',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  email: 'Email',
  newsletter: 'Newsletter',
  website: 'Website',
  internal: 'Internal',
  all: 'All Platforms',
};

const statusConfig: Record<ContentItemStatus, { bg: string; text: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft', icon: FileText },
  ready: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Ready', icon: CheckCircle2 },
  scheduled: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Scheduled', icon: Clock },
  published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Published', icon: CheckCircle2 },
};

// Extended content item with campaign info
interface ContentWithCampaign extends CampaignContentItem {
  campaignId: string;
  campaignName: string;
}

export function ContentCalendar() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showPipelineHealth, setShowPipelineHealth] = useState(true);

  // List view sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Selected content for detail view
  const [selectedContent, setSelectedContent] = useState<ContentWithCampaign | null>(null);

  // Load campaigns and health checks
  const { campaigns, isLoading, error, refresh } = useCampaigns();
  const { checks, isRunning, lastRun, overallStatus, runChecks } = usePipelineHealth(campaigns);

  // Content editor
  const contentEditor = useContentEditor();

  // Get all content items across campaigns
  const allContentItems = useMemo((): ContentWithCampaign[] => {
    return campaigns.flatMap((c) =>
      c.contentItems.map((item) => ({
        ...item,
        campaignId: c.id,
        campaignName: c.name,
      }))
    );
  }, [campaigns]);

  // Filter content items
  const filteredContent = useMemo(() => {
    return allContentItems.filter((item) => {
      const matchesCampaign = selectedCampaign === 'all' || item.campaignId === selectedCampaign;
      const matchesPlatform = selectedPlatform === 'all' || item.platform === selectedPlatform || item.platform === 'all';
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchesCampaign && matchesPlatform && matchesStatus;
    });
  }, [allContentItems, selectedCampaign, selectedPlatform, selectedStatus]);

  // Calendar date calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get content for a specific day
  const getContentForDay = useCallback((day: Date): ContentWithCampaign[] => {
    return filteredContent.filter((item) => {
      if (!item.scheduledFor && !item.timing) return false;

      // Try to parse scheduledFor date
      if (item.scheduledFor) {
        const itemDate = item.scheduledFor instanceof Date
          ? item.scheduledFor
          : parseISO(String(item.scheduledFor));
        if (isValid(itemDate) && isSameDay(itemDate, day)) {
          return true;
        }
      }

      // Try to parse timing string (e.g., "Week 1", "Feb 14")
      if (item.timing) {
        const timingMatch = item.timing.match(/(\w+ \d+)/);
        if (timingMatch) {
          const timingDate = new Date(`${timingMatch[1]}, 2026`);
          if (isValid(timingDate) && isSameDay(timingDate, day)) {
            return true;
          }
        }
      }

      return false;
    });
  }, [filteredContent]);

  // Sort content for list view
  const sortedContent = useMemo(() => {
    const sorted = [...filteredContent].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          const dateA = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
          const dateB = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'platform':
          comparison = a.platform.localeCompare(b.platform);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'campaign':
          comparison = a.campaignName.localeCompare(b.campaignName);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredContent, sortField, sortDirection]);

  // Handle sort change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle edit content
  const handleEditContent = (item: ContentWithCampaign) => {
    contentEditor.openEditor(item, item.campaignId);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredContent.length;
    const scheduled = filteredContent.filter(i => i.status === 'scheduled').length;
    const published = filteredContent.filter(i => i.status === 'published').length;
    const draft = filteredContent.filter(i => i.status === 'draft').length;
    const ready = filteredContent.filter(i => i.status === 'ready').length;

    const platforms = new Set(filteredContent.map(i => i.platform));

    return { total, scheduled, published, draft, ready, platformCount: platforms.size };
  }, [filteredContent]);

  // Health checks grouped by status
  const healthSummary = useMemo(() => {
    const pass = checks.filter(c => c.status === 'pass').length;
    const warning = checks.filter(c => c.status === 'warning').length;
    const fail = checks.filter(c => c.status === 'fail').length;
    return { pass, warning, fail, total: checks.length };
  }, [checks]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin text-blkout-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading content calendar...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load content</h2>
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Content Calendar</h1>
            <p className="text-gray-600 mt-1">Schedule, manage, and track content across campaigns</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <FileText size={16} />
                {stats.total} items
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                {stats.scheduled} scheduled
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 size={16} />
                {stats.published} published
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refresh}
              disabled={isLoading}
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <a href="/admin/editorial" className="btn btn-primary inline-flex items-center gap-2">
              <Send size={18} />
              Create Content
            </a>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              {/* Campaign Filter */}
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="input min-w-[180px] text-sm"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Platform Filter */}
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="input min-w-[150px] text-sm"
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">X/Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="email">Email</option>
                <option value="newsletter">Newsletter</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input min-w-[130px] text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-blkout-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar size={16} />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blkout-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List size={16} />
                List
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className={`flex-1 ${showPipelineHealth ? 'w-2/3' : 'w-full'}`}>
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div className="card">
                {/* Calendar Controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Previous month"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900 min-w-[180px] text-center">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <button
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Next month"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(new Date())}
                      className="btn btn-secondary text-sm"
                    >
                      Today
                    </button>
                  </div>

                  {/* Platform Legend */}
                  <div className="flex items-center gap-3 text-xs">
                    {['instagram', 'linkedin', 'twitter', 'tiktok', 'email'].map((platform) => (
                      <div key={platform} className="flex items-center gap-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${platformDotColors[platform]}`} />
                        <span className="text-gray-600 capitalize">{platform}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid - Generous day cells with scroll */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const dayContent = getContentForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDayToday = isToday(day);
                    const hasOverflow = dayContent.length > 4;

                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[180px] max-h-[220px] border rounded-lg p-2 flex flex-col ${
                          isCurrentMonth ? 'bg-white' : 'bg-gray-50 opacity-60'
                        } ${isDayToday ? 'border-blkout-600 border-2 ring-2 ring-blkout-100' : 'border-gray-200'}`}
                      >
                        {/* Day Number */}
                        <div className="flex items-center justify-between mb-2 flex-shrink-0">
                          <div
                            className={`text-sm font-medium ${
                              isDayToday
                                ? 'bg-blkout-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
                                : 'text-gray-700'
                            }`}
                          >
                            {format(day, 'd')}
                          </div>
                          {dayContent.length > 0 && (
                            <span className="text-xs text-gray-400 font-medium">
                              {dayContent.length} post{dayContent.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Content Items - Scrollable */}
                        <div className={`flex-1 space-y-1.5 ${hasOverflow ? 'overflow-y-auto pr-1' : ''}`}>
                          {dayContent.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => setSelectedContent(item)}
                                className={`p-2 rounded-md border-l-3 hover:shadow-sm cursor-pointer transition-all group ${
                                  selectedContent?.id === item.id
                                    ? 'bg-blkout-50 border-l-blkout-600'
                                    : 'bg-gray-50 border-l-transparent hover:bg-gray-100 hover:border-l-gray-300'
                                }`}
                                style={{ borderLeftWidth: '3px', borderLeftColor: selectedContent?.id === item.id ? undefined : platformDotColors[item.platform]?.replace('bg-', '') }}
                              >
                                <div className="flex items-start gap-1.5">
                                  {/* Platform Indicator */}
                                  <div className="flex gap-0.5 mt-0.5 flex-shrink-0">
                                    <div
                                      className={`w-2 h-2 rounded-full ${platformDotColors[item.platform]}`}
                                      title={platformLabels[item.platform]}
                                    />
                                  </div>

                                  {/* Content Title */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {item.title}
                                    </p>
                                    <p className="text-[10px] text-gray-500 truncate">
                                      {item.campaignName}
                                    </p>
                                  </div>

                                  {/* Quick Actions */}
                                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 flex-shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditContent(item);
                                      }}
                                      className="p-0.5 hover:bg-blkout-100 rounded text-blkout-600"
                                      title="Edit"
                                    >
                                      <Edit size={10} />
                                    </button>
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center gap-1 mt-1">
                                  {Boolean(item.metadata?.hasMedia) && (
                                    <Image size={8} className="text-gray-400" />
                                  )}
                                  <span className={`text-[9px] px-1 py-0.5 rounded ${statusConfig[item.status].bg} ${statusConfig[item.status].text}`}>
                                    {statusConfig[item.status].label}
                                  </span>
                                </div>
                              </div>
                          ))}
                        </div>

                        {/* Overflow indicator */}
                        {hasOverflow && (
                          <div className="text-[10px] text-gray-400 text-center pt-1 flex-shrink-0 border-t border-gray-100 mt-1">
                            Scroll for more
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">
                          <button
                            onClick={() => handleSort('title')}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                          >
                            Title
                            <ArrowUpDown size={12} className={sortField === 'title' ? 'text-blkout-600' : ''} />
                          </button>
                        </th>
                        <th className="text-left py-3 px-4">
                          <button
                            onClick={() => handleSort('campaign')}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                          >
                            Campaign
                            <ArrowUpDown size={12} className={sortField === 'campaign' ? 'text-blkout-600' : ''} />
                          </button>
                        </th>
                        <th className="text-left py-3 px-4">
                          <button
                            onClick={() => handleSort('platform')}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                          >
                            Platform
                            <ArrowUpDown size={12} className={sortField === 'platform' ? 'text-blkout-600' : ''} />
                          </button>
                        </th>
                        <th className="text-left py-3 px-4">
                          <button
                            onClick={() => handleSort('date')}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                          >
                            Date
                            <ArrowUpDown size={12} className={sortField === 'date' ? 'text-blkout-600' : ''} />
                          </button>
                        </th>
                        <th className="text-left py-3 px-4">
                          <button
                            onClick={() => handleSort('status')}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                          >
                            Status
                            <ArrowUpDown size={12} className={sortField === 'status' ? 'text-blkout-600' : ''} />
                          </button>
                        </th>
                        <th className="text-right py-3 px-4">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedContent.map((item) => {
                        const Icon = platformIcons[item.platform] || FileText;
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-gray-50 transition-colors ${
                              selectedContent?.id === item.id ? 'bg-blkout-50' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg ${platformColors[item.platform]} flex items-center justify-center text-white flex-shrink-0`}
                                >
                                  <Icon size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 truncate max-w-[250px]">
                                    {item.title}
                                  </p>
                                  {item.timing && (
                                    <p className="text-xs text-gray-500">{item.timing}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-sm text-gray-600">{item.campaignName}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${platformDotColors[item.platform]}`} />
                                <span className="text-sm text-gray-600 capitalize">
                                  {platformLabels[item.platform] || item.platform}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Clock size={14} className="text-gray-400" />
                                {item.scheduledFor
                                  ? format(new Date(item.scheduledFor), 'MMM d, yyyy')
                                  : item.timing || '—'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].bg} ${statusConfig[item.status].text}`}
                              >
                                {statusConfig[item.status].label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedContent(item)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                                  title="View details"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleEditContent(item)}
                                  className="p-1.5 hover:bg-blkout-50 rounded-lg text-blkout-600 hover:text-blkout-700"
                                  title="Edit content"
                                >
                                  <Edit size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {sortedContent.length === 0 && (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No content found</h3>
                    <p className="text-gray-600">
                      Try adjusting your filters or create new content.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Pipeline Health & Quick Actions */}
          {showPipelineHealth && (
            <div className="w-80 space-y-4 flex-shrink-0">
              {/* Selected Content Detail */}
              {selectedContent && (
                <div className="card">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Content Details</h3>
                    <button
                      onClick={() => setSelectedContent(null)}
                      className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                    >
                      ×
                    </button>
                  </div>

                  {/* Platform Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    {(() => {
                      const Icon = platformIcons[selectedContent.platform] || FileText;
                      return (
                        <div className={`w-8 h-8 rounded-lg ${platformColors[selectedContent.platform]} flex items-center justify-center text-white`}>
                          <Icon size={16} />
                        </div>
                      );
                    })()}
                    <div>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {platformLabels[selectedContent.platform]}
                      </span>
                      <p className="text-xs text-gray-500">{selectedContent.campaignName}</p>
                    </div>
                  </div>

                  {/* Title & Content */}
                  <h4 className="font-medium text-gray-900 mb-2">{selectedContent.title}</h4>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-4">
                    {Array.isArray(selectedContent.content)
                      ? selectedContent.content.join('\n')
                      : selectedContent.content}
                  </p>

                  {/* Status & Timing */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedContent.status].bg} ${statusConfig[selectedContent.status].text}`}>
                      {statusConfig[selectedContent.status].label}
                    </span>
                    {selectedContent.timing && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {selectedContent.timing}
                      </span>
                    )}
                  </div>

                  {/* Hashtags */}
                  {selectedContent.hashtags && selectedContent.hashtags.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Hashtags</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedContent.hashtags.slice(0, 5).map((tag, i) => (
                          <span key={i} className="text-xs text-blkout-600">
                            #{tag}
                          </span>
                        ))}
                        {selectedContent.hashtags.length > 5 && (
                          <span className="text-xs text-gray-400">
                            +{selectedContent.hashtags.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEditContent(selectedContent)}
                      className="btn btn-primary flex-1 text-sm"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </button>
                  </div>
                </div>
              )}

              {/* Pipeline Health */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-blkout-600" />
                    <h3 className="font-semibold text-gray-900">Pipeline Health</h3>
                  </div>
                  <button
                    onClick={runChecks}
                    disabled={isRunning}
                    className="text-blkout-600 hover:text-blkout-700 p-1"
                    title="Run health checks"
                  >
                    <RefreshCw size={16} className={isRunning ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Overall Status */}
                <div className={`p-3 rounded-lg mb-4 ${
                  overallStatus === 'healthy' ? 'bg-green-50' :
                  overallStatus === 'warning' ? 'bg-yellow-50' :
                  overallStatus === 'critical' ? 'bg-red-50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {overallStatus === 'healthy' && <CheckCircle2 size={20} className="text-green-600" />}
                    {overallStatus === 'warning' && <AlertTriangle size={20} className="text-yellow-600" />}
                    {overallStatus === 'critical' && <XCircle size={20} className="text-red-600" />}
                    {overallStatus === 'unknown' && <Activity size={20} className="text-gray-600" />}
                    <span className={`font-medium capitalize ${
                      overallStatus === 'healthy' ? 'text-green-700' :
                      overallStatus === 'warning' ? 'text-yellow-700' :
                      overallStatus === 'critical' ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {overallStatus} Status
                    </span>
                  </div>
                </div>

                {/* Health Summary */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{healthSummary.pass}</div>
                    <div className="text-xs text-green-700">Passed</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">{healthSummary.warning}</div>
                    <div className="text-xs text-yellow-700">Warnings</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{healthSummary.fail}</div>
                    <div className="text-xs text-red-700">Failed</div>
                  </div>
                </div>

                {lastRun && (
                  <p className="text-xs text-gray-500 text-center">
                    Last checked: {format(lastRun, 'h:mm a')}
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Newsletter Brief</p>
                      <p className="text-xs text-gray-500">Generate from content</p>
                    </div>
                  </button>

                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Download size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Export ICS</p>
                      <p className="text-xs text-gray-500">Calendar file</p>
                    </div>
                  </button>

                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                      <FileDown size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status Report</p>
                      <p className="text-xs text-gray-500">Generate summary</p>
                    </div>
                  </button>

                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                      <Zap size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Bulk Schedule</p>
                      <p className="text-xs text-gray-500">Auto-schedule ready content</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Toggle Panel Button */}
              <button
                onClick={() => setShowPipelineHealth(false)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Hide panel
              </button>
            </div>
          )}

          {/* Show Panel Button (when hidden) */}
          {!showPipelineHealth && (
            <button
              onClick={() => setShowPipelineHealth(true)}
              className="fixed right-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-lg p-2 shadow-lg hover:shadow-xl transition-shadow"
              title="Show pipeline health"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {/* Platform Legend (bottom) */}
        {viewMode === 'calendar' && (
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <span className="text-sm font-medium text-gray-700">Platforms:</span>
                {Object.entries(platformDotColors)
                  .filter(([key]) => !['all', 'internal', 'website'].includes(key))
                  .map(([platform, color]) => (
                    <div key={platform} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span className="text-sm text-gray-600">
                        {platformLabels[platform] || platform}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${config.bg.replace('bg-', 'bg-').replace('-100', '-500')}`} />
                    <span className="text-sm text-gray-600">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Editor Modal */}
      <ContentEditor
        content={contentEditor.selectedContent}
        isOpen={contentEditor.isOpen}
        onClose={contentEditor.closeEditor}
        onSave={async (record) => {
          await contentEditor.saveAndClose(record);
          refresh();
        }}
        campaignId={contentEditor.contentRecord?.campaignId || ''}
      />
    </Layout>
  );
}
