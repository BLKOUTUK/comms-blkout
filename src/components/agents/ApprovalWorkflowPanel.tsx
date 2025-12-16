
import { useState, useMemo } from 'react';
import {
  CheckCircle, XCircle, Clock, RotateCcw, ArrowRight, BarChart3,
  History, CheckSquare, Square, AlertCircle, TrendingUp, Timer, Sparkles
} from 'lucide-react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ApprovalQueue } from './ApprovalQueue';
import type { AgentTask } from '@/hooks/useAgentTasks';
import type { AgentType } from '@/types';

interface ApprovalWorkflowPanelProps {
  tasks: AgentTask[];
  allTasks: AgentTask[]; // All tasks including approved/rejected for history
  onApprove: (taskId: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (taskId: string, notes: string) => Promise<{ success: boolean; error?: string }>;
  onRequestRevision: (taskId: string, notes: string) => Promise<{ success: boolean; error?: string }>;
  onBulkApprove?: (taskIds: string[]) => Promise<{ success: boolean; error?: string }>;
  onRefresh?: () => void;
}

// Workflow stages with visual representation
const WORKFLOW_STAGES = [
  { id: 'pending', label: 'Pending', icon: Clock, color: 'amber' },
  { id: 'revision_requested', label: 'Revision', icon: RotateCcw, color: 'blue' },
  { id: 'approved', label: 'Approved', icon: CheckCircle, color: 'green' },
  { id: 'rejected', label: 'Rejected', icon: XCircle, color: 'red' },
] as const;

export function ApprovalWorkflowPanel({
  tasks,
  allTasks,
  onApprove,
  onReject,
  onRequestRevision,
  onBulkApprove,
  onRefresh,
}: ApprovalWorkflowPanelProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'stats'>('queue');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Calculate workflow statistics
  const stats = useMemo(() => {
    const approved = allTasks.filter(t => t.approvalStatus === 'approved');
    const rejected = allTasks.filter(t => t.approvalStatus === 'rejected');
    const pending = allTasks.filter(t => t.approvalStatus === 'pending' && t.status === 'completed');
    const revisions = allTasks.filter(t => t.approvalStatus === 'revision_requested');

    // Calculate approval rate
    const totalDecisions = approved.length + rejected.length;
    const approvalRate = totalDecisions > 0 ? (approved.length / totalDecisions) * 100 : 0;

    // Calculate average time to approval (in hours)
    const approvedWithTime = approved.filter(t => t.approvedAt && t.createdAt);
    const avgTimeToApproval = approvedWithTime.length > 0
      ? approvedWithTime.reduce((sum, t) => {
          return sum + differenceInHours(t.approvedAt!, t.createdAt);
        }, 0) / approvedWithTime.length
      : 0;

    // Stats by agent
    const byAgent = allTasks.reduce((acc, task) => {
      if (!acc[task.agentType]) {
        acc[task.agentType] = { approved: 0, rejected: 0, pending: 0, total: 0 };
      }
      acc[task.agentType].total++;
      if (task.approvalStatus === 'approved') acc[task.agentType].approved++;
      if (task.approvalStatus === 'rejected') acc[task.agentType].rejected++;
      if (task.approvalStatus === 'pending' && task.status === 'completed') acc[task.agentType].pending++;
      return acc;
    }, {} as Record<AgentType, { approved: number; rejected: number; pending: number; total: number }>);

    return {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      revisions: revisions.length,
      approvalRate,
      avgTimeToApproval,
      byAgent,
      totalProcessed: totalDecisions,
    };
  }, [allTasks]);

  // History items (approved/rejected)
  const historyItems = useMemo(() => {
    return allTasks
      .filter(t => t.approvalStatus === 'approved' || t.approvalStatus === 'rejected')
      .sort((a, b) => {
        const aTime = a.approvedAt?.getTime() || 0;
        const bTime = b.approvedAt?.getTime() || 0;
        return bTime - aTime;
      });
  }, [allTasks]);

  // Toggle task selection for bulk actions
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const selectAllTasks = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTasks.size === 0 || !onBulkApprove) return;

    setIsBulkProcessing(true);
    const result = await onBulkApprove(Array.from(selectedTasks));
    setIsBulkProcessing(false);

