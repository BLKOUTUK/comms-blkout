
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockPlatforms } from '@/lib/mockData';
import type { Platform } from '@/types';

export function usePlatforms() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const fetchPlatforms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If Supabase is not configured, use mock data
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock platforms data');
        setPlatforms(mockPlatforms);
        setIsLoading(false);
        return;
      }

      // Fetch from Supabase
      const { data, error: fetchError } = await supabase
        .from('platforms')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setPlatforms(data || []);
    } catch (err) {
      console.error('Error fetching platforms:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch platforms');
      // Fallback to mock data
      setPlatforms(mockPlatforms);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchPlatforms();
  };

  return { platforms, isLoading, error, refetch };
}
