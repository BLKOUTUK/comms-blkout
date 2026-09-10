
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AgentCard } from '@/components/shared/AgentCard';
import { StatCard } from '@/components/shared/StatCard';
import { OrgIdentityCard } from '@/components/admin/OrgIdentityCard';
import { useAgents } from '@/hooks/useAgents';
import { useAgentTasks } from '@/hooks/useAgentTasks';
import { useAgentActivity } from '@/hooks/useAgentActivity';
import { useIvorDashboard } from '@/hooks/useIvorDashboard';
import {
  useAdminDashboard,
  countLiveBids,
  LIVE_BIDS_TOOLTIP,
} from '@/hooks/useAdminDashboard';
import {
  CalendarCheck,
  ShieldAlert,
  FileText,
  Banknote,
  Users,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Until 3 Sep 2026 three of the four tiles here were mock values ("Community
// Members: 2,847", "↑ 5.2%"). Tiles now show real counts or say "unavailable" — never a
// number that isn't one. Four states, visibly distinct: "…" loading · the number · "none"
// · "unavailable" with the error text beneath the row.
const unavailable = 'unavailable';

export function Dashboard() {
  const { agents, isLoading: agentsLoading } = useAgents();
  const { pendingApproval } = useAgentTasks();
  const { activities } = useAgentActivity(5);
  const ivor = useIvorDashboard();
  const admin = useAdminDashboard();

  const awaitingApproval = pendingApproval.length;

  // ivor-core tiles
  const ivorTile = (n: number | undefined) =>
    ivor.isLoading ? '…' : n === undefined ? unavailable : n;

  // Tiles from the service-role snapshot. `undefined` means the fetch did not answer;
  // 0 only ever appears because 0 was counted.
  const adminTile = (n: number | undefined) =>
    admin.isLoading ? '…' : n === undefined ? unavailable : n;

  const liveBids = admin.data ? countLiveBids(admin.data.grant_pipeline) : undefined;
  const members = admin.data
    ? admin.data.memberships_by_tier.reduce((sum, row) => sum + (row.members || 0), 0)
    : undefined;
  const loops = admin.data?.open_loops ?? [];
  const bids = admin.data?.grant_pipeline ?? [];

  const money = (amount: number | null) =>
    amount === null || amount === undefined
      ? '—'
      : `£${Number(amount).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

  const day = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Who the society is, who is waiting, and what is in flight.
          </p>
        </div>

        {/* Who we are. Identifiers come from the guarded route, not the bundle. */}
        <OrgIdentityCard
          identifiers={admin.data?.identifiers}
          identifiersState={admin.isLoading ? 'loading' : admin.error ? 'failed' : 'ready'}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Events added, last 7 days"
            value={ivorTile(ivor.events7d?.total)}
            icon={CalendarCheck}
          />
          <StatCard
            title="Moderation queue"
            value={ivorTile(ivor.moderation?.total)}
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
          <div title={LIVE_BIDS_TOOLTIP}>
            <StatCard
              title="Live bids"
              value={adminTile(liveBids)}
              icon={Banknote}
              iconColor="text-green-600"
              iconBg="bg-green-100"
            />
          </div>
          <div title="Sum of metrics.memberships_by_tier. Nothing writes memberships until the join path opens.">
            <StatCard
              title={members === 0 ? 'Members — opens 28 Dec 2026' : 'Members'}
              value={adminTile(members)}
              icon={Users}
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />
          </div>
        </div>
        {ivor.error && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Event and moderation counts unavailable — ivor.blkoutuk.cloud did not answer: {ivor.error}
          </p>
        )}
        {admin.error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            Bids and members unavailable — /api/admin/dashboard did not answer: {admin.error}
          </p>
        )}

        {/* Who is waiting — the point of this page */}
        <div className="card">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-semibold text-gray-900">
              Who is waiting
              {admin.data && ` — ${loops.length}`}
            </h2>
            <HeartHandshake size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            People BLKOUT met and has not yet followed through with. From <code>open_loops</code>.
            Broadcast emails do not count as a touch; use judgement.
          </p>

          {admin.isLoading && <p className="text-sm text-gray-500 py-4">…</p>}

          {admin.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-3">
              Could not read who is waiting: {admin.error}
            </div>
          )}

          {admin.data && loops.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No one is waiting.</p>
          )}

          {admin.data && loops.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Surface</th>
                    <th className="py-2 pr-4 font-medium">Gesture</th>
                    <th className="py-2 pr-4 font-medium">Met on</th>
                    <th className="py-2 pr-4 font-medium">Days waiting</th>
                    <th className="py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loops.map((loop) => (
                    <tr key={loop.id} className="border-b border-gray-100 last:border-0 align-top">
                      <td className="py-2 pr-4 font-medium text-gray-900 whitespace-nowrap">
                        {loop.person_name || loop.person_ref || '—'}
                      </td>
                      <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{loop.surface || '—'}</td>
                      <td className="py-2 pr-4 text-gray-600">{loop.gesture || '—'}</td>
                      <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{day(loop.met_on)}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        <span
                          className={
                            (loop.days_since_met ?? 0) >= 60
                              ? 'font-semibold text-red-700'
                              : 'font-semibold text-amber-700'
                          }
                        >
                          {loop.days_since_met ?? '—'}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600">{loop.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bids */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Bids
              {admin.data && ` — ${bids.length}`}
            </h2>
            <Link to="/admin/fundraising" className="text-sm text-blkout-600 hover:text-blkout-700">
              Fundraising →
            </Link>
          </div>

          {admin.isLoading && <p className="text-sm text-gray-500 py-4">…</p>}

          {admin.error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-3">
              Could not read the pipeline: {admin.error}
            </div>
          )}

          {admin.data && bids.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No bids in the pipeline.</p>
          )}

          {admin.data && bids.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-4 font-medium">Bid</th>
                    <th className="py-2 pr-4 font-medium">Programme</th>
                    <th className="py-2 pr-4 font-medium">Stage</th>
                    <th className="py-2 pr-4 font-medium">Deadline</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid, i) => (
                    <tr
                      key={`${bid.grant_name}-${i}`}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-2 pr-4 font-medium text-gray-900">{bid.grant_name || '—'}</td>
                      <td className="py-2 pr-4 text-gray-600">{bid.grant_program || '—'}</td>
                      <td className="py-2 pr-4">
                        <span className="badge badge-inactive capitalize">
                          {(bid.stage || '—').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{day(bid.deadline)}</td>
                      <td className="py-2 text-gray-900 text-right whitespace-nowrap">
                        {money(bid.amount_awarded ?? bid.amount_requested)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
