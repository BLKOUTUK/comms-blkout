import { useEffect, useState } from 'react';

// Real numbers from ivor-core's dashboard routes (verified live, 3 Sep 2026).
// No fallback values: if a fetch fails the caller shows "unavailable", never a number.
const IVOR = 'https://ivor.blkoutuk.cloud';

export interface IvorDashboard {
  events7d: { total: number; approved: number; pending: number } | null;
  moderation: { eventsPending: number; newsPending: number; total: number } | null;
  error: string | null;
  isLoading: boolean;
}

async function getJson(path: string) {
  const r = await fetch(`${IVOR}${path}`);
  if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
  return r.json();
}

export function useIvorDashboard(): IvorDashboard {
  const [state, setState] = useState<IvorDashboard>({
    events7d: null,
    moderation: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [summary, queue] = await Promise.all([
          getJson('/api/dashboard/content-summary'),
          getJson('/api/dashboard/moderation-queue'),
        ]);
        if (cancelled) return;
        const stats = summary?.events?.stats;
        const sum = queue?.summary;
        setState({
          events7d: stats ? { total: stats.total, approved: stats.approved, pending: stats.pending } : null,
          moderation: sum
            ? { eventsPending: sum.eventsPending, newsPending: sum.newsPending, total: queue?.queue?.total ?? 0 }
            : null,
          error: null,
          isLoading: false,
        });
      } catch (err) {
        if (!cancelled) {
          setState({
            events7d: null,
            moderation: null,
            error: err instanceof Error ? err.message : 'unavailable',
            isLoading: false,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
