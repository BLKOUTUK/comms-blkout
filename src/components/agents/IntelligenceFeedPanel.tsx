
import { useState, useMemo } from 'react';
import {
  Brain, Lightbulb, Target, AlertTriangle, Clock, RefreshCw,
  TrendingUp, Tag, ChevronDown, ChevronUp, Zap, Eye, CheckCircle,
  Filter, Database, Sparkles
} from 'lucide-react';
import { formatDistanceToNow, isAfter } from 'date-fns';
import type { AgentIntelligence, MemberActivityDashboard } from '@/hooks/useAgentIntelligence';
import type { AgentType } from '@/types';

interface IntelligenceFeedPanelProps {
  intelligence: AgentIntelligence[];
  dashboard: MemberActivityDashboard | null;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
  onMarkUsed?: (intelligenceId: string) => void;
  selectedAgent?: AgentType | null;
}

const PRIORITY_STYLES = {
  critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  high: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  medium: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  low: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' },
};

const URGENCY_ICONS = {
  immediate: AlertTriangle,
  elevated: Zap,
  normal: Clock,
  low: Clock,
};

const IVOR_SERVICE_COLORS: Record<string, string> = {
  blkouthub: 'bg-purple-100 text-purple-700',
  conversations: 'bg-blue-100 text-blue-700',
  resources: 'bg-green-100 text-green-700',
  events: 'bg-orange-100 text-orange-700',
  articles: 'bg-indigo-100 text-indigo-700',
  governance: 'bg-pink-100 text-pink-700',
};

