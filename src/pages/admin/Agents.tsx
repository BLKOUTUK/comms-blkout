
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { AgentCard } from '@/components/shared/AgentCard';
import { AgentPromptModal, type AgentTaskInput } from '@/components/agents/AgentPromptModal';
import { AgentConfigurationModal } from '@/components/agents/AgentConfigurationModal';
import { ApprovalQueue } from '@/components/agents/ApprovalQueue';
import { IntelligenceFeedPanel } from '@/components/agents/IntelligenceFeedPanel';
import { useAgents } from '@/hooks/useAgents';
import { useAgentTasks } from '@/hooks/useAgentTasks';
import { useAgentIntelligence } from '@/hooks/useAgentIntelligence';
import { useAgentActivity } from '@/hooks/useAgentActivity';
import { Bot, Activity, Settings as SettingsIcon, Lightbulb, ListTodo, Users, Mail, Sparkles, FileText, Clock, CheckCircle, XCircle, AlertCircle, Brain, Database } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AgentType } from '@/types';

export function Agents() {
  const { agents, isLoading, isUsingMockData: isAgentsMock, refetch: refetchAgents } = useAgents();
  const { taskCounts, pendingApproval, createAndExecuteTask, approveTask, rejectTask, requestRevision, refetch: refetchTasks } = useAgentTasks();
  const { intelligence, dashboard, highPriorityIntel, isLoading: isIntelLoading, error: intelError, refetch: refetchIntelligence, markAsUsed } = useAgentIntelligence();
  const { activities, isUsingMockData: isActivityMock, refetch: refetchActivity } = useAgentActivity(10);

  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [preselectedAgent, setPreselectedAgent] = useState<AgentType | undefined>(undefined);
  const [showIntelligenceFeed, setShowIntelligenceFeed] = useState(false);

  const handleAgentClick = (agentId: string) => {
    // Find the agent and open prompt modal with that agent preselected
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setPreselectedAgent(agent.type);
      setIsPromptModalOpen(true);
    }
  };

  const handlePromptSubmit = async (task: AgentTaskInput) => {
    const result = await createAndExecuteTask(task);
    // Refetch activity log to show new execution
    if (result.success) {
      refetchActivity();
    }
    return result;
  };

  const openPromptModal = () => {
    setPreselectedAgent(undefined);
    setIsPromptModalOpen(true);
  };

  const agentStats = agents.reduce(
    (acc, agent) => {
      acc.total++;
      if (agent.status === 'active') acc.active++;
      if (agent.status === 'inactive') acc.inactive++;
      if (agent.status === 'paused') acc.paused++;
      acc.totalContent += agent.totalContentGenerated || 0;
      return acc;
    },
    { total: 0, active: 0, inactive: 0, paused: 0, totalContent: 0 }
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-bold text-gray-900">AI Agents</h1>
              {(isAgentsMock || isActivityMock) && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Database size={12} />
                  Demo Mode
                </span>
              )}
              {!isAgentsMock && !isActivityMock && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Database size={12} />
                  Live Data
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              Manage your AI-powered content creation and community engagement agents
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openPromptModal}
              className="btn btn-primary flex items-center gap-2"
            >
              <Sparkles size={18} />
              Prompt Agent
            </button>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="btn btn-outline flex items-center gap-2"
            >
              <SettingsIcon size={18} />
              Configure Agents
            </button>
          </div>
        </div>

        {/* Agent Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Agents</p>
                <p className="text-3xl font-bold text-gray-900">{agentStats.total}</p>
              </div>
              <Bot className="text-blkout-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-green-600">{agentStats.active}</p>
              </div>
              <Activity className="text-green-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Tasks</p>
                <p className="text-3xl font-bold text-yellow-600">{taskCounts.pending}</p>
              </div>
              <ListTodo className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Intelligence</p>
                <p className="text-3xl font-bold text-purple-600">{intelligence.length}</p>
              </div>
              <Lightbulb className="text-purple-600" size={32} />
            </div>
          </div>
          {pendingApproval.length > 0 && (
            <div className="card border-l-4 border-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
                  <p className="text-3xl font-bold text-amber-600">{pendingApproval.length}</p>
                </div>
                <AlertCircle className="text-amber-600" size={32} />
              </div>
            </div>
          )}
        </div>

        {/* Content Approval Queue */}
        <ApprovalQueue
          tasks={pendingApproval}
          onApprove={approveTask}
          onReject={rejectTask}
          onRequestRevision={requestRevision}
          onRefresh={() => { refetchTasks(); refetchActivity(); }}
        />

        {/* Community Dashboard Summary */}
        {dashboard && (
          <div className="card bg-gradient-to-r from-blkout-50 to-purple-50 border-blkout-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blkout-600" />
              Community Intelligence Dashboard
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blkout-600">{dashboard.activeMembers}</p>
                <p className="text-xs text-gray-600">Active Members</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{dashboard.verifiedCreators}</p>
                <p className="text-xs text-gray-600">Verified Creators</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{dashboard.weeklyEngagements}</p>
                <p className="text-xs text-gray-600">Weekly Engagements</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{dashboard.weeklyConversations}</p>
                <p className="text-xs text-gray-600">AIvor Conversations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{dashboard.eventsThisWeek}</p>
                <p className="text-xs text-gray-600">Events This Week</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-600">{dashboard.articlesPublishedThisWeek}</p>
                <p className="text-xs text-gray-600">Articles Published</p>
              </div>
            </div>
          </div>
        )}

        {/* Intelligence Feed Toggle */}
        <div className="card border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain size={24} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AIvor Intelligence Feed</h3>
                <p className="text-sm text-gray-600">
                  {intelligence.length} community insights | {highPriorityIntel.length} high priority
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIntelligenceFeed(!showIntelligenceFeed)}
              className="btn btn-outline flex items-center gap-2"
            >
              <Database size={16} />
              {showIntelligenceFeed ? 'Hide Feed' : 'View Full Feed'}
            </button>
          </div>

          {/* High Priority Preview (when collapsed) */}
          {!showIntelligenceFeed && highPriorityIntel.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Lightbulb size={14} className="text-yellow-500" />
                Priority Signals
              </h4>
              <div className="space-y-2">
                {highPriorityIntel.slice(0, 2).map((intel) => (
                  <div key={intel.id} className="bg-white/70 rounded-lg p-3 border border-purple-100">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 line-clamp-1">{intel.summary}</span>
                      <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ml-2 ${
                        intel.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        intel.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {intel.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {intel.actionableItems[0] || intel.keyInsights[0] || 'No actionable items'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Full Intelligence Feed Panel (when expanded) */}
        {showIntelligenceFeed && (
          <IntelligenceFeedPanel
            intelligence={intelligence}
            dashboard={dashboard}
            isLoading={isIntelLoading}
            error={intelError}
            onRefresh={refetchIntelligence}
            onMarkUsed={markAsUsed}
            selectedAgent={preselectedAgent}
          />
        )}

        {/* Agent Cards */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Agents</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blkout-600"></div>
              <p className="mt-4 text-gray-600">Loading agents...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} onClick={() => handleAgentClick(agent.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Agent Activity Log */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Agent Activity</h2>
            {isActivityMock && (
              <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                Demo Mode
              </span>
            )}
          </div>
          <div className="space-y-4">
            {activities.map((log) => {
              const metadata = log.metadata as Record<string, unknown> | undefined;
              const hasContent = metadata?.hasGeneratedContent as boolean | undefined;
              const contentPreview = metadata?.contentPreview as string | undefined;
              const platform = metadata?.platform as string | undefined;

              // Determine icon and color based on action
              const getActivityIcon = () => {
                switch (log.action) {
                  case 'content_generated':
                    return <Sparkles size={20} className="text-green-600" />;
                  case 'generating_content':
                    return <Clock size={20} className="text-blue-600 animate-pulse" />;
                  case 'task_failed':
                    return <XCircle size={20} className="text-red-600" />;
                  case 'content_created':
                    return <CheckCircle size={20} className="text-green-600" />;
                  default:
                    return <Bot size={20} className="text-blkout-600" />;
                }
              };

              const getActionBadgeStyle = () => {
                switch (log.action) {
                  case 'content_generated':
                    return 'bg-green-100 text-green-700';
                  case 'generating_content':
                    return 'bg-blue-100 text-blue-700';
                  case 'task_failed':
                    return 'bg-red-100 text-red-700';
                  default:
                    return 'bg-gray-100 text-gray-700';
                }
              };

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    hasContent ? 'bg-green-100' : 'bg-blkout-100'
                  }`}>
                    {getActivityIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 capitalize">
                        {log.agentType} Agent
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{log.description}</p>

                    {/* Content Preview */}
                    {hasContent && contentPreview && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <FileText size={12} />
                          <span>Generated content preview</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{contentPreview}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${getActionBadgeStyle()}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {platform && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                          {platform}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Information */}
        <div className="card bg-blkout-50 border-blkout-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About BLKOUT Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-blkout-900 mb-2">Griot</h4>
              <p>
                Creates authentic storytelling content rooted in Black feminist thought and
                community narratives.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blkout-900 mb-2">Listener</h4>
              <p>
                Monitors social media and gathers community intelligence to inform content
                strategy.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blkout-900 mb-2">Weaver</h4>
              <p>
                Facilitates community engagement and builds relationships through thoughtful
                interactions.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blkout-900 mb-2">Strategist</h4>
              <p>
                Plans campaigns and coordinates content timing to maximize community impact.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blkout-900 mb-2 flex items-center gap-2">
                <Mail size={16} />
                Herald
              </h4>
              <p>
                Curates weekly newsletters for engaged members and monthly digests for the
                wider community circle. Integrates with SendFox for email delivery.
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blkout-300">
              <h4 className="font-medium text-blkout-900 mb-2 flex items-center gap-2">
                <Users size={16} />
                Concierge <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">NEW</span>
              </h4>
              <p>
                Provides personalized member support, onboarding guidance, and helps
                members navigate community resources and opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Prompt Modal */}
      <AgentPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onSubmit={handlePromptSubmit}
        preselectedAgent={preselectedAgent}
      />

      {/* Agent Configuration Modal */}
      <AgentConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={() => {
          // Refetch agents and activity after config change
          refetchAgents();
          refetchActivity();
        }}
      />
    </Layout>
  );
}
