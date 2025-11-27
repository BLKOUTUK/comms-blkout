
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockAgents } from '@/lib/mockData';
import type { Agent, AgentType, AgentStatus } from '@/types';

// Database row type from agent_configurations
interface AgentConfigurationRow {
  id: string;
  agent_name: string;
  agent_display_name: string;
  agent_role: string;
  key_responsibilities: string[];
  content_focus: string[];
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Transform database row to Agent interface
function transformAgentRow(row: AgentConfigurationRow): Agent {
  // Extract agent name for type (griot, listener, weaver, strategist, herald)
  const agentType = row.agent_name as AgentType;

  // Combine responsibilities and focus into capabilities
  const capabilities = [
    ...(row.key_responsibilities?.slice(0, 2) || []),
    ...(row.content_focus?.slice(0, 2) || [])
  ].map(cap => cap.length > 40 ? cap.substring(0, 40) + '...' : cap);

  return {
    id: row.id,
    name: row.agent_display_name?.split(' - ')[0] || row.agent_display_name || row.agent_name,
    type: agentType,
    status: row.is_active ? 'active' : 'inactive' as AgentStatus,
    description: row.agent_role || '',
    capabilities: capabilities.length > 0 ? capabilities : ['Content Generation'],
    configuration: row.settings || {},
    lastActive: new Date(row.updated_at),
    totalContentGenerated: 0, // Will be updated from metrics
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If Supabase is not configured, use mock data
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock agents data');
        setAgents(mockAgents);
        setIsLoading(false);
        return;
      }

      // Fetch from agent_configurations table
      const { data, error: fetchError } = await supabase
        .from('agent_configurations')
        .select('*')
        .order('agent_name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching agent configurations:', fetchError);
        throw fetchError;
      }

      if (data && data.length > 0) {
        // Transform database rows to Agent interface
        const transformedAgents = data.map(transformAgentRow);

        // Fetch content generation counts from socialsync tables
        const { data: taskCounts } = await supabase
          .from('socialsync_agent_tasks')
          .select('agent_type, id')
          .eq('status', 'completed');

        if (taskCounts) {
          // Count completed tasks per agent
          const countsByAgent = taskCounts.reduce((acc: Record<string, number>, task: { agent_type: string }) => {
            acc[task.agent_type] = (acc[task.agent_type] || 0) + 1;
            return acc;
          }, {});

          // Update totalContentGenerated
          transformedAgents.forEach(agent => {
            agent.totalContentGenerated = countsByAgent[agent.type] || 0;
          });
        }

        setAgents(transformedAgents);
      } else {
        // Fallback to mock data if no agents configured
        console.log('📦 No agents in database, using mock data');
        setAgents(mockAgents);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
      // Fallback to mock data on error
      setAgents(mockAgents);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const subscription = supabase
      .channel('agent_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_configurations',
        },
        () => {
          fetchAgents();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAgents]);

  const refetch = () => {
    fetchAgents();
  };

  // Helper to get a specific agent by name
  const getAgentByType = (type: AgentType): Agent | undefined => {
    return agents.find(agent => agent.type === type);
  };

  return { agents, isLoading, error, refetch, getAgentByType };
}

// Hook for individual agent with more details
export function useAgent(agentType: AgentType) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [intelligence, setIntelligence] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (!isSupabaseConfigured()) {
        const mockAgent = mockAgents.find(a => a.type === agentType);
        setAgent(mockAgent || null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Fetch agent configuration
        const { data: agentData, error: agentError } = await supabase
          .from('agent_configurations')
          .select('*')
          .eq('agent_name', agentType)
          .single();

        if (agentError) throw agentError;

        if (agentData) {
          setAgent(transformAgentRow(agentData));
        }

        // Fetch relevant intelligence for this agent
        const { data: intelData } = await supabase
          .from('ivor_intelligence')
          .select('*')
          .eq('is_stale', false)
          .order('relevance_score', { ascending: false })
          .limit(5);

        if (intelData) {
          // Filter to intelligence relevant to this agent
          const relevantIntel = intelData.filter((intel: any) =>
            intel.actionable_items?.some((item: string) =>
              item.toLowerCase().includes(agentType)
            )
          );
          setIntelligence(relevantIntel);
        }

        // Fetch pending tasks for this agent
        const { data: taskData } = await supabase
          .from('socialsync_agent_tasks')
          .select('*')
          .eq('agent_type', agentType)
          .in('status', ['pending', 'in_progress'])
          .order('priority', { ascending: false })
          .limit(10);

        if (taskData) {
          setTasks(taskData);
        }

      } catch (err) {
        console.error(`Error fetching ${agentType} details:`, err);
        setError(err instanceof Error ? err.message : 'Failed to fetch agent details');
        const mockAgent = mockAgents.find(a => a.type === agentType);
        setAgent(mockAgent || null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentDetails();
  }, [agentType]);

  return { agent, intelligence, tasks, isLoading, error };
}
