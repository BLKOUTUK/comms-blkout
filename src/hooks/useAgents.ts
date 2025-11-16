
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Agent, AgentStatus } from '../types';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('is_active', true)
        .order('agent_name');

      if (error) throw error;
      setAgents(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { agents, loading, error, refetch: fetchAgents };
}

export function useAgentStatus() {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchAgentStatuses();
  }, []);

  async function fetchAgentStatuses() {
    try {
      setLoading(true);
      
      // Fetch agents
      const { data: agents, error: agentsError } = await supabase
        .from('agent_configurations')
        .select('*')
        .eq('is_active', true)
        .order('agent_name');

      if (agentsError) throw agentsError;
      if (!agents) throw new Error('No agents found');

      // Fetch content stats for each agent
      const statuses = await Promise.all(
        agents.map(async (agent: any) => {
          const { count, error: countError } = await supabase
            .from('content_calendar')
            .select('*', { count: 'exact', head: true })
            .eq('generated_by_agent', agent.agent_name)
            .is('deleted_at', null);

          if (countError) throw countError;

          // Simulate online status and success rate
          // In a real app, this would come from actual agent monitoring
          return {
            agent,
            isOnline: true,
            lastActivity: new Date().toISOString(),
            contentGenerated: count || 0,
            successRate: 95 + Math.random() * 5, // 95-100%
          };
        })
      );

      setAgentStatuses(statuses);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { agentStatuses, loading, error, refetch: fetchAgentStatuses };
}