    if (result.success) {
      setSelectedTasks(new Set());
      onRefresh?.();
    }
  };

  // Fallback bulk approve - approve one by one
  const handleSequentialBulkApprove = async () => {
    if (selectedTasks.size === 0) return;

    setIsBulkProcessing(true);
    for (const taskId of selectedTasks) {
      await onApprove(taskId);
    }
    setIsBulkProcessing(false);
    setSelectedTasks(new Set());
    onRefresh?.();
  };

  return (
    <div className="space-y-6">
      {/* Workflow Pipeline Visualization */}
      <div className="card bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blkout-600" />
          Approval Pipeline
        </h3>

        <div className="flex items-center justify-between gap-2">
          {WORKFLOW_STAGES.map((stage, idx) => {
            const count = stage.id === 'pending' ? stats.pending
              : stage.id === 'revision_requested' ? stats.revisions
              : stage.id === 'approved' ? stats.approved
              : stats.rejected;

            const Icon = stage.icon;

            return (
              <div key={stage.id} className="flex items-center flex-1">
                <div className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  stage.id === 'pending' && stats.pending > 0
                    ? 'border-amber-300 bg-amber-50'
                    : `border-${stage.color}-200 bg-${stage.color}-50/50`
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={18} className={`text-${stage.color}-600`} />
                    <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                  </div>
                  <span className={`text-2xl font-bold text-${stage.color}-700`}>
                    {count}
                  </span>
                </div>
                {idx < WORKFLOW_STAGES.length - 1 && (
                  <ArrowRight size={20} className="mx-2 text-gray-300 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-700">Approval Rate</span>
            <TrendingUp size={18} className="text-green-600" />
          </div>
          <span className="text-3xl font-bold text-green-800">
            {stats.approvalRate.toFixed(0)}%
          </span>
          <p className="text-xs text-green-600 mt-1">
            {stats.approved} of {stats.totalProcessed} approved
          </p>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700">Avg. Time to Approval</span>
            <Timer size={18} className="text-blue-600" />
          </div>
          <span className="text-3xl font-bold text-blue-800">
            {stats.avgTimeToApproval < 1
              ? '<1h'
              : stats.avgTimeToApproval < 24
              ? `${stats.avgTimeToApproval.toFixed(0)}h`
              : `${(stats.avgTimeToApproval / 24).toFixed(1)}d`
            }
          </span>
          <p className="text-xs text-blue-600 mt-1">
            From generation to approval
          </p>
        </div>

        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-amber-700">Pending Review</span>
            <AlertCircle size={18} className="text-amber-600" />
          </div>
          <span className="text-3xl font-bold text-amber-800">
            {stats.pending}
          </span>
          <p className="text-xs text-amber-600 mt-1">
            {stats.revisions > 0 && `${stats.revisions} awaiting revision`}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-blkout-600 text-blkout-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertCircle size={16} className="inline mr-1.5" />
          Queue ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blkout-600 text-blkout-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <History size={16} className="inline mr-1.5" />
          History ({historyItems.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stats'
              ? 'border-blkout-600 text-blkout-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 size={16} className="inline mr-1.5" />
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Bulk Actions Bar */}
          {tasks.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAllTasks}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  {selectedTasks.size === tasks.length && tasks.length > 0 ? (
                    <CheckSquare size={18} className="text-blkout-600" />
                  ) : (
                    <Square size={18} />
                  )}
                  Select All
                </button>
                {selectedTasks.size > 0 && (
                  <span className="text-sm text-gray-500">
                    {selectedTasks.size} selected
                  </span>
                )}
              </div>

              {selectedTasks.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onBulkApprove ? handleBulkApprove : handleSequentialBulkApprove}
                    disabled={isBulkProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    {isBulkProcessing ? 'Processing...' : `Approve ${selectedTasks.size}`}
                  </button>
                  <button
                    onClick={() => setSelectedTasks(new Set())}
                    className="px-3 py-1.5 text-gray-600 text-sm hover:text-gray-900"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Approval Queue with selection checkboxes */}
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskSelection(task.id)}
                    className="mt-4 flex-shrink-0"
                  >
                    {selectedTasks.has(task.id) ? (
                      <CheckSquare size={20} className="text-blkout-600" />
                    ) : (
                      <Square size={20} className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  <div className="flex-1">
                    <ApprovalQueue
                      tasks={[task]}
                      onApprove={onApprove}
                      onReject={onReject}
                      onRequestRevision={onRequestRevision}
                      onRefresh={onRefresh}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card bg-green-50 border-green-200 text-center py-8">
              <Sparkles size={32} className="mx-auto text-green-600 mb-3" />
              <h3 className="text-lg font-medium text-green-800">All Caught Up!</h3>
              <p className="text-green-600 text-sm mt-1">No content pending approval</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <History size={16} />
            Recent Decisions
          </h4>

          {historyItems.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {historyItems.slice(0, 20).map(item => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    item.approvalStatus === 'approved'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.approvalStatus === 'approved' ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <XCircle size={18} className="text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.agentType} • {item.targetPlatform}
                        {item.approvalNotes && (
                          <span className="ml-2 italic">"{item.approvalNotes}"</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${
                      item.approvalStatus === 'approved' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {item.approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.approvedAt && formatDistanceToNow(item.approvedAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No approval history yet</p>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Agent Performance */}
          <div className="card">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} />
              Agent Approval Performance
            </h4>

            <div className="space-y-3">
              {Object.entries(stats.byAgent).map(([agent, data]) => {
                const agentApprovalRate = data.approved + data.rejected > 0
                  ? (data.approved / (data.approved + data.rejected)) * 100
                  : 0;

                return (
                  <div key={agent} className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium text-gray-700 capitalize">
                      {agent}
                    </span>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          style={{ width: `${agentApprovalRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right text-sm font-medium text-gray-900">
                      {agentApprovalRate.toFixed(0)}%
                    </span>
                    <span className="w-20 text-right text-xs text-gray-500">
                      {data.approved}/{data.approved + data.rejected}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <span className="text-2xl font-bold text-gray-900">{stats.totalProcessed}</span>
              <p className="text-xs text-gray-500">Total Processed</p>
            </div>
            <div className="card text-center">
              <span className="text-2xl font-bold text-green-600">{stats.approved}</span>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
            <div className="card text-center">
              <span className="text-2xl font-bold text-red-600">{stats.rejected}</span>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
            <div className="card text-center">
              <span className="text-2xl font-bold text-blue-600">{stats.revisions}</span>
              <p className="text-xs text-gray-500">Revisions</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