export function IntelligenceFeedPanel({
  intelligence,
  dashboard,
  isLoading,
  error,
  onRefresh,
  onMarkUsed,
  selectedAgent,
}: IntelligenceFeedPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Get unique intelligence types
  const intelligenceTypes = useMemo(() => {
    const types = new Set(intelligence.map(i => i.intelligenceType));
    return Array.from(types);
  }, [intelligence]);

  // Filter intelligence
  const filteredIntelligence = useMemo(() => {
    return intelligence.filter(item => {
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
      if (filterType !== 'all' && item.intelligenceType !== filterType) return false;
      return true;
    });
  }, [intelligence, filterPriority, filterType]);

  // Group by priority
  const groupedByPriority = useMemo(() => {
    const critical = filteredIntelligence.filter(i => i.priority === 'critical');
    const high = filteredIntelligence.filter(i => i.priority === 'high');
    const other = filteredIntelligence.filter(i => i.priority !== 'critical' && i.priority !== 'high');
    return { critical, high, other };
  }, [filteredIntelligence]);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle size={20} />
          <span>Error loading intelligence: {error}</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AIvor Intelligence Feed</h3>
              <p className="text-sm text-gray-600">
                {selectedAgent
                  ? `Insights relevant to ${selectedAgent}`
                  : 'Community insights informing agent decisions'
                }
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Refresh intelligence"
            >
              <RefreshCw size={18} className="text-purple-600" />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white/70 rounded-lg p-3 text-center">
            <span className="text-2xl font-bold text-purple-700">{intelligence.length}</span>
            <p className="text-xs text-gray-600">Total Insights</p>
          </div>
          <div className="bg-white/70 rounded-lg p-3 text-center">
            <span className="text-2xl font-bold text-red-600">
              {groupedByPriority.critical.length}
            </span>
            <p className="text-xs text-gray-600">Critical</p>
          </div>
          <div className="bg-white/70 rounded-lg p-3 text-center">
            <span className="text-2xl font-bold text-amber-600">
              {groupedByPriority.high.length}
            </span>
            <p className="text-xs text-gray-600">High Priority</p>
          </div>
          <div className="bg-white/70 rounded-lg p-3 text-center">
            <span className="text-2xl font-bold text-green-600">
              {intelligence.filter(i => !i.isExpired).length}
            </span>
            <p className="text-xs text-gray-600">Active</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600">Filter:</span>
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Types</option>
          {intelligenceTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {(filterPriority !== 'all' || filterType !== 'all') && (
          <button
            onClick={() => { setFilterPriority('all'); setFilterType('all'); }}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Intelligence Feed */}
      {filteredIntelligence.length > 0 ? (
        <div className="space-y-3">
          {filteredIntelligence.map((item) => {
            const isExpanded = expandedId === item.id;
            const priorityStyle = PRIORITY_STYLES[item.priority];
            const UrgencyIcon = URGENCY_ICONS[item.urgency];
            const isFresh = item.expiresAt && isAfter(item.expiresAt, new Date());

            return (
              <div
                key={item.id}
                className={`rounded-xl border-2 overflow-hidden transition-all ${priorityStyle.border} ${priorityStyle.bg}`}
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        <UrgencyIcon size={18} className={priorityStyle.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityStyle.badge}`}>
                            {item.priority}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            IVOR_SERVICE_COLORS[item.ivorService] || 'bg-gray-100 text-gray-700'
                          }`}>
                            <Database size={10} className="inline mr-1" />
                            {item.ivorService}
                          </span>
                          {!isFresh && item.expiresAt && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.summary}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDistanceToNow(item.dataTimestamp, { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp size={12} />
                            {(item.relevanceScore * 100).toFixed(0)}% relevance
                          </span>
                          {item.timesUsed > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye size={12} />
                              Used {item.timesUsed}x
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-white/50 bg-white/50 p-4 space-y-4">
                    {/* Key Insights */}
                    {item.keyInsights.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                          <Lightbulb size={14} className="text-amber-500" />
                          Key Insights
                        </h4>
                        <ul className="space-y-1.5">
                          {item.keyInsights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actionable Items */}
                    {item.actionableItems.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                          <Target size={14} className="text-purple-500" />
                          Actionable Items
                        </h4>
                        <ul className="space-y-1.5">
                          {item.actionableItems.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <Zap size={14} className="text-purple-500 flex-shrink-0 mt-0.5" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag size={14} className="text-gray-400" />
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {onMarkUsed && (
                      <div className="pt-2 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkUsed(item.id);
                          }}
                          className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                          <CheckCircle size={14} />
                          Mark as used
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12 border-dashed">
          <Sparkles size={32} className="mx-auto text-gray-300 mb-3" />
          <h4 className="text-lg font-medium text-gray-700 mb-1">No Intelligence Available</h4>
          <p className="text-sm text-gray-500">
            {filterPriority !== 'all' || filterType !== 'all'
              ? 'No insights match the current filters'
              : 'AIvor intelligence data will appear here when available'
            }
          </p>
        </div>
      )}

      {/* Member Activity Summary (if dashboard available) */}
      {dashboard && (
        <MemberActivitySummary dashboard={dashboard} />
      )}
    </div>
  );
}

// Compact member activity summary
function MemberActivitySummary({ dashboard }: { dashboard: MemberActivityDashboard }) {
  return (
    <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-green-600" />
        Community Activity Snapshot
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/70 rounded-lg p-2 text-center">
          <span className="text-lg font-bold text-green-700">{dashboard.activeMembers}</span>
          <p className="text-xs text-gray-600">Active Members</p>
        </div>
        <div className="bg-white/70 rounded-lg p-2 text-center">
          <span className="text-lg font-bold text-purple-700">{dashboard.verifiedCreators}</span>
          <p className="text-xs text-gray-600">Creators</p>
        </div>
        <div className="bg-white/70 rounded-lg p-2 text-center">
          <span className="text-lg font-bold text-blue-700">{dashboard.weeklyEngagements}</span>
          <p className="text-xs text-gray-600">Weekly Activity</p>
        </div>
        <div className="bg-white/70 rounded-lg p-2 text-center">
          <span className="text-lg font-bold text-orange-700">{dashboard.eventsThisWeek}</span>
          <p className="text-xs text-gray-600">Events</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Updated {formatDistanceToNow(dashboard.generatedAt, { addSuffix: true })}
      </p>
    </div>
  );
}
