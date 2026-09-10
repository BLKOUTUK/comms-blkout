import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

// One read of GET /api/admin/dashboard (service-role RPC, migration 016). No retries, no
// cache, no fallback: if it fails the caller renders the error, never a number. `data` is
// null until a real response arrives, and a field that is absent stays undefined — the
// tiles read undefined as "unavailable", which is the truth, whereas 0 would be a lie.
//
// Note what is NOT here: no unmet count. Those signups were reached by SendFox broadcasts
// the gesture feed cannot see, so any "waiting" number derived from them is blind. Who is
// waiting is `open_loops` — notes-bearing and human-judged.

export interface OpenLoop {
  id: string;
  person_ref: string | null;
  person_name: string | null;
  surface: string | null;
  gesture: string | null;
  met_on: string | null;
  days_since_met: number | null;
  notes: string | null;
}

export interface PipelineBid {
  grant_name: string | null;
  grant_program: string | null;
  stage: string | null;
  amount_requested: number | null;
  amount_awarded: number | null;
  deadline: string | null;
  submitted_at: string | null;
  decision_expected: string | null;
  updated_at: string | null;
}

export interface MembershipTier {
  tier: string | null;
  status: string | null;
  members: number;
}

export interface AdminDashboardSnapshot {
  open_loops: OpenLoop[];
  first_gestures: {
    total_rows: number;
    live: number;
    met: number;
    acknowledged_awaiting_met: number;
    latest_gesture_at: string | null;
  } | null;
  being_met: {
    met_in_window: number;
    landed: number;
    median_hours_to_met_90d: number | null;
  } | null;
  grant_pipeline: PipelineBid[];
  memberships_by_tier: MembershipTier[];
  generated_at: string;
}

export interface UseAdminDashboard {
  data: AdminDashboardSnapshot | null;
  error: string | null;
  isLoading: boolean;
}

export function useAdminDashboard(): UseAdminDashboard {
  const [state, setState] = useState<UseAdminDashboard>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await apiFetch('/api/admin/dashboard');
        const text = await response.text();

        if (!response.ok) {
          let detail = text.slice(0, 300);
          try {
            const parsed = JSON.parse(text);
            detail = parsed.error || detail;
          } catch {
            /* keep the raw text — it is more use than "unknown error" */
          }
          throw new Error(`HTTP ${response.status}: ${detail}`);
        }

        const data = JSON.parse(text) as AdminDashboardSnapshot;
        if (!cancelled) setState({ data, error: null, isLoading: false });
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            error: err instanceof Error ? err.message : 'Dashboard unavailable',
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

// Stages that mean a bid is no longer in flight. Read from the live enum on
// public.grant_pipeline (10 Sep 2026): research · preparing · submitted · under_review ·
// interview · decision_pending · approved · rejected · withdrawn · active · reporting ·
// completed. Everything not listed below counts as live.
export const CLOSED_BID_STAGES = [
  'rejected',
  'withdrawn',
  'approved',
  'active',
  'reporting',
  'completed',
];

export const LIVE_BIDS_TOOLTIP =
  'Bids still in flight: any grant_pipeline row whose stage is not rejected, withdrawn, approved, active, reporting or completed.';

export function countLiveBids(bids: PipelineBid[]): number {
  return bids.filter((b) => !CLOSED_BID_STAGES.includes((b.stage || '').toLowerCase())).length;
}
