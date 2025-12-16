
import { useMemo } from 'react';
import {
  Users, UserCheck, UserPlus, Vote, MessageSquare, Calendar,
  FileText, TrendingUp, TrendingDown, Activity, Star, Mail,
  Clock, RefreshCw, AlertCircle, Sparkles, BarChart3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { MemberActivityDashboard as DashboardData } from '@/hooks/useAgentIntelligence';

interface MemberActivityDashboardProps {
  dashboard: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  previousDashboard?: DashboardData | null; // For trend comparison
  onRefresh?: () => void;
}

// Explicit color classes to ensure Tailwind compiles them
const colorClasses: Record<string, { bg: string; text: string }> = {
  blkout: { bg: 'bg-blkout-100', text: 'text-blkout-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  previousValue?: number;
  color: string;
  description?: string;
}

function StatCard({ icon: Icon, label, value, previousValue, color, description }: StatCardProps) {
  const trend = previousValue !== undefined ? value - previousValue : 0;
  const trendPercent = previousValue && previousValue > 0
    ? ((value - previousValue) / previousValue) * 100
    : 0;

  const colors = colorClasses[color] || colorClasses.gray;
  const trendDirection = trend > 0 ? 'increased' : 'decreased';
  const trendLabel = trend !== 0 ? `${trendDirection} by ${Math.abs(trendPercent).toFixed(0)}%` : '';

  return (
    <div className="card hover:shadow-md transition-shadow" role="group" aria-label={`${label} statistics`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-gray-600" id={`stat-label-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
          <Icon size={18} className={colors.text} aria-hidden="true" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900" aria-label={`${value} ${label}`}>
          {value}
        </span>
        {previousValue !== undefined && trend !== 0 && (
          <span
            className={`flex items-center text-sm font-medium ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}
            aria-label={trendLabel}
          >
            {trend > 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
            <span aria-hidden="true">{Math.abs(trendPercent).toFixed(0)}%</span>
            <span className="sr-only">{trendLabel}</span>
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
}

export function MemberActivityDashboard({
  dashboard,
  isLoading,
  error,
  previousDashboard,
  onRefresh,
}: MemberActivityDashboardProps) {
  // Calculate engagement metrics
  const metrics = useMemo(() => {
    if (!dashboard) return null;

    const totalGovernanceActivity =
      dashboard.activeVoters +
      dashboard.activeProposers +
      dashboard.activeFacilitators;

    const totalWeeklyActivity =
      dashboard.weeklyEngagements +
      dashboard.weeklyRatings +
      dashboard.weeklyConversations;

    const engagementRate = dashboard.activeMembers > 0
      ? (totalWeeklyActivity / dashboard.activeMembers) * 100
      : 0;

    return {
      totalGovernanceActivity,
      totalWeeklyActivity,
      engagementRate,
    };
  }, [dashboard]);

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading member activity dashboard...</span>
        <div className="card animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" aria-hidden="true"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" aria-hidden="true"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50" role="alert" aria-live="assertive">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={20} aria-hidden="true" />
          <span>Error loading member activity: {error}</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
            aria-label="Retry loading member activity data"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="card text-center py-12 border-dashed">
        <Sparkles size={32} className="mx-auto text-gray-300 mb-3" />
        <h4 className="text-lg font-medium text-gray-700 mb-1">No Activity Data</h4>
        <p className="text-sm text-gray-500">
          Member activity data will appear here when available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blkout-100 rounded-lg flex items-center justify-center">
            <Activity size={24} className="text-blkout-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Member Activity Dashboard</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Clock size={12} />
              Updated {formatDistanceToNow(dashboard.generatedAt, { addSuffix: true })}
            </p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blkout-500 focus:ring-offset-2"
            aria-label="Refresh member activity data"
          >
            <RefreshCw size={18} className="text-gray-600" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Quick Overview */}
      <section className="card bg-gradient-to-r from-blkout-50 to-purple-50 border-blkout-200" aria-labelledby="community-overview-heading">
        <h4 id="community-overview-heading" className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-blkout-600" aria-hidden="true" />
          Community Overview
        </h4>
        <div className="grid grid-cols-3 gap-4" role="list">
          <div className="text-center" role="listitem">
            <span className="text-4xl font-bold text-blkout-700" aria-label={`${dashboard.activeMembers} active members`}>
              {dashboard.activeMembers}
            </span>
            <p className="text-sm text-gray-600">Active Members</p>
          </div>
          <div className="text-center" role="listitem">
            <span className="text-4xl font-bold text-green-600" aria-label={`${metrics?.engagementRate.toFixed(0)} percent engagement rate`}>
              {metrics?.engagementRate.toFixed(0)}%
            </span>
            <p className="text-sm text-gray-600">Engagement Rate</p>
          </div>
          <div className="text-center" role="listitem">
            <span className="text-4xl font-bold text-purple-600" aria-label={`${metrics?.totalWeeklyActivity} weekly actions`}>
              {metrics?.totalWeeklyActivity}
            </span>
            <p className="text-sm text-gray-600">Weekly Actions</p>
          </div>
        </div>
      </section>

      {/* Member Stats Grid */}
      <section aria-labelledby="member-breakdown-heading">
        <h4 id="member-breakdown-heading" className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Users size={16} aria-hidden="true" />
          Member Breakdown
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Active Members"
            value={dashboard.activeMembers}
            previousValue={previousDashboard?.activeMembers}
            color="blkout"
            description="Currently engaged"
          />
          <StatCard
            icon={UserCheck}
            label="Verified Creators"
            value={dashboard.verifiedCreators}
            previousValue={previousDashboard?.verifiedCreators}
            color="purple"
            description="Verified contributors"
          />
          <StatCard
            icon={UserPlus}
            label="Pending Members"
            value={dashboard.pendingMembers}
            previousValue={previousDashboard?.pendingMembers}
            color="amber"
            description="Awaiting verification"
          />
          <StatCard
            icon={Vote}
            label="Active Voters"
            value={dashboard.activeVoters}
            previousValue={previousDashboard?.activeVoters}
            color="blue"
            description="Governance participants"
          />
        </div>
      </section>

      {/* Governance Activity */}
      <section aria-labelledby="governance-activity-heading">
        <h4 id="governance-activity-heading" className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Vote size={16} aria-hidden="true" />
          Governance Activity
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="card bg-blue-50 border-blue-200" role="group" aria-label="Active voters statistics">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700">Voters</span>
              <Vote size={16} className="text-blue-600" aria-hidden="true" />
            </div>
            <span className="text-2xl font-bold text-blue-800">{dashboard.activeVoters}</span>
            <div
              className="mt-2 h-1.5 bg-blue-200 rounded-full"
              role="progressbar"
              aria-valuenow={dashboard.activeMembers > 0 ? Math.round((dashboard.activeVoters / dashboard.activeMembers) * 100) : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${dashboard.activeMembers > 0 ? ((dashboard.activeVoters / dashboard.activeMembers) * 100).toFixed(0) : 0}% of members are voters`}
            >
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${dashboard.activeMembers > 0
                    ? (dashboard.activeVoters / dashboard.activeMembers) * 100
                    : 0}%`
                }}
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {dashboard.activeMembers > 0
                ? `${((dashboard.activeVoters / dashboard.activeMembers) * 100).toFixed(0)}%`
                : '0%'
              } of members
            </p>
          </div>

          <div className="card bg-purple-50 border-purple-200" role="group" aria-label="Active proposers statistics">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-700">Proposers</span>
              <FileText size={16} className="text-purple-600" aria-hidden="true" />
            </div>
            <span className="text-2xl font-bold text-purple-800">{dashboard.activeProposers}</span>
            <div
              className="mt-2 h-1.5 bg-purple-200 rounded-full"
              role="progressbar"
              aria-valuenow={dashboard.activeMembers > 0 ? Math.round((dashboard.activeProposers / dashboard.activeMembers) * 100) : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${dashboard.activeMembers > 0 ? ((dashboard.activeProposers / dashboard.activeMembers) * 100).toFixed(0) : 0}% of members are proposers`}
            >
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{
                  width: `${dashboard.activeMembers > 0
                    ? (dashboard.activeProposers / dashboard.activeMembers) * 100
                    : 0}%`
                }}
              />
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {dashboard.activeMembers > 0
                ? `${((dashboard.activeProposers / dashboard.activeMembers) * 100).toFixed(0)}%`
                : '0%'
              } of members
            </p>
          </div>

          <div className="card bg-pink-50 border-pink-200" role="group" aria-label="Active facilitators statistics">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-pink-700">Facilitators</span>
              <Star size={16} className="text-pink-600" aria-hidden="true" />
            </div>
            <span className="text-2xl font-bold text-pink-800">{dashboard.activeFacilitators}</span>
            <div
              className="mt-2 h-1.5 bg-pink-200 rounded-full"
              role="progressbar"
              aria-valuenow={dashboard.activeMembers > 0 ? Math.round((dashboard.activeFacilitators / dashboard.activeMembers) * 100) : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${dashboard.activeMembers > 0 ? ((dashboard.activeFacilitators / dashboard.activeMembers) * 100).toFixed(0) : 0}% of members are facilitators`}
            >
              <div
                className="h-full bg-pink-500 rounded-full"
                style={{
                  width: `${dashboard.activeMembers > 0
                    ? (dashboard.activeFacilitators / dashboard.activeMembers) * 100
                    : 0}%`
                }}
              />
            </div>
            <p className="text-xs text-pink-600 mt-1">
              {dashboard.activeMembers > 0
                ? `${((dashboard.activeFacilitators / dashboard.activeMembers) * 100).toFixed(0)}%`
                : '0%'
              } of members
            </p>
          </div>
        </div>
      </section>

      {/* Weekly Activity */}
      <section aria-labelledby="weekly-activity-heading">
        <h4 id="weekly-activity-heading" className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp size={16} aria-hidden="true" />
          This Week's Activity
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            icon={Activity}
            label="Engagements"
            value={dashboard.weeklyEngagements}
            previousValue={previousDashboard?.weeklyEngagements}
            color="green"
          />
          <StatCard
            icon={Star}
            label="Ratings"
            value={dashboard.weeklyRatings}
            previousValue={previousDashboard?.weeklyRatings}
            color="amber"
          />
          <StatCard
            icon={MessageSquare}
            label="Conversations"
            value={dashboard.weeklyConversations}
            previousValue={previousDashboard?.weeklyConversations}
            color="blue"
          />
          <StatCard
            icon={FileText}
            label="Articles"
            value={dashboard.articlesPublishedThisWeek}
            previousValue={previousDashboard?.articlesPublishedThisWeek}
            color="indigo"
          />
          <StatCard
            icon={Calendar}
            label="Events"
            value={dashboard.eventsThisWeek}
            previousValue={previousDashboard?.eventsThisWeek}
            color="orange"
          />
        </div>
      </section>

      {/* Newsletter Subscribers */}
      <section aria-labelledby="newsletter-audience-heading">
        <h4 id="newsletter-audience-heading" className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Mail size={16} aria-hidden="true" />
          Newsletter Audience
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700">Weekly Subscribers</span>
              <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Engaged Members
              </div>
            </div>
            <span className="text-3xl font-bold text-blue-800">{dashboard.weeklySubscribers}</span>
            <p className="text-xs text-blue-600 mt-1">
              Receive insider updates every week
            </p>
          </div>

          <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-700">Monthly Subscribers</span>
              <div className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                Wider Circle
              </div>
            </div>
            <span className="text-3xl font-bold text-purple-800">{dashboard.monthlySubscribers}</span>
            <p className="text-xs text-purple-600 mt-1">
              Receive monthly digest & highlights
            </p>
          </div>
        </div>
      </section>

      {/* Agent Intelligence Notes */}
      <section className="card bg-gray-50 border-dashed" aria-labelledby="agent-intelligence-heading">
        <h4 id="agent-intelligence-heading" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-blkout-600" aria-hidden="true" />
          Agent Intelligence Context
        </h4>
        <ul className="text-sm text-gray-600 space-y-1.5" aria-label="Agent intelligence insights">
          <li className="flex items-start gap-2">
            <span className="text-blkout-600" aria-hidden="true">•</span>
            <span>
              <strong>Griot:</strong> {dashboard.verifiedCreators} verified creators available for spotlights
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blkout-600" aria-hidden="true">•</span>
            <span>
              <strong>Herald:</strong> {dashboard.weeklySubscribers + dashboard.monthlySubscribers} total newsletter audience
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blkout-600" aria-hidden="true">•</span>
            <span>
              <strong>Weaver:</strong> {dashboard.weeklyConversations} conversation threads this week for engagement
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blkout-600" aria-hidden="true">•</span>
            <span>
              <strong>Strategist:</strong> {metrics?.engagementRate.toFixed(0)}% engagement rate to optimize
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
