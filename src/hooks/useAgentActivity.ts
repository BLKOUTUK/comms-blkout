
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { ActivityLog } from '@/types';

export function useAgentActivity(limit: number = 10) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // No mock fallback (3 Sep 2026): an unconfigured or failing source leaves the list
      // empty with `error` set, never an invented activity feed.
      if (!isSupabaseConfigured()) {
        setActivities([]);
        setError('Database not configured');
        setIsLoading(false);
        return;
      }

      // Fetch recent agent tasks as activity (include generated_content and execution_metadata)
      const { data: taskData, error: taskError } = await supabase
        .from('socialsync_agent_tasks')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (taskError) {
        console.error('Error fetching agent tasks:', taskError);
        throw taskError;
      }

      if (taskData && taskData.length > 0) {
        // Transform tasks to activity log format
        const transformedActivities: ActivityLog[] = taskData.map((task: any) => ({
          id: task.id,
          agentId: task.id, // Use task ID as agent activity ID
          agentType: task.agent_type || 'griot',
          action: mapStatusToAction(task.status, task.generated_content),
          description: formatTaskDescription(task),
          timestamp: new Date(task.updated_at || task.created_at),
          metadata: {
            taskTitle: task.title,
            platform: task.target_platform,
            priority: task.priority,
            status: task.status,
            hasGeneratedContent: !!task.generated_content,
            contentPreview: task.generated_content ? task.generated_content.slice(0, 100) + '...' : null,
            executionMetadata: task.execution_metadata,
          },
        }));

        setActivities(transformedActivities);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Error fetching agent activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const subscription = supabase
      .channel('agent_activity_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'socialsync_agent_tasks',
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities,
  };
}

// Helper to map task status to action type
function mapStatusToAction(status: string, generatedContent?: string): string {
  if (status === 'completed' && generatedContent) {
    return 'content_generated';
  }
  switch (status) {
    case 'completed':
      return 'content_created';
    case 'in_progress':
      return 'generating_content';
    case 'pending':
      return 'task_assigned';
    case 'cancelled':
      return 'task_failed';
    default:
      return 'task_updated';
  }
}

// Helper to format task description for display
function formatTaskDescription(task: any): string {
  const title = task.title || 'Untitled task';
  const platform = task.target_platform ? ` for ${task.target_platform}` : '';
  const hasContent = !!task.generated_content;

  switch (task.status) {
    case 'completed':
      if (hasContent) {
        return `Generated content: ${title}${platform}`;
      }
      return `Completed: ${title}${platform}`;
    case 'in_progress':
      return `Generating: ${title}${platform}`;
    case 'pending':
      return `Queued: ${title}${platform}`;
    case 'cancelled':
      return `Failed: ${title}${platform}`;
    default:
      return `${title}${platform}`;
  }
}
