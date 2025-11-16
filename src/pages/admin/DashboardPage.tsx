
import { DashboardStats } from '../../components/admin/DashboardStats';
import { AgentCard } from '../../components/admin/AgentCard';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { useAgentStatus } from '../../hooks/useAgents';

export function DashboardPage() {
  const { agentStatuses, loading, error } = useAgentStatus();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <DashboardStats />

      <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Agent Status</h2>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-600">Error loading agents: {error.message}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agentStatuses.map((agentStatus) => (
            <AgentCard key={agentStatus.agent.id} agentStatus={agentStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
