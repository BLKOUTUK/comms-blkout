
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface PublicNewsletter {
  id: string;
  editionNumber: number;
  editionType: 'weekly' | 'monthly';
  title: string;
  summary: string | null;
  htmlContent: string | null;
  sentAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
}

export function usePublicNewsletters(limit: number = 5) {
  const [newsletters, setNewsletters] = useState<PublicNewsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNewsletters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // No mock fallback (3 Sep 2026): this feeds the public Discover page — an empty
      // archive shows as empty, never as invented editions.
      if (!isSupabaseConfigured()) {
        setNewsletters([]);
        setError('Database not configured');
        setIsLoading(false);
        return;
      }

      // Fetch from public_newsletter_archive view
      const { data, error: fetchError } = await supabase
        .from('public_newsletter_archive')
        .select('*')
        .limit(limit);

      if (fetchError) {
        console.error('Error fetching public newsletters:', fetchError);
        throw fetchError;
      }

      if (data && data.length > 0) {
        const transformed: PublicNewsletter[] = data.map((row: any) => ({
          id: row.id,
          editionNumber: row.edition_number,
          editionType: row.edition_type === 'weekly' ? 'weekly' : 'monthly',
          title: row.title,
          summary: row.summary,
          htmlContent: row.html_content,
          sentAt: new Date(row.sent_at),
          publishedAt: row.published_to_discover_at ? new Date(row.published_to_discover_at) : null,
          createdAt: new Date(row.created_at),
        }));
        setNewsletters(transformed);
      } else {
        setNewsletters([]);
      }
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch newsletters');
      setNewsletters([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]);

  return {
    newsletters,
    isLoading,
    error,
    refetch: fetchNewsletters,
  };
}
