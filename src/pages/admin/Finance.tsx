/**
 * Finance — running costs.
 *
 * Rewritten 3 Sep 2026. The Year 1 overview and 5-year forecast tabs were hardcoded
 * projections with every `actual: 0`, and the subscriptions panel carried a hardcoded
 * list (25 May snapshot) that silently replaced the live table whenever the fetch
 * failed or returned nothing. The ledger lives in Mission Control and the CRM; this
 * page shows the live subscriptions table and nothing it did not fetch.
 */

import { AlertTriangle, BookOpen, ExternalLink, Receipt } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { useSubscriptions, type LiveSubscription } from '../../hooks/useSubscriptions';

type BillingCycle = 'monthly' | 'annual' | 'usage';
type SubscriptionSource = 'gmail-receipt' | 'service-dashboard' | 'estimate';
type SubscriptionCategory = 'infrastructure' | 'ai' | 'tools' | 'domain';

interface SubscriptionView {
  service: string;
  category: SubscriptionCategory;
  monthlyCost: number;
  annualCost?: number;
  billing: BillingCycle;
  lastVerified: string;
  source: SubscriptionSource;
  nextRenewal?: string;
  notes?: string;
}

const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  infrastructure: 'Infrastructure',
  ai: 'AI & APIs',
  tools: 'Tools',
  domain: 'Domains',
};

const BILLING_BADGE: Record<BillingCycle, { label: string; classes: string }> = {
  monthly: { label: 'monthly', classes: 'bg-blue-50 text-blue-700' },
  annual: { label: 'annual', classes: 'bg-purple-50 text-purple-700' },
  usage: { label: 'usage', classes: 'bg-amber-50 text-amber-700' },
};

function liveToView(row: LiveSubscription): SubscriptionView {
  const category = (row.category === 'other' || !row.category ? 'tools' : row.category) as SubscriptionCategory;
  const billingRaw = row.billing_cycle || 'unknown';
  const billing: BillingCycle =
    billingRaw === 'monthly' || billingRaw === 'annual' || billingRaw === 'usage' ? billingRaw : 'usage';
  return {
    service: row.service_name,
    category,
    monthlyCost: row.monthly_cost_gbp ?? 0,
    annualCost: row.annual_cost_gbp ?? undefined,
    billing,
    lastVerified: row.last_invoice_at ? row.last_invoice_at.slice(0, 10) : '—',
    source: row.source === 'manual' ? 'service-dashboard' : 'gmail-receipt',
    nextRenewal: row.next_renewal_at ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function formatGBP(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);
  return amount < 0 ? `(${formatted})` : formatted;
}

export function Finance() {
  const live = useSubscriptions();
  const subs: SubscriptionView[] = live.subscriptions.map(liveToView);
  const failed = !!live.error;
  const ready = !live.isLoading && !failed;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Finance</h1>
          <p className="text-gray-600 mt-1">Running costs, from the subscriptions table</p>
        </div>

        {/* The ledger is elsewhere — say so rather than project */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
            The ledger
          </h2>
          <p className="text-sm text-gray-600">
            Bookkeeping, reconciliations and the cash position live in Mission Control (local) and the CRM.
            This page does not hold or project them.
          </p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <a href="http://localhost:8765" className="text-blkout-600 hover:underline inline-flex items-center gap-1">
              <ExternalLink size={14} /> Mission Control (local machine only)
            </a>
            <a href="https://crm.blkoutuk.cloud/financial" target="_blank" rel="noopener noreferrer" className="text-blkout-600 hover:underline inline-flex items-center gap-1">
              <ExternalLink size={14} /> CRM · financial
            </a>
          </div>
        </div>

        {failed && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Subscriptions unavailable</p>
              <p>{live.error}</p>
            </div>
          </div>
        )}

        {/* Totals — only from rows fetched this session */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">Total monthly</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {ready ? formatGBP(live.monthlyTotal) : '—'}<span className="text-base font-normal text-gray-500">/mo</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{ready ? `${subs.length} active subscriptions` : live.isLoading ? 'loading…' : 'unavailable'}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">Total annual</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {ready ? formatGBP(live.annualTotal) : '—'}<span className="text-base font-normal text-gray-500">/yr</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500">Last invoice seen</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{ready && live.lastScannedAt ? live.lastScannedAt.slice(0, 10) : '—'}</p>
            <p className="text-xs text-gray-400 mt-1">from the subscription scanner</p>
          </div>
        </div>

        {ready && subs.length === 0 && (
          <p className="text-sm text-gray-500">No subscriptions recorded yet.</p>
        )}

        {(Object.keys(CATEGORY_LABELS) as SubscriptionCategory[]).map((cat) => {
          const items = subs.filter((s) => s.category === cat);
          if (items.length === 0) return null;
          const catTotal = items.reduce((s, x) => s + x.monthlyCost, 0);
          return (
            <div key={cat} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-amber-600" />
                  {CATEGORY_LABELS[cat]}
                </h3>
                <span className="text-sm text-gray-500">
                  {formatGBP(catTotal)}/mo · {formatGBP(catTotal * 12)}/yr
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 pr-3 font-medium">Service</th>
                      <th className="pb-2 pr-3 font-medium text-right">Monthly</th>
                      <th className="pb-2 pr-3 font-medium text-right">Annual</th>
                      <th className="pb-2 pr-3 font-medium">Billing</th>
                      <th className="pb-2 pr-3 font-medium">Verified</th>
                      <th className="pb-2 font-medium">Next renewal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((s) => (
                      <tr key={s.service} className="border-b border-gray-50">
                        <td className="py-2 pr-3">
                          <div className="text-gray-900 font-medium">{s.service}</div>
                          {s.notes && <div className="text-xs text-gray-500">{s.notes}</div>}
                        </td>
                        <td className="py-2 pr-3 text-right text-gray-900">{formatGBP(s.monthlyCost)}</td>
                        <td className="py-2 pr-3 text-right text-gray-700">{formatGBP(s.annualCost ?? s.monthlyCost * 12)}</td>
                        <td className="py-2 pr-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${BILLING_BADGE[s.billing].classes}`}>
                            {BILLING_BADGE[s.billing].label}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-xs text-gray-500" title={`Source: ${s.source}`}>{s.lastVerified}</td>
                        <td className="py-2 text-xs text-gray-500">{s.nextRenewal ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
