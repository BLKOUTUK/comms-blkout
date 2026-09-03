
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Content } from '@/types';

export function useContent() {
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // No mock fallback (3 Sep 2026): an unconfigured or failing source leaves the
      // list empty with `error` set, never a fabricated list.
      if (!isSupabaseConfigured()) {
        setError('Supabase not configured');
        setContent([]);
        setIsLoading(false);
        return;
      }

      // Fetch from Supabase
      const { data, error: fetchError } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setContent(data || []);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
      setContent([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchContent();
  };

  return { content, isLoading, error, refetch };
}
