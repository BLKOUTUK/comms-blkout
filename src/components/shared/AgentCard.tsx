
import { Bot, Activity, CheckCircle, XCircle, Pause } from 'lucide-react';
import type { Agent } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const statusIcons = {
    active: <CheckCircle size={16} className="text-green-600" />,
    inactive: <XCircle size={16} className="text-gray-400" />,
    paused: <Pause size={16} className="text-yellow-600" />,
    error: <XCircle size={16} className="text-red-600" />,
  };

  const statusColors = {
    active: 'bg-green-50 border-green-200',
    inactive: 'bg-gray-50 border-gray-200',
    paused: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
  };

  return (
    <div
      onClick={onClick}
      className={`card card-hover cursor-pointer border-2 ${statusColors[agent.status]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blkout-100 rounded-lg flex items-center justify-center">
            <Bot size={24} className="text-blkout-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              {statusIcons[agent.status]}
              <span className={`text-xs badge badge-${agent.status}`}>
                {agent.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">{agent.description}</p>

      <div className="space-y-2">
        {agent.lastActive && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity size={16} />
            <span>
              Last active {formatDistanceToNow(new Date(agent.lastActive), { addSuffix: true })}
            </span>
          </div>
        )}
        {agent.totalContentGenerated !== undefined && (
          <div className="text-sm text-gray-500">
            Content generated: <span className="font-medium text-gray-900">{agent.totalContentGenerated}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <span
              key={capability}
              className="px-2 py-1 bg-blkout-50 text-blkout-700 text-xs rounded-md"
            >
              {capability}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
              +{agent.capabilities.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
