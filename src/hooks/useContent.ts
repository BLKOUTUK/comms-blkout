
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockContent } from '@/lib/mockData';
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

      // If Supabase is not configured, use mock data
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock content data');
        setContent(mockContent);
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
      // Fallback to mock data on error
      setContent(mockContent);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchContent();
  };

  return { content, isLoading, error, refetch };
}

// Hook for fetching published content (for Discover page)
export function usePublishedContent() {
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedContent();
  }, []);

  const fetchPublishedContent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If Supabase is not configured, use mock data
      if (!isSupabaseConfigured()) {
        const publishedContent = mockContent.filter((c) => c.status === 'published');
        setContent(publishedContent);
        setIsLoading(false);
        return;
      }

      // Fetch from Supabase
      const { data, error: fetchError } = await supabase
        .from('content')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (fetchError) throw fetchError;

      setContent(data || []);
    } catch (err) {
      console.error('Error fetching published content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
      // Fallback to mock data
      const publishedContent = mockContent.filter((c) => c.status === 'published');
      setContent(publishedContent);
    } finally {
      setIsLoading(false);
    }
  };

  return { content, isLoading, error };
}
