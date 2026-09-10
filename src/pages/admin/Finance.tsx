/**
 * Finance — the books.
 *
 * Rewritten 10 Sep 2026 (brief: docs/finance-one-system-brief-2026-09-10.md). Rob:
 * "finance and the bookkeeping system should be one system not two".
 *
 * Before this, finance lived in three places that did not agree: this page (running-cost
 * subscriptions only), the CRM's /financial page (public.financial_transactions — zero
 * rows, never written, now retired), and the bookkeeping pipeline on Rob's machine, which
 * is the only one that is actually the books.
 *
 * One ledger → one publish step → one read surface. The ledger is unchanged: bank CSVs in
 * ~/blkout/projects/financial-management/ledger/, mapped by accounts-map.json, built by
 * build-finance.mjs, uploaded monthly through Mission Control. build-finance.mjs now also
 * publishes nine `finance.*` measures to metrics.snapshots, and this page reads the latest
 * of each through the guarded service-role route (migration 017).
 *
 * The one rule this page must not break: a position it did not fetch is not a position.
 * No `?? 0` on any fetched value; "not published yet" is an amber panel and no tiles, and
 * a published 0 renders as 0 with the date it was true.
 */

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Receipt,
  Landmark,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import {
  useAdminFinance,
  MEASURE,
  type BookMeasure,
  type Books,
  type FinanceSubscription,
  type FundRow,
  type SubscriptionsCost,
} from '@/hooks/useAdminFinance';

