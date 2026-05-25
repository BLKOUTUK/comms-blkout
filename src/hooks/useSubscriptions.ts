/**
 * useSubscriptions — read active subscriptions from Supabase public.subscriptions.
 *
 * Bayard's subscription scanner is the writer; this hook is the reader.
 * Falls back to the hardcoded SUBSCRIPTIONS array in Finance.tsx if Supabase
 * is unreachable so the page never breaks on a network blip.
 */
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type SubscriptionCategory = 'infrastructure' | 'ai' | 'tools' | 'domain' | 'other';
export type BillingCycle = 'monthly' | 'annual' | 'usage' | 'quarterly' | 'unknown';

export interface LiveSubscription {
  id: string;
  service_name: string;
  category: SubscriptionCategory;
  billing_cycle: BillingCycle;
  monthly_cost_gbp: number | null;
  annual_cost_gbp: number | null;
  last_invoice_at: string | null;
  last_amount: number | null;
  last_amount_currency: string | null;
  next_renewal_at: string | null;
  active: boolean;
  cancelled_at: string | null;
  source: string;
  notes: string | null;
}

interface UseSubscriptionsResult {
  subscriptions: LiveSubscription[];
  isLoading: boolean;
  error: string | null;
  lastScannedAt: string | null;  // approximated from max(last_invoice_at)
  monthlyTotal: number;
  annualTotal: number;
}

export function useSubscriptions(): UseSubscriptionsResult {
  const [subscriptions, setSubscriptions] = useState<LiveSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      setError('Supabase not configured');
      return;
    }
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('subscriptions')
          .select(
            'id,service_name,category,billing_cycle,monthly_cost_gbp,annual_cost_gbp,last_invoice_at,last_amount,last_amount_currency,next_renewal_at,active,cancelled_at,source,notes',
          )
          .eq('active', true)
          .order('monthly_cost_gbp', { ascending: false, nullsFirst: false });

        if (fetchError) throw fetchError;
        const rows = (data || []) as LiveSubscription[];
        setSubscriptions(rows);

        // last_scanned proxy: max last_invoice_at across active subs
        const lastInvoiceDates = rows
          .map((r) => r.last_invoice_at)
          .filter((d): d is string => !!d)
          .sort()
          .reverse();
        setLastScannedAt(lastInvoiceDates[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const monthlyTotal = subscriptions.reduce(
    (sum, s) => sum + (s.monthly_cost_gbp ?? 0),
    0,
  );
  const annualTotal = monthlyTotal * 12;

  return { subscriptions, isLoading, error, lastScannedAt, monthlyTotal, annualTotal };
}
