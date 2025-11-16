
import { Bot, Activity, CheckCircle } from 'lucide-react';
import type { AgentStatus } from '../../types';

interface AgentCardProps {
  agentStatus: AgentStatus;
}

export function AgentCard({ agentStatus }: AgentCardProps) {
  const { agent, isOnline, contentGenerated, successRate } = agentStatus;

  const agentColors: Record<string, string> = {
    griot: 'bg-purple-500',
    listener: 'bg-blue-500',
    weaver: 'bg-pink-500',
    strategist: 'bg-amber-500',
  };

  const agentColor = agentColors[agent.agent_name] || 'bg-gray-500';

  return (
    <div className="card hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className={`${agentColor} p-3 rounded-lg`}>
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {agent.agent_display_name}
            </h3>
            <p className="text-sm text-gray-500">{agent.agent_role.split(' ')[0]}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></div>
          <span className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Role description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {agent.tone_description}
      </p>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Content Generated
          </span>
          <span className="font-semibold text-gray-900">{contentGenerated}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Success Rate
          </span>
          <span className="font-semibold text-green-600">{successRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* Key responsibilities */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs font-medium text-gray-700 mb-2">Key Responsibilities:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          {agent.key_responsibilities.slice(0, 2).map((responsibility, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              <span className="line-clamp-1">{responsibility}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* View details button */}
      <button className="mt-4 w-full btn-secondary text-sm">
        View Details
      </button>
    </div>
  );
}