// Same shape as Dashboard.tsx's money(): en-GB, a leading £, and null → "—" so an absent
// value can never read as zero. Books carry pence — the pipeline rounds to the penny at
// every boundary precisely so this surface can show them.
const money = (amount: number | null | undefined, dp = 2) =>
  amount === null || amount === undefined
    ? '—'
    : `£${Number(amount).toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

const day = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const CATEGORY_LABELS: Record<string, string> = {
  infrastructure: 'Infrastructure',
  ai: 'AI & APIs',
  tools: 'Tools',
  domain: 'Domains',
};

const BILLING_BADGE: Record<string, { label: string; classes: string }> = {
  monthly: { label: 'monthly', classes: 'bg-blue-50 text-blue-700' },
  annual: { label: 'annual', classes: 'bg-purple-50 text-purple-700' },
  usage: { label: 'usage', classes: 'bg-amber-50 text-amber-700' },
};

function badgeFor(cycle: string | null) {
  return BILLING_BADGE[cycle || ''] || BILLING_BADGE.usage;
}

function categoryOf(row: FinanceSubscription): string {
  const c = row.category;
  return c && CATEGORY_LABELS[c] ? c : 'tools';
}

/** One published measure, or undefined when this measure has never been published. */
function measure(books: Books | null, name: string): BookMeasure | undefined {
  return books ? books[name] : undefined;
}

function PositionTile({ label, m }: { label: string; m: BookMeasure | undefined }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">
        {m ? money(m.value) : 'unavailable'}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {m ? `as at ${day(m.detail?.as_at)}` : 'never published'}
      </p>
    </div>
  );
}

export function Finance() {
  const { data, error, isLoading } = useAdminFinance();

  const books = data ? data.books : null;
  const cash = measure(books, MEASURE.cash);
  const receivable = measure(books, MEASURE.receivable);
  const net = measure(books, MEASURE.net);
  const unchecked = measure(books, MEASURE.monthsUnchecked);
  const fundsMeasure = measure(books, MEASURE.funds);
  const attention = measure(books, MEASURE.needsAttention);
  const transactions = measure(books, MEASURE.transactions);
  const monthsRecorded = measure(books, MEASURE.monthsRecorded);

  const funds: FundRow[] = fundsMeasure?.detail?.funds ?? [];
  const unmapped = attention?.detail?.unmapped ?? [];
  const flags = attention?.detail?.flags ?? [];

  // The publish stamp: any measure carries it, cash is the one that always exists.
  const stamp = cash ?? net ?? receivable ?? unchecked;

  const subs: FinanceSubscription[] = (data?.subscriptions ?? []).filter((s) => s.active);
  const cost: SubscriptionsCost | null = data?.subscriptions_cost ?? null;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Finance — the books</h1>
          <p className="text-gray-600 mt-1">
            The society's ledger, published from the bookkeeping pipeline. Write path:
            Mission Control monthly statement upload.
          </p>
        </div>

        {/* Failed — the whole read, not one panel. Say what broke. */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Finance unavailable</p>
              <p className="mt-1">/api/admin/finance did not answer: {error}</p>
            </div>
          </div>
        )}

        {isLoading && <p className="text-sm text-gray-500 py-4">…</p>}

        {/* Never published — no tiles at all. A missing position is not a zero position. */}
        {!isLoading && !error && !books && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">The books have not been published yet</p>
              <p className="mt-1">
                Run <code className="bg-amber-100 px-1 rounded">node build-finance.mjs</code> in
                the financial-management folder.
              </p>
            </div>
          </div>
        )}

        {/* ---------- Position ---------- */}
        {!isLoading && !error && books && (
          <>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Landmark className="h-5 w-5 text-gray-400" />
                Position
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PositionTile label="Cash at bank" m={cash} />
                <PositionTile label="Grants receivable" m={receivable} />
                <PositionTile label="Net position" m={net} />
              </div>

              {/* The status strip. Unchecked months are the loudest thing on this page:
                  a position built from an incomplete ledger is not a position. */}
              {unchecked && unchecked.value !== null && unchecked.value > 0 ? (
                <div className="mt-4 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <p className="font-bold text-base">
                      {unchecked.value} month{unchecked.value === 1 ? '' : 's'} not yet checked:{' '}
                      {(unchecked.detail?.months_to_check ?? []).join(', ') || '—'}
                    </p>
                    <p className="mt-1">The position is stale until they are.</p>
                  </div>
                </div>
              ) : unchecked ? (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-green-900">
                    <p className="font-medium">
                      Checked to {day(unchecked.detail?.statement_to)}.
                    </p>
                    <p className="mt-1">
                      Nil months: {(unchecked.detail?.nil_months ?? []).join(', ') || 'none'}.
                    </p>
                  </div>
                </div>
              ) : null}

              <p className="text-xs text-gray-500 mt-3">
                Published {stamp?.detail?.generated ?? '—'} · period {stamp?.period ?? '—'}
                {transactions && transactions.value !== null
                  ? ` · ${transactions.value} transactions`
                  : ''}
                {monthsRecorded && monthsRecorded.value !== null
                  ? ` · ${monthsRecorded.value} months recorded`
                  : ''}
              </p>
            </div>

            {/* ---------- Funds ---------- */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-amber-600" />
                Funds
              </h2>
              {!fundsMeasure ? (
                <p className="text-sm text-gray-500">Not published.</p>
              ) : funds.length === 0 ? (
                <p className="text-sm text-gray-500">No funds recorded.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="pb-2 pr-3 font-medium">Fund</th>
                        <th className="pb-2 pr-3 font-medium">Funder</th>
                        <th className="pb-2 pr-3 font-medium">Restricted</th>
                        <th className="pb-2 pr-3 font-medium text-right">Awarded</th>
                        <th className="pb-2 pr-3 font-medium text-right">Received</th>
                        <th className="pb-2 pr-3 font-medium text-right">Receivable</th>
                        <th className="pb-2 pr-3 font-medium text-right">Spent</th>
                        <th className="pb-2 font-medium text-right">Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funds.map((f) => (
                        <tr key={`${f.code}-${f.fund}`} className="border-b border-gray-50">
                          <td className="py-2 pr-3 text-gray-900 font-medium">{f.fund}</td>
                          <td className="py-2 pr-3 text-gray-700">{f.funder ?? '—'}</td>
                          <td className="py-2 pr-3 text-gray-700">{f.restricted ? 'Yes' : 'No'}</td>
                          <td className="py-2 pr-3 text-right text-gray-900">{money(f.awarded)}</td>
                          <td className="py-2 pr-3 text-right text-gray-700">{money(f.received)}</td>
                          <td className="py-2 pr-3 text-right text-gray-700">{money(f.receivable)}</td>
                          <td className="py-2 pr-3 text-right text-gray-700">{money(f.spent)}</td>
                          <td className="py-2 text-right text-gray-900 font-medium">{money(f.remaining)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ---------- Needs attention ---------- */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Needs attention
              </h2>

              {!attention ? (
                <p className="text-sm text-gray-500">Not published.</p>
              ) : unmapped.length === 0 && flags.length === 0 ? (
                <p className="text-sm text-gray-600">Nothing outstanding.</p>
              ) : (
                <div className="space-y-5">
                  {unmapped.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">
                        {unmapped.length} transaction{unmapped.length === 1 ? '' : 's'} need an
                        account code
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        Add a line to <code>accounts-map.json</code> for each, then re-run the
                        builder.
                      </p>
                      <ul className="space-y-1 text-sm">
                        {unmapped.map((u, i) => (
                          <li key={`${u.date}-${i}`} className="flex flex-wrap gap-x-3 text-gray-700">
                            <span className="text-gray-500">{u.date}</span>
                            <span className="text-gray-900">{u.description}</span>
                            <span className="text-gray-900 font-medium">{money(u.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {flags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">
                        {flags.length} item{flags.length === 1 ? '' : 's'} flagged for evidence
                      </h3>
                      <ul className="space-y-2 text-sm">
                        {flags.map((f, i) => (
                          <li key={`${f.date}-${i}`} className="border-l-2 border-amber-300 pl-3">
                            <div className="flex flex-wrap gap-x-3 text-gray-700">
                              <span className="text-gray-500">{f.date}</span>
                              <span className="text-gray-900">{f.description}</span>
                            </div>
                            <div className="text-xs text-amber-800 mt-0.5">{f.note}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ---------- Subscriptions ---------- */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Receipt className="h-5 w-5 text-gray-400" />
            Subscriptions
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Running costs, from <code>public.subscriptions</code> — the same read as the books
            above. These are not yet in the ledger's account codes.
          </p>

          {isLoading && <p className="text-sm text-gray-500 py-2">…</p>}

          {!isLoading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm font-medium text-gray-500">Total monthly</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {money(cost?.monthly_cost_gbp)}
                    <span className="text-base font-normal text-gray-500">/mo</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {cost ? `${cost.active_subscriptions} active subscriptions` : 'unavailable'}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm font-medium text-gray-500">Total annual</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {money(
                      cost?.monthly_cost_gbp === null || cost?.monthly_cost_gbp === undefined
                        ? null
                        : Number(cost.monthly_cost_gbp) * 12,
                    )}
                    <span className="text-base font-normal text-gray-500">/yr</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">monthly × 12</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm font-medium text-gray-500">Last invoice seen</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {cost?.latest_invoice_seen ? cost.latest_invoice_seen.slice(0, 10) : '—'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">from the subscription scanner</p>
                </div>
              </div>

              {subs.length === 0 && (
                <p className="text-sm text-gray-500 mt-4">No active subscriptions recorded.</p>
              )}

              <div className="space-y-6 mt-4">
                {Object.keys(CATEGORY_LABELS).map((cat) => {
                  const items = subs.filter((s) => categoryOf(s) === cat);
                  if (items.length === 0) return null;
                  const catTotal = items.reduce((sum, x) => sum + (x.monthly_cost_gbp ?? 0), 0);
                  return (
                    <div key={cat} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Receipt className="h-5 w-5 text-amber-600" />
                          {CATEGORY_LABELS[cat]}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {money(catTotal)}/mo · {money(catTotal * 12)}/yr
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
                              <tr key={s.id} className="border-b border-gray-50">
                                <td className="py-2 pr-3">
                                  <div className="text-gray-900 font-medium">{s.service_name}</div>
                                  {s.notes && <div className="text-xs text-gray-500">{s.notes}</div>}
                                </td>
                                <td className="py-2 pr-3 text-right text-gray-900">
                                  {money(s.monthly_cost_gbp)}
                                </td>
                                <td className="py-2 pr-3 text-right text-gray-700">
                                  {money(
                                    s.annual_cost_gbp ??
                                      (s.monthly_cost_gbp === null ? null : s.monthly_cost_gbp * 12),
                                  )}
                                </td>
                                <td className="py-2 pr-3">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badgeFor(s.billing_cycle).classes}`}
                                  >
                                    {badgeFor(s.billing_cycle).label}
                                  </span>
                                </td>
                                <td
                                  className="py-2 pr-3 text-xs text-gray-500"
                                  title={`Source: ${s.source ?? 'unknown'}`}
                                >
                                  {s.last_invoice_at ? s.last_invoice_at.slice(0, 10) : '—'}
                                </td>
                                <td className="py-2 text-xs text-gray-500">
                                  {s.next_renewal_at ?? '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ---------- Where things live ---------- */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
            Where things live
          </h2>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>
              The ledger and reconciliations:{' '}
              <code className="bg-gray-100 px-1 rounded">~/blkout/projects/financial-management/</code>{' '}
              (Rob's machine).
            </li>
            <li>Monthly upload: Mission Control.</li>
            <li>The CRM's transactions page is retired — it never held a row.</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
