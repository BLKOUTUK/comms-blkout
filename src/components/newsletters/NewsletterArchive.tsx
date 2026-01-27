/**
 * Newsletter Archive Component
 *
 * Admin view of sent newsletter editions with metrics, duplicate, and resend options.
 * Part of Phase 2.2 Newsletter Generation Engine.
 */

import { useState } from 'react';
import {
  Archive,
  Mail,
  Eye,
  Copy,
  RotateCcw,
  Download,
  Calendar,
  Users,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  ChevronRight,
  BarChart3,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { NewsletterEdition } from '@/hooks/useNewsletter';

interface NewsletterArchiveProps {
  editions: NewsletterEdition[];
  onDuplicate: (edition: NewsletterEdition) => Promise<void>;
  onResend: (edition: NewsletterEdition) => Promise<void>;
  onPreview: (editionId: string) => void;
  onExport: (editionId: string, format: 'html' | 'json' | 'text') => void;
  isLoading?: boolean;
}

interface ArchiveFilters {
  type: 'all' | 'weekly' | 'monthly';
  search: string;
  sortBy: 'date' | 'performance';
}

export function NewsletterArchiveAdmin({
  editions,
  onDuplicate,
  onResend,
  onPreview,
  onExport,
  isLoading = false,
}: NewsletterArchiveProps) {
  const [filters, setFilters] = useState<ArchiveFilters>({
    type: 'all',
    search: '',
    sortBy: 'date',
  });
  const [expandedEdition, setExpandedEdition] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter sent editions only
  const sentEditions = editions.filter(e => e.status === 'sent');

  // Apply filters
  const filteredEditions = sentEditions
    .filter(e => {
      const matchesType =
        filters.type === 'all' ||
        (filters.type === 'weekly' && e.subscriberTier === 'weekly_engaged') ||
        (filters.type === 'monthly' && e.subscriberTier === 'monthly_circle');
      const matchesSearch =
        !filters.search ||
        e.subject.toLowerCase().includes(filters.search.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'performance') {
        return (b.openRate || 0) - (a.openRate || 0);
      }
      return (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0);
    });

  // Calculate aggregate metrics
  const aggregateMetrics = {
    totalSent: sentEditions.length,
    avgOpenRate: sentEditions.length > 0
      ? sentEditions.reduce((sum, e) => sum + (e.openRate || 0), 0) / sentEditions.length
      : 0,
    avgClickRate: sentEditions.length > 0
      ? sentEditions.reduce((sum, e) => sum + (e.clickRate || 0), 0) / sentEditions.length
      : 0,
    totalUnsubscribes: sentEditions.reduce((sum, e) => sum + (e.unsubscribes || 0), 0),
  };

  // Performance indicator
  const getPerformanceIndicator = (rate: number | null, benchmark: number) => {
    if (rate === null) return null;
    if (rate > benchmark * 1.1) return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' };
    if (rate < benchmark * 0.9) return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' };
    return { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50' };
  };

  // Handle duplicate
  const handleDuplicate = async (edition: NewsletterEdition) => {
    setActionLoading(`duplicate-${edition.id}`);
    try {
      await onDuplicate(edition);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle resend
  const handleResend = async (edition: NewsletterEdition) => {
    if (!confirm('Are you sure you want to resend this newsletter? This will create a new campaign in SendFox.')) {
      return;
    }
    setActionLoading(`resend-${edition.id}`);
    try {
      await onResend(edition);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blkout-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Archive className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Newsletter Archive</h2>
            <p className="text-sm text-gray-600">
              {sentEditions.length} newsletter{sentEditions.length !== 1 ? 's' : ''} sent to the community
            </p>
          </div>
        </div>
      </div>

      {/* Aggregate Metrics */}
      {sentEditions.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blkout-50 to-purple-50 border-blkout-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-blkout-600">{aggregateMetrics.totalSent}</p>
              </div>
              <Mail className="h-8 w-8 text-blkout-400" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Open Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {aggregateMetrics.avgOpenRate.toFixed(1)}%
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Click Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {aggregateMetrics.avgClickRate.toFixed(1)}%
                </p>
              </div>
              <MousePointerClick className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Unsubscribes</p>
                <p className="text-2xl font-bold text-amber-600">{aggregateMetrics.totalUnsubscribes}</p>
              </div>
              <Users className="h-8 w-8 text-amber-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search newsletters..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-blkout-500"
          />
        </div>

        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(['all', 'weekly', 'monthly'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilters({ ...filters, type })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filters.type === type
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as 'date' | 'performance' })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blkout-500"
          >
            <option value="date">Sort by Date</option>
            <option value="performance">Sort by Performance</option>
          </select>
        </div>
      </div>

      {/* Archive List */}
      {filteredEditions.length === 0 ? (
        <div className="card text-center py-12">
          <Archive className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No newsletters found</h3>
          <p className="text-gray-600">
            {sentEditions.length === 0
              ? 'Newsletters will appear here after they have been sent.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEditions.map((edition) => {
            const isExpanded = expandedEdition === edition.id;
            const openPerf = getPerformanceIndicator(edition.openRate, 40);
            const clickPerf = getPerformanceIndicator(edition.clickRate, 5);

            return (
              <div
                key={edition.id}
                className="card border border-gray-200 hover:border-green-200 transition-all"
              >
                {/* Main Row */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedEdition(isExpanded ? null : edition.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      edition.subscriberTier === 'weekly_engaged'
                        ? 'bg-blkout-100 text-blkout-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      <Mail size={18} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500">#{edition.editionNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          edition.subscriberTier === 'weekly_engaged'
                            ? 'bg-blkout-100 text-blkout-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {edition.subscriberTier === 'weekly_engaged' ? 'Weekly' : 'Monthly'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={12} />
                          Sent
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">{edition.subject}</h3>
                      {edition.sentAt && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar size={12} />
                          Sent {format(edition.sentAt, 'MMM d, yyyy')} at {format(edition.sentAt, 'HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Performance Metrics */}
                    <div className="flex items-center gap-4">
                      {edition.openRate !== null && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${openPerf?.bg || 'bg-gray-50'}`}>
                          {openPerf && <openPerf.icon size={14} className={openPerf.color} />}
                          <span className="text-sm font-medium text-gray-700">
                            {edition.openRate.toFixed(1)}% opened
                          </span>
                        </div>
                      )}
                      {edition.clickRate !== null && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${clickPerf?.bg || 'bg-gray-50'}`}>
                          {clickPerf && <clickPerf.icon size={14} className={clickPerf.color} />}
                          <span className="text-sm font-medium text-gray-700">
                            {edition.clickRate.toFixed(1)}% clicked
                          </span>
                        </div>
                      )}
                    </div>

                    <ChevronRight
                      size={20}
                      className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Detailed Metrics */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <BarChart3 size={14} />
                          Performance Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Open Rate</span>
                            <span className="font-medium">{edition.openRate?.toFixed(1) || '—'}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Click Rate</span>
                            <span className="font-medium">{edition.clickRate?.toFixed(1) || '—'}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Unsubscribes</span>
                            <span className="font-medium">{edition.unsubscribes || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Content Blocks</span>
                            <span className="font-medium">{edition.contentItems.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview(edition.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                          >
                            <Eye size={14} />
                            Preview
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(edition);
                            }}
                            disabled={actionLoading === `duplicate-${edition.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blkout-100 text-blkout-700 rounded-lg hover:bg-blkout-200 text-sm disabled:opacity-50"
                          >
                            {actionLoading === `duplicate-${edition.id}` ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Copy size={14} />
                            )}
                            Duplicate
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResend(edition);
                            }}
                            disabled={actionLoading === `resend-${edition.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm disabled:opacity-50"
                          >
                            {actionLoading === `resend-${edition.id}` ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <RotateCcw size={14} />
                            )}
                            Resend
                          </button>

                          <div className="relative group">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                              <Download size={14} />
                              Export
                            </button>
                            <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg py-1 hidden group-hover:block z-10 min-w-[120px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExport(edition.id, 'html');
                                }}
                                className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                              >
                                HTML
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExport(edition.id, 'text');
                                }}
                                className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                              >
                                Plain Text
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExport(edition.id, 'json');
                                }}
                                className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
                              >
                                JSON
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Items Summary */}
                    {edition.contentItems.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Content Included</h4>
                        <div className="flex flex-wrap gap-2">
                          {edition.contentItems.slice(0, 5).map((item, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                            >
                              {item.title.substring(0, 30)}{item.title.length > 30 ? '...' : ''}
                            </span>
                          ))}
                          {edition.contentItems.length > 5 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              +{edition.contentItems.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NewsletterArchiveAdmin;
