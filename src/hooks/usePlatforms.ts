
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Platform } from '../types';

export function usePlatforms() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchPlatforms();
  }, []);

  async function fetchPlatforms() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      setPlatforms(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return { platforms, loading, error, refetch: fetchPlatforms };
}
