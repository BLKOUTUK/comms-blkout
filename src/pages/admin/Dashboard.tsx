
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AgentCard } from '@/components/shared/AgentCard';
import { StatCard } from '@/components/shared/StatCard';
import { useAgents } from '@/hooks/useAgents';
import { useContent } from '@/hooks/useContent';
import { useAgentTasks } from '@/hooks/useAgentTasks';
import { useAgentActivity } from '@/hooks/useAgentActivity';
import { useIvorDashboard } from '@/hooks/useIvorDashboard';
import { CalendarCheck, CheckCircle2, ShieldAlert, FileText, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Until 3 Sep 2026 three of the four tiles here were mock values ("Community
// Members: 2,847", "↑ 5.2%"). Tiles now show real counts from ivor-core or say
// "unavailable" — never a number that isn't one. Membership numbers belong to the
// metrics.* views and will arrive with the server-side metrics route.
const unavailable = 'unavailable';

export function Dashboard() {
  const { agents, isLoading: agentsLoading } = useAgents();
  const { content } = useContent();
  const { pendingApproval } = useAgentTasks();
  const { activities } = useAgentActivity(5);
  const ivor = useIvorDashboard();

  const awaitingApproval = pendingApproval.length;
  const tile = (n: number | undefined) =>
    ivor.isLoading ? '…' : n === undefined ? unavailable : n;

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
            title="Events added, last 7 days"
            value={tile(ivor.events7d?.total)}
            icon={CalendarCheck}
          />
          <StatCard
            title="Approved, last 7 days"
            value={tile(ivor.events7d?.approved)}
            icon={CheckCircle2}
            iconColor="text-green-600"
            iconBg="bg-green-100"
          />
          <StatCard
            title="Moderation queue"
            value={tile(ivor.moderation?.total)}
            icon={ShieldAlert}
            iconColor="text-amber-600"
            iconBg="bg-amber-100"
          />
          <StatCard
            title="Agent content awaiting approval"
            value={awaitingApproval}
            icon={FileText}
            iconColor="text-blkout-600"
            iconBg="bg-blkout-100"
          />
        </div>
        {ivor.error && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Live numbers unavailable — ivor.blkoutuk.cloud did not answer: {ivor.error}
          </p>
        )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/admin/calendar" className="btn btn-primary text-center">Create New Content</Link>
            <Link to="/admin/agents" className="btn btn-outline text-center">Review agent content</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
