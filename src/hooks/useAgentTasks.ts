
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { apiFetch } from '@/lib/apiFetch';
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

export function useAgentTasks(agentType?: AgentType) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        setTasks([]);
        setError('Database not configured');
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
      setTasks([]);
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
      return { success: false, error: 'Database not configured' };
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
      return { success: false, error: 'Database not configured' };
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

      const response = await apiFetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Check if we got HTML back (static server fallback, not the API)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return { success: false, error: 'API unavailable: the server answered with HTML instead of JSON.' };
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

    return { success: false, error: 'Database not configured' };
  };

  // Approval functions
  //
  // Until 10 September 2026 approving wrote approval_status and stopped. 74 tasks had been
  // approved or were waiting and not one of them had become a thing that could be posted —
  // approval led nowhere. It now lands the approved draft in the content register
  // (public.content_calendar) as a `ready` row, through the same guarded service-role route
  // the Content page reads, and writes the new row's id back onto the task so the two
  // records point at each other.
  //
  // The register write is NOT allowed to fail silently. If it fails, the approval itself is
  // reported as failed and the caller shows the reason, because an approved task with no
  // register row is exactly the state this change exists to end.
  const approveTask = async (taskId: string, notes?: string): Promise<{ success: boolean; error?: string; contentId?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Database not configured' };
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found in the loaded set' };
    if (!task.generatedContent) {
      return { success: false, error: 'This task has no generated content, so there is nothing to put in the register' };
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

      // The three channels BLKOUT posts to, unless the task names one.
      const platform = (task.targetPlatform || '').toLowerCase();
      const channels = ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'youtube'].includes(platform)
        ? [platform]
        : ['instagram', 'facebook', 'linkedin'];

      const response = await apiFetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          primary_content: task.generatedContent,
          generated_by_agent: task.agentType,
          status: 'ready',
          priority: task.priority === 'critical' ? 'urgent' : task.priority,
          metadata: { source: `agent:${taskId}`, channels },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`the register refused the row (HTTP ${response.status}): ${text.slice(0, 200)}`);
      }

      const result = await response.json();
      const contentId = result?.row?.id as string | undefined;

      await supabase
        .from('socialsync_agent_tasks')
        .update({
          approval_notes: `${notes || 'Approved'} → register ${contentId || 'unknown'}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      fetchTasks(); // Refresh
      return { success: true, contentId };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to approve' };
    }
  };

  const rejectTask = async (taskId: string, notes: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Database not configured' };
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
      return { success: false, error: 'Database not configured' };
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
