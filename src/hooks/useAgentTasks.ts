
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AgentType } from '@/types';

export interface AgentTask {
  id: string;
  agentType: AgentType;
  title: string;
  description: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  targetPlatform: string;
  suggestedConfig: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  assignedTo: string | null;
}

// Mock tasks for development
const mockTasks: AgentTask[] = [
  {
    id: 'mock-1',
    agentType: 'herald',
    title: 'Generate Weekly Newsletter',
    description: 'Create weekly update for engaged members',
    priority: 'high',
    status: 'pending',
    targetPlatform: 'email',
    suggestedConfig: { edition_type: 'weekly' },
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    assignedTo: null,
  },
  {
    id: 'mock-2',
    agentType: 'griot',
    title: 'Community Spotlight Story',
    description: 'Feature a verified creator in storytelling content',
    priority: 'medium',
    status: 'pending',
    targetPlatform: 'instagram',
    suggestedConfig: { style: 'narrative' },
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    assignedTo: null,
  },
];

export function useAgentTasks(agentType?: AgentType) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock agent tasks');
        const filtered = agentType
          ? mockTasks.filter(t => t.agentType === agentType)
          : mockTasks;
        setTasks(filtered);
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('socialsync_agent_tasks')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (agentType) {
        query = query.eq('agent_type', agentType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const transformed: AgentTask[] = (data || []).map((row: any) => ({
        id: row.id,
        agentType: row.agent_type as AgentType,
        title: row.title,
        description: row.description,
        priority: row.priority,
        status: row.status,
        targetPlatform: row.target_platform,
        suggestedConfig: row.suggested_config || {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : null,
        assignedTo: row.assigned_to,
      }));

      setTasks(transformed);
    } catch (err) {
      console.error('Error fetching agent tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      setTasks(mockTasks);
    } finally {
      setIsLoading(false);
    }
  }, [agentType]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const subscription = supabase
      .channel('agent_tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'socialsync_agent_tasks',
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTasks]);

  const createTask = async (task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      console.log('📦 Mock: Creating task', task);
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('socialsync_agent_tasks')
        .insert({
          agent_type: task.agentType,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status || 'pending',
          target_platform: task.targetPlatform,
          suggested_config: task.suggestedConfig,
          assigned_to: task.assignedTo,
        });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create task' };
    }
  };

  const updateTaskStatus = async (taskId: string, status: AgentTask['status']): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      console.log('📦 Mock: Updating task status', { taskId, status });
      return { success: true };
    }

    try {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('socialsync_agent_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update task' };
    }
  };

  // Get task counts by status
  const taskCounts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    total: tasks.length,
  };

  return {
    tasks,
    taskCounts,
    isLoading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTaskStatus,
  };
}
