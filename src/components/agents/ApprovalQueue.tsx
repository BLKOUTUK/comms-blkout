
import { useState } from 'react';
import {
  AlertCircle, ChevronDown, ChevronUp, Eye, Copy, Check,
  ThumbsUp, ThumbsDown, RotateCcw, Filter, Clock, Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AgentTask } from '@/hooks/useAgentTasks';
import type { AgentType } from '@/types';

interface ApprovalQueueProps {
  tasks: AgentTask[];
  onApprove: (taskId: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onReject: (taskId: string, notes: string) => Promise<{ success: boolean; error?: string }>;
  onRequestRevision: (taskId: string, notes: string) => Promise<{ success: boolean; error?: string }>;
  onRefresh?: () => void;
}

const AGENT_ICONS: Record<AgentType, { icon: string; color: string }> = {
  herald: { icon: '📬', color: 'blue' },
  griot: { icon: '📖', color: 'purple' },
  weaver: { icon: '🕸️', color: 'green' },
  strategist: { icon: '🎯', color: 'orange' },
  listener: { icon: '👂', color: 'teal' },
  concierge: { icon: '🛎️', color: 'pink' },
};

export function ApprovalQueue({
  tasks,
  onApprove,
  onReject,
  onRequestRevision,
  onRefresh
}: ApprovalQueueProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState<Record<string, { revision: string; reject: string }>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterAgent, setFilterAgent] = useState<AgentType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  // Get unique agent types from tasks
  const agentTypes = [...new Set(tasks.map(t => t.agentType))];

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterAgent !== 'all' && task.agentType !== filterAgent) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const getTaskNotes = (taskId: string) => {
    return taskNotes[taskId] || { revision: '', reject: '' };
  };

  const setRevisionNotes = (taskId: string, value: string) => {
    setTaskNotes(prev => ({
      ...prev,
      [taskId]: { ...getTaskNotes(taskId), revision: value }
    }));
  };

  const setRejectNotes = (taskId: string, value: string) => {
    setTaskNotes(prev => ({
      ...prev,
      [taskId]: { ...getTaskNotes(taskId), reject: value }
    }));
  };

  const handleApprove = async (taskId: string) => {
    setActionInProgress(taskId);
    const result = await onApprove(taskId);
    setActionInProgress(null);
    if (result.success) {
      setExpandedTask(null);
      onRefresh?.();
    }
  };

  const handleReject = async (taskId: string) => {
    const notes = getTaskNotes(taskId).reject;
    if (!notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setActionInProgress(taskId);
    const result = await onReject(taskId, notes);
    setActionInProgress(null);
    if (result.success) {
      setExpandedTask(null);
      setTaskNotes(prev => {
        const { [taskId]: _, ...rest } = prev;
        return rest;
      });
      onRefresh?.();
    }
  };

  const handleRequestRevision = async (taskId: string) => {
    const notes = getTaskNotes(taskId).revision;
    if (!notes.trim()) {
      alert('Please provide revision notes');
      return;
    }
    setActionInProgress(taskId);
    const result = await onRequestRevision(taskId, notes);
    setActionInProgress(null);
    if (result.success) {
      setExpandedTask(null);
      setTaskNotes(prev => {
        const { [taskId]: _, ...rest } = prev;
        return rest;
      });
      onRefresh?.();
    }
  };

  const copyToClipboard = async (taskId: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(taskId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (tasks.length === 0) {
    return (
      <div className="card bg-green-50 border-green-200 text-center py-8">
        <Sparkles size={32} className="mx-auto text-green-600 mb-3" />
        <h3 className="text-lg font-medium text-green-800">All Caught Up!</h3>
        <p className="text-green-600 text-sm mt-1">No content pending approval</p>
      </div>
    );
  }

  return (
    <div className="card border-l-4 border-amber-500 bg-amber-50/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertCircle size={20} className="text-amber-600" />
          Content Approval Queue
          <span className="text-sm font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            {filteredTasks.length} of {tasks.length}
          </span>
        </h3>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value as AgentType | 'all')}
            className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Agents</option>
            {agentTypes.map(type => (
              <option key={type} value={type}>
                {AGENT_ICONS[type].icon} {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
            className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isExpanded = expandedTask === task.id;
          const isProcessing = actionInProgress === task.id;
          const notes = getTaskNotes(task.id);
          const agentInfo = AGENT_ICONS[task.agentType];

          return (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Task Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-${agentInfo.color}-100`}>
                    {agentInfo.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 line-clamp-1">{task.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="capitalize font-medium text-gray-700">{task.agentType}</span>
                      <span>•</span>
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{task.targetPlatform}</span>
                      <span>•</span>
                      <Clock size={12} />
                      <span>{formatDistanceToNow(task.createdAt, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    task.priority === 'critical' ? 'bg-red-100 text-red-700 ring-1 ring-red-200' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.priority}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && task.generatedContent && (
                <div className="border-t border-amber-200 bg-gradient-to-b from-gray-50 to-white">
                  {/* Content Preview */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Eye size={16} className="text-gray-500" />
                        Generated Content
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(task.id, task.generatedContent || '');
                        }}
                        className="flex items-center gap-1.5 text-sm text-blkout-600 hover:text-blkout-700 px-2 py-1 rounded hover:bg-blkout-50 transition-colors"
                      >
                        {copiedId === task.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === task.id ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 max-h-72 overflow-y-auto shadow-inner">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {task.generatedContent}
                      </pre>
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="px-4 pb-4 pt-2 space-y-3">
                    {/* Quick Approve */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(task.id);
                      }}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-medium shadow-sm hover:shadow-md transition-all"
                    >
                      <ThumbsUp size={18} />
                      {isProcessing ? 'Processing...' : 'Approve & Publish'}
                    </button>

                    {/* Revision Request */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Request changes... (e.g., 'Add more context about upcoming events')"
                        value={notes.revision}
                        onChange={(e) => setRevisionNotes(task.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestRevision(task.id);
                        }}
                        disabled={isProcessing || !notes.revision.trim()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 font-medium whitespace-nowrap"
                      >
                        <RotateCcw size={16} />
                        Revise
                      </button>
                    </div>

                    {/* Reject */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Rejection reason... (required)"
                        value={notes.reject}
                        onChange={(e) => setRejectNotes(task.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(task.id);
                        }}
                        disabled={isProcessing || !notes.reject.trim()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-medium whitespace-nowrap"
                      >
                        <ThumbsDown size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty filtered state */}
      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <Filter size={24} className="mx-auto mb-2 opacity-50" />
          <p>No tasks match the current filters</p>
          <button
            onClick={() => { setFilterAgent('all'); setFilterPriority('all'); }}
            className="text-amber-600 hover:text-amber-700 text-sm mt-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
