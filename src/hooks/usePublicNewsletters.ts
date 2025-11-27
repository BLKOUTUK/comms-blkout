
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

// Mock data for development
const mockNewsletters: PublicNewsletter[] = [
  {
    id: 'mock-nl-1',
    editionNumber: 3,
    editionType: 'weekly',
    title: 'This Week at BLKOUT: New Governance Proposals',
    summary: 'Community updates on governance, upcoming events, and member spotlights from this week.',
    htmlContent: null,
    sentAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
  },
  {
    id: 'mock-nl-2',
    editionNumber: 2,
    editionType: 'monthly',
    title: 'BLKOUT Monthly: November Community Digest',
    summary: 'A comprehensive look back at November - events, achievements, and looking ahead to December.',
    htmlContent: null,
    sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
];

export function usePublicNewsletters(limit: number = 5) {
  const [newsletters, setNewsletters] = useState<PublicNewsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  const fetchNewsletters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock public newsletters');
        setNewsletters(mockNewsletters.slice(0, limit));
        setIsUsingMockData(true);
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
        setIsUsingMockData(false);
      } else {
        // No newsletters yet, show mock
        setNewsletters(mockNewsletters.slice(0, limit));
        setIsUsingMockData(true);
      }
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch newsletters');
      setNewsletters(mockNewsletters.slice(0, limit));
      setIsUsingMockData(true);
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
    isUsingMockData,
    refetch: fetchNewsletters,
  };
}
