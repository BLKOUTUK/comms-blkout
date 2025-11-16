
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { AgentCard } from '../../components/admin/AgentCard';
import { useAgentStatus } from '../../hooks/useAgents';
import { Bot, Zap, Brain, Target } from 'lucide-react';

export function AgentsPage() {
  const { agentStatuses, loading, error } = useAgentStatus();

  const agentIcons: Record<string, any> = {
    griot: Bot,
    listener: Zap,
    weaver: Brain,
    strategist: Target,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Agents</h1>
      <p className="text-gray-600 mb-8">
        Monitor and manage the four AI agents that power BLKOUT UK's content creation system.
      </p>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-600">Error loading agents: {error.message}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {agentStatuses.map((agentStatus) => (
              <AgentCard key={agentStatus.agent.id} agentStatus={agentStatus} />
            ))}
          </div>

          {/* Agent Details */}
          <div className="space-y-6">
            {agentStatuses.map((agentStatus) => {
              const { agent } = agentStatus;
              const Icon = agentIcons[agent.agent_name] || Bot;

              return (
                <div key={agent.id} className="card">
                  <div className="flex items-start">
                    <div className="bg-blkout-purple p-3 rounded-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {agent.agent_display_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">{agent.agent_role}</p>
                      
                      {/* Key Responsibilities */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Responsibilities:</h4>
                        <ul className="space-y-1">
                          {agent.key_responsibilities.map((resp, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Content Focus */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Content Focus:</h4>
                        <div className="flex flex-wrap gap-2">
                          {agent.content_focus.map((focus, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                            >
                              {focus}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
