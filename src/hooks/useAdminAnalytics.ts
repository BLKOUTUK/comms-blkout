import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

// One read of GET /api/admin/analytics (service-role RPC, migration 025). No retries, no
// cache, no fallback: if it fails the caller renders the error, never a number.
//
// `rows` is every stored metrics.snapshots row for reach, followers, members, Hub,
// newsletter and engagement measures, all periods, all statuses. A row whose status is not
// 'ok' has a null value and must render as a gap with its reason — never as 0.

export interface SnapshotRow {
  measure: string;
  period: string; // 'YYYY-MM'
  value: number | null;
  status: 'ok' | 'failed' | 'absent';
  source: string;
  taken_at: string;
  detail: Record<string, unknown> | null;
}

export interface AdminAnalyticsSnapshot {
  rows: SnapshotRow[];
  generated_at: string;
}

export interface UseAdminAnalytics {
  data: AdminAnalyticsSnapshot | null;
  error: string | null;
  isLoading: boolean;
}

export function useAdminAnalytics(): UseAdminAnalytics {
  const [state, setState] = useState<UseAdminAnalytics>({ data: null, error: null, isLoading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch('/api/admin/analytics');
        const text = await response.text();
        if (!response.ok) {
          let detail = text.slice(0, 300);
          try {
            detail = JSON.parse(text).error || detail;
          } catch {
            /* keep the raw text */
          }
          throw new Error(`HTTP ${response.status}: ${detail}`);
        }
        const data = JSON.parse(text) as AdminAnalyticsSnapshot;
        if (!cancelled) setState({ data, error: null, isLoading: false });
      } catch (err) {
        if (!cancelled) {
          setState({ data: null, error: err instanceof Error ? err.message : 'Analytics unavailable', isLoading: false });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** measure → period → row, for direct lookup. */
export type RowIndex = Record<string, Record<string, SnapshotRow>>;

export function indexRows(rows: SnapshotRow[]): RowIndex {
  const idx: RowIndex = {};
  for (const r of rows) (idx[r.measure] ||= {})[r.period] = r;
  return idx;
}
