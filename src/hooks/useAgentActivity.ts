
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockActivityLogs } from '@/lib/mockData';
import type { ActivityLog } from '@/types';

export function useAgentActivity(limit: number = 10) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock activity data');
        setActivities(mockActivityLogs.slice(0, limit));
        setIsUsingMockData(true);
        setIsLoading(false);
        return;
      }

      // Fetch recent agent tasks as activity
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
          action: mapStatusToAction(task.status),
          description: formatTaskDescription(task),
          timestamp: new Date(task.updated_at || task.created_at),
          metadata: {
            taskTitle: task.title,
            platform: task.target_platform,
            priority: task.priority,
            status: task.status,
          },
        }));

        setActivities(transformedActivities);
        setIsUsingMockData(false);
      } else {
        // Fallback to mock data if no activities
        console.log('📦 No agent activities, using mock data');
        setActivities(mockActivityLogs.slice(0, limit));
        setIsUsingMockData(true);
      }
    } catch (err) {
      console.error('Error fetching agent activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      setActivities(mockActivityLogs.slice(0, limit));
      setIsUsingMockData(true);
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
    isUsingMockData,
    refetch: fetchActivities,
  };
}

// Helper to map task status to action type
function mapStatusToAction(status: string): string {
  switch (status) {
    case 'completed':
      return 'content_created';
    case 'in_progress':
      return 'task_started';
    case 'pending':
      return 'task_assigned';
    case 'failed':
      return 'task_failed';
    default:
      return 'task_updated';
  }
}

// Helper to format task description for display
function formatTaskDescription(task: any): string {
  const title = task.title || 'Untitled task';
  const platform = task.target_platform ? ` for ${task.target_platform}` : '';

  switch (task.status) {
    case 'completed':
      return `Completed: ${title}${platform}`;
    case 'in_progress':
      return `Working on: ${title}${platform}`;
    case 'pending':
      return `Assigned: ${title}${platform}`;
    case 'failed':
      return `Failed: ${title}${platform}`;
    default:
      return `${title}${platform}`;
  }
}
