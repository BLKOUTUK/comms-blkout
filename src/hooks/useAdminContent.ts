import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

// One read of GET /api/admin/content (service-role RPC, migration 018), plus the two
// writes. No retries, no cache, no fallback: if the read fails the page renders the error,
// never an empty calendar — "nothing scheduled" and "we could not reach the register" look
// identical on screen and mean opposite things.
//
// The five words are the whole vocabulary. There is no sixth, and nothing in this file
// invents one: an unknown status from the server renders as itself rather than being
// coerced into a familiar-looking chip.

export type ContentStatus = 'draft' | 'ready' | 'scheduled' | 'posted' | 'skipped';

export const CONTENT_STATUSES: ContentStatus[] = ['draft', 'ready', 'scheduled', 'posted', 'skipped'];

/** What `metadata` carries. Everything is optional — an imported row may have none of it. */
export interface ContentMetadata {
  campaign?: string;
  channels?: string[];
  source?: string;
  posted?: Record<string, { id?: string; url?: string; at?: string; error?: string }>;
  status_log?: Array<{ at: string; from: string; to: string; by: string }>;
  legacy?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ContentRow {
  id: string;
  title: string;
  content_type: string;
  status: ContentStatus | string;
  scheduled_for: string | null;
  published_at: string | null;
  primary_content: string | null;
  hashtags: string[];
  media_urls: string[];
  generated_by_agent: string | null;
  internal_notes: string | null;
  metadata: ContentMetadata;
  updated_at: string | null;
}

export interface ContentSnapshot {
  rows: ContentRow[];
  counts: Partial<Record<ContentStatus, number>> & Record<string, number>;
  campaigns?: string[];
  window: { from: string; to: string };
  generated_at: string;
}

export interface UseAdminContent {
  data: ContentSnapshot | null;
  error: string | null;
  isLoading: boolean;
  /** Move one row to a new status. Resolves to an error string, or null on success. */
  setStatus: (id: string, status: ContentStatus) => Promise<string | null>;
  refresh: () => void;
}

/** Pull the useful half of a failed response: the server's own words beat "unknown error". */
async function detailOf(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return parsed.error || text.slice(0, 300);
  } catch {
    return text.slice(0, 300);
  }
}

export function useAdminContent(from?: string, to?: string): UseAdminContent {
  const [data, setData] = useState<ContentSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const query = new URLSearchParams();
        if (from) query.set('from', from);
        if (to) query.set('to', to);
        const suffix = query.toString() ? `?${query}` : '';

        const response = await apiFetch(`/api/admin/content${suffix}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${await detailOf(response)}`);

        const snapshot = (await response.json()) as ContentSnapshot;
        if (!cancelled) {
          setData(snapshot);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : 'The register is unavailable');
          setIsLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [from, to, tick]);

  const setStatus = useCallback(async (id: string, status: ContentStatus): Promise<string | null> => {
    try {
      const response = await apiFetch(`/api/admin/content/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) return `HTTP ${response.status}: ${await detailOf(response)}`;
      refresh();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'The status change did not reach the register';
    }
  }, [refresh]);

  return { data, error, isLoading, setStatus, refresh };
}

/** The moves a person can make from each status. `posted` is read-only: it already went out. */
export const NEXT_STATUS: Record<string, ContentStatus[]> = {
  draft: ['ready'],
  ready: ['draft', 'skipped'],
  scheduled: ['ready', 'skipped'],
  skipped: ['draft'],
  posted: [],
};
