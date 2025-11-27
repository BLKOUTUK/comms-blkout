
import { Layout } from '@/components/layout/Layout';
import { AgentCard } from '@/components/shared/AgentCard';
import { StatCard } from '@/components/shared/StatCard';
import { useAgents } from '@/hooks/useAgents';
import { useContent } from '@/hooks/useContent';
import { useDrafts } from '@/hooks/useDrafts';
import { useAgentActivity } from '@/hooks/useAgentActivity';
import { Users, MessageSquare, TrendingUp, FileText, Calendar, Clock } from 'lucide-react';
import { mockCommunityMetrics } from '@/lib/mockData';
import { formatDistanceToNow } from 'date-fns';

export function Dashboard() {
  const { agents, isLoading: agentsLoading } = useAgents();
  const { content } = useContent();
  const { drafts } = useDrafts();
  const { activities, isUsingMockData: isActivityMock } = useAgentActivity(5);

  const stats = {
    totalContent: content.length,
    publishedContent: content.filter((c) => c.status === 'published').length,
    scheduledContent: content.filter((c) => c.status === 'scheduled').length,
    pendingDrafts: drafts.filter((d) => d.status === 'pending_review').length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your community communications and agent activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Community Members"
            value={mockCommunityMetrics.totalMembers.toLocaleString()}
            change={{ value: 5.2, trend: 'up' }}
            icon={Users}
          />
          <StatCard
            title="Engagement Quality"
            value={`${mockCommunityMetrics.engagementQuality}%`}
            change={{ value: 3.1, trend: 'up' }}
            icon={MessageSquare}
            iconColor="text-community-trust"
            iconBg="bg-community-trust/10"
          />
          <StatCard
            title="Trust Score"
            value={`${mockCommunityMetrics.trustScore}/100`}
            change={{ value: 2.4, trend: 'up' }}
            icon={TrendingUp}
            iconColor="text-community-wisdom"
            iconBg="bg-community-wisdom/10"
          />
          <StatCard
            title="Pending Drafts"
            value={stats.pendingDrafts}
            icon={FileText}
            iconColor="text-community-warmth"
            iconBg="bg-community-warmth/10"
          />
        </div>

        {/* Agent Status Cards */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Agents</h2>
          {agentsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blkout-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Content & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Content */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Content</h2>
              <Calendar size={20} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {content.slice(0, 5).map((item) => (
                <div key={item.id} className="pb-3 border-b border-gray-100 last:border-0">
                  <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 capitalize">{item.status}</span>
                    <span className="text-xs px-2 py-0.5 bg-blkout-50 text-blkout-700 rounded capitalize">
                      {item.agentType}
                    </span>
                  </div>
                </div>
              ))}
              {content.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No content yet</p>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <div className="flex items-center gap-2">
                {isActivityMock && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Demo
                  </span>
                )}
                <Clock size={20} className="text-gray-400" />
              </div>
            </div>
            <div className="space-y-3">
              {activities.map((log) => (
                <div key={log.id} className="pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blkout-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn btn-primary">Create New Content</button>
            <button className="btn btn-outline">Review Drafts</button>
            <button className="btn btn-outline">View Analytics</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
