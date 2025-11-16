
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ContentWithRelations, ContentFilters } from '../types';

export function useContent(filters?: ContentFilters) {
  const [content, setContent] = useState<ContentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchContent();
  }, [filters]);

  async function fetchContent() {
    try {
      setLoading(true);
      let query = supabase
        .from('content_calendar')
        .select(`
          *,
          platform:platforms(*),
          campaign:campaigns(*),
          performance:content_performance(*)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.platform?.length) {
        query = query.in('platform_id', filters.platform);
      }
      if (filters?.agent?.length) {
        query = query.in('generated_by_agent', filters.agent);
      }
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }
      if (filters?.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,primary_content.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContent(data as ContentWithRelations[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { content, loading, error, refetch: fetchContent };
}

export function usePublishedContent(limit = 20) {
  const [content, setContent] = useState<ContentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchPublishedContent();
  }, [limit]);

  async function fetchPublishedContent() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_calendar')
        .select(`
          *,
          platform:platforms(*),
          campaign:campaigns(*),
          performance:content_performance(*)
        `)
        .eq('status', 'published')
        .is('deleted_at', null)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setContent(data as ContentWithRelations[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { content, loading, error, refetch: fetchPublishedContent };
}
