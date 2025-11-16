
import { Layout } from '@/components/layout/Layout';
import { AgentCard } from '@/components/shared/AgentCard';
import { useAgents } from '@/hooks/useAgents';
import { mockActivityLogs } from '@/lib/mockData';
import { Bot, Activity, Settings as SettingsIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Agents() {
  const { agents, isLoading } = useAgents();

  const handleAgentClick = (agentId: string) => {
    console.log('View agent details:', agentId);
    // TODO: Implement agent detail modal or navigation
    alert('Agent details! (This is a demo - implement detail view)');
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
            <h1 className="text-3xl font-display font-bold text-gray-900">AI Agents</h1>
            <p className="text-gray-600 mt-1">
              Manage your AI-powered content creation and community engagement agents
            </p>
          </div>
          <button className="btn btn-outline">
            <SettingsIcon size={18} />
            Configure Agents
          </button>
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
                <p className="text-sm text-gray-600 mb-1">Paused</p>
                <p className="text-3xl font-bold text-yellow-600">{agentStats.paused}</p>
              </div>
              <Activity className="text-yellow-600" size={32} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Content</p>
                <p className="text-3xl font-bold text-gray-900">{agentStats.totalContent}</p>
              </div>
              <Activity className="text-blkout-600" size={32} />
            </div>
          </div>
        </div>

        {/* Agent Cards */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Agents</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blkout-600"></div>
              <p className="mt-4 text-gray-600">Loading agents...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} onClick={() => handleAgentClick(agent.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Agent Activity Log */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Agent Activity</h2>
          <div className="space-y-4">
            {mockActivityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-0"
              >
                <div className="w-10 h-10 bg-blkout-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot size={20} className="text-blkout-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {log.agentType} Agent
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{log.description}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                    {log.action.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Information */}
        <div className="card bg-blkout-50 border-blkout-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About BLKOUT Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
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
          </div>
        </div>
      </div>
    </Layout>
  );
}
