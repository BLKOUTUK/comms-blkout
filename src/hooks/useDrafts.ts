
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockDrafts } from '@/lib/mockData';
import type { Draft } from '@/types';

export function useDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If Supabase is not configured, use mock data
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock drafts data');
        setDrafts(mockDrafts);
        setIsLoading(false);
        return;
      }

      // Fetch from Supabase
      const { data, error: fetchError } = await supabase
        .from('drafts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setDrafts(data || []);
    } catch (err) {
      console.error('Error fetching drafts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch drafts');
      // Fallback to mock data
      setDrafts(mockDrafts);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchDrafts();
  };

  return { drafts, isLoading, error, refetch };
}
