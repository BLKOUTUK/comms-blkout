import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/apiFetch';

// One read of GET /api/admin/finance (service-role RPC, migration 017). No retries, no
// cache, no fallback: if it fails the caller renders the error, never a number.
//
// `books` is the latest publish per `finance.*` measure from metrics.snapshots, written
// by build-finance.mjs in ~/blkout/projects/financial-management/. It is null until the
// first publish — the page must say "not published yet" and render no tiles, because a
// missing position and a zero position are different facts. A measure that IS present
// and reads 0 is a real zero and renders as 0.

export interface BookMeasureDetail {
  as_at: string | null;
  statement_to: string | null;
  generated: string | null;
  check_period: string | null;
  months_to_check: string[];
  nil_months: string[];
  // finance.funds only
  funds?: FundRow[];
  // finance.needs_attention only
  unmapped?: UnmappedRow[];
  flags?: FlagRow[];
  // finance.income_by_code only
  fy_start?: string;
  fy_end?: string;
  codes?: IncomeCodeRow[];
  /** Code 1100. `null` means nobody has recorded it — never treat it as zero. */
  zeffy_receivable?: number | null;
  unrestricted_earned?: number;
  donations?: number;
  subscriptions?: number;
}

/** One income code from chart-of-accounts.md, with what the ledger has against it. */
export interface IncomeCodeRow {
  code: string;
  name: string;
  restricted: boolean;
  total_to_date: number;
  this_fy: number;
}

export interface BookMeasure {
  value: number | null;
  period: string;
  taken_at: string;
  detail: BookMeasureDetail;
}

export interface FundRow {
  fund: string;
  funder: string | null;
  code: string;
  spendCode: string;
  restricted: boolean;
  awarded: number;
  received: number;
  receivable: number;
  spent: number;
  remaining: number;
}

export interface UnmappedRow {
  date: string;
  description: string;
  amount: number;
}

export interface FlagRow {
  date: string;
  description: string;
  note: string;
}

export interface FinanceSubscription {
  id: string;
  service_name: string;
  category: string | null;
  billing_cycle: string | null;
  monthly_cost_gbp: number | null;
  annual_cost_gbp: number | null;
  last_invoice_at: string | null;
  last_amount: number | null;
  last_amount_currency: string | null;
  next_renewal_at: string | null;
  active: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  source: string | null;
  notes: string | null;
  sender_match_pattern: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SubscriptionsCost {
  active_subscriptions: number;
  monthly_cost_gbp: number | null;
  annual_cost_gbp: number | null;
  latest_invoice_seen: string | null;
}

// Keys are the measure names as published: 'finance.cash', 'finance.net', and so on.
export type Books = Record<string, BookMeasure>;

export interface AdminFinanceSnapshot {
  books: Books | null;
  subscriptions: FinanceSubscription[];
  subscriptions_cost: SubscriptionsCost | null;
  generated_at: string;
}

export interface UseAdminFinance {
  data: AdminFinanceSnapshot | null;
  error: string | null;
  isLoading: boolean;
}

export function useAdminFinance(): UseAdminFinance {
  const [state, setState] = useState<UseAdminFinance>({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await apiFetch('/api/admin/finance');
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

        const data = JSON.parse(text) as AdminFinanceSnapshot;
        if (!cancelled) setState({ data, error: null, isLoading: false });
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            error: err instanceof Error ? err.message : 'Finance unavailable',
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

// The ten measures build-finance.mjs publishes. Named here so the pages read one place.
export const MEASURE = {
  cash: 'finance.cash',
  receivable: 'finance.receivable',
  net: 'finance.net',
  transactions: 'finance.transactions',
  monthsRecorded: 'finance.months_recorded',
  nilMonths: 'finance.nil_months',
  monthsUnchecked: 'finance.months_unchecked',
  funds: 'finance.funds',
  needsAttention: 'finance.needs_attention',
  incomeByCode: 'finance.income_by_code',
} as const;
