
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
  generatedContent: string | null;
  executionMetadata: Record<string, unknown>;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  approvedBy: string | null;
  approvedAt: Date | null;
  approvalNotes: string | null;
}

export interface AgentExecutionResult {
  success: boolean;
  content?: string;
  error?: string;
  communityContext?: {
    members: number;
    coop_members: number;
    verified_creators: number;
    upcoming_events: number;
    weekly_articles: number;
  };
}

// Mock tasks for development
const mockTasks: AgentTask[] = [
  {
    id: 'mock-1',
    agentType: 'herald',
    title: 'Generate Weekly Newsletter',
    description: 'Create weekly update for engaged members',
    priority: 'high',
    status: 'completed',
    targetPlatform: 'email',
    suggestedConfig: { edition_type: 'weekly' },
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
    assignedTo: null,
    generatedContent: 'Sample newsletter content that needs approval...',
    executionMetadata: {},
    approvalStatus: 'pending',
    approvedBy: null,
    approvedAt: null,
    approvalNotes: null,
  },
  {
    id: 'mock-2',
    agentType: 'griot',
    title: 'Community Spotlight Story',
    description: 'Feature a verified creator in storytelling content',
    priority: 'medium',
    status: 'completed',
    targetPlatform: 'instagram',
    suggestedConfig: { style: 'narrative' },
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
    assignedTo: null,
    generatedContent: 'Sample story content awaiting review...',
    executionMetadata: {},
    approvalStatus: 'pending',
    approvedBy: null,
    approvedAt: null,
    approvalNotes: null,
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
        generatedContent: row.generated_content,
        executionMetadata: row.execution_metadata || {},
        approvalStatus: row.approval_status || 'pending',
        approvedBy: row.approved_by,
        approvedAt: row.approved_at ? new Date(row.approved_at) : null,
        approvalNotes: row.approval_notes,
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

  const executeAgent = async (
    agentType: AgentType,
    title: string,
    description: string,
    targetPlatform: string
  ): Promise<AgentExecutionResult> => {
    const apiBase = '/api/herald/generate';

    try {
      const body = agentType === 'herald'
        ? { action: 'generate', edition_type: 'monthly', custom_intro: description }
        : { action: 'execute_agent', agent_type: agentType, title, description, target_platform: targetPlatform };

      const response = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Check if we got HTML back (static server fallback, not the API)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return { success: false, error: 'API not available. This deployment does not have serverless functions. Use the Vercel deployment for agent execution.' };
      }

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          content: agentType === 'herald'
            ? (data.newsletter?.html || data.newsletter?.content || data.html_preview || 'Newsletter generated successfully')
            : data.content,
          communityContext: data.community_context,
        };
      }

      return { success: false, error: data.error || 'Agent execution failed' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  };

  const createAndExecuteTask = async (
    task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'generatedContent' | 'executionMetadata' | 'approvalStatus' | 'approvedBy' | 'approvedAt' | 'approvalNotes'>
  ): Promise<AgentExecutionResult & { taskId?: string }> => {
    // Create the task in the database
    if (isSupabaseConfigured()) {
      const { data: insertedTask, error: insertError } = await supabase
        .from('socialsync_agent_tasks')
        .insert({
          agent_type: task.agentType,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'in_progress',
          target_platform: task.targetPlatform,
          suggested_config: task.suggestedConfig,
          assigned_to: task.assignedTo,
        })
        .select('id')
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      const taskId = insertedTask.id;

      // Try to execute via the API (Vercel serverless function)
      const result = await executeAgent(
        task.agentType,
        task.title,
        task.description || '',
        task.targetPlatform
      );

      // Update task with result
      await supabase
        .from('socialsync_agent_tasks')
        .update({
          status: result.success ? 'completed' : 'pending',
          generated_content: result.content || null,
          execution_metadata: {
            executed_at: new Date().toISOString(),
            success: result.success,
            error: result.error,
            community_context: result.communityContext,
          },
          completed_at: result.success ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      fetchTasks();
      return { ...result, taskId };
    }

    // Mock mode
    const result = await executeAgent(
      task.agentType,
      task.title,
      task.description || '',
      task.targetPlatform
    );
    return { ...result, taskId: 'mock-' + Date.now() };
  };

  // Approval functions
  const approveTask = async (taskId: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      console.log('📦 Mock: Approving task', { taskId, notes });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('socialsync_agent_tasks')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approval_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks(); // Refresh
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to approve' };
    }
  };

  const rejectTask = async (taskId: string, notes: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      console.log('📦 Mock: Rejecting task', { taskId, notes });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('socialsync_agent_tasks')
        .update({
          approval_status: 'rejected',
          approved_at: new Date().toISOString(),
          approval_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to reject' };
    }
  };

  const requestRevision = async (taskId: string, notes: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      console.log('📦 Mock: Requesting revision', { taskId, notes });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('socialsync_agent_tasks')
        .update({
          approval_status: 'revision_requested',
          approval_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to request revision' };
    }
  };

  // Get task counts by status
  const taskCounts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    total: tasks.length,
  };

  // Get tasks pending approval (completed with generated content but not yet approved)
  const pendingApproval = tasks.filter(
    t => t.status === 'completed' &&
    t.generatedContent &&
    t.approvalStatus === 'pending'
  );

  return {
    tasks,
    taskCounts,
    pendingApproval,
    isLoading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTaskStatus,
    executeAgent,
    createAndExecuteTask,
    approveTask,
    rejectTask,
    requestRevision,
  };
}
