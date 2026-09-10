/**
 * Income — the third Funding tab.
 *
 * Added 10 September 2026. Rob: "On funding, a tab that includes subscriptions and earned
 * income." Funding had only ever shown money BLKOUT was asking for. This shows the money
 * that has actually arrived, and where from.
 *
 * Every figure here comes from the books — ~/blkout/projects/financial-management/,
 * published to metrics.snapshots by build-finance.mjs and read through the guarded
 * /api/admin/finance route — except the membership counts, which come from
 * metrics.memberships_by_tier via /api/admin/dashboard, and the pipeline stage counts,
 * which are the same grant_pipeline rows the Pipeline tab renders.
 *
 * The rule this file must not break: a figure it did not fetch is not a figure. There is
 * no `?? 0` on anything fetched. Four states are visibly distinct — loading, failed,
 * never published, and a real value (including a real £0.00, which carries the date it
 * was true).
 */

import { AlertTriangle, Banknote, Landmark, ShoppingBag, HeartHandshake } from 'lucide-react';
import {
  useAdminFinance,
  MEASURE,
  type BookMeasure,
  type Books,
  type FundRow,
  type IncomeCodeRow,
} from '@/hooks/useAdminFinance';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import type { Grant } from '@/types';

const NOT_PUBLISHED =
  'The books have not published income by code yet — run build-finance.';

// Same shape as Finance.tsx and Dashboard.tsx: en-GB, a leading £, and null → "—", so an
// absent value can never be mistaken for zero.
const money = (amount: number | null | undefined) =>
  amount === null || amount === undefined
    ? '—'
    : `£${Number(amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const day = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

function measure(books: Books | null, name: string): BookMeasure | undefined {
  return books ? books[name] : undefined;
}

function Panel({
  title, icon: Icon, subtitle, children,
}: {
  title: string;
  icon: typeof Banknote;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      {subtitle && <p className="text-sm text-slate-500 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}

function Failed({ what, detail }: { what: string; detail: string }) {
  return (
    <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-medium text-red-900">{what}</p>
          <p className="text-sm text-red-800 mt-1 font-mono break-all">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function NotPublished() {
  return (
    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      {NOT_PUBLISHED}
    </p>
  );
}

/** One code's row. `total_to_date` and `this_fy` are real numbers or the code is absent. */
function CodeRow({ row }: { row: IncomeCodeRow }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 pr-4 font-mono text-xs text-slate-500 whitespace-nowrap">{row.code}</td>
      <td className="py-2 pr-4 text-slate-800">{row.name}</td>
      <td className="py-2 pr-4 text-right whitespace-nowrap text-slate-900">{money(row.total_to_date)}</td>
      <td className="py-2 text-right whitespace-nowrap text-slate-600">{money(row.this_fy)}</td>
    </tr>
  );
}

export function IncomeSection({ grants }: { grants: Grant[] }) {
  const finance = useAdminFinance();
  const dashboard = useAdminDashboard();

  const books = finance.data ? finance.data.books : null;
  const income = measure(books, MEASURE.incomeByCode);
  const fundsMeasure = measure(books, MEASURE.funds);

  const funds: FundRow[] = fundsMeasure?.detail?.funds ?? [];
  const codes: IncomeCodeRow[] | undefined = income?.detail?.codes;
  const asAt = income?.detail?.as_at;

  const earnedCodes = (codes ?? []).filter((c) => ['4200', '4300', '4500'].includes(c.code));
  const donations = (codes ?? []).find((c) => c.code === '4400');
  const subscriptionCode = (codes ?? []).find((c) => c.code === '4100');

  // Stage counts from the same pipeline rows the Pipeline tab shows.
  const stageCounts = grants.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {});

  // memberships_by_tier is a real (currently empty) list once the dashboard answers.
  // Undefined means it did not answer, which is not the same as nobody having joined.
  const tiers = dashboard.data ? dashboard.data.memberships_by_tier : undefined;
  const memberTotal = tiers ? tiers.reduce((sum, t) => sum + (t.members || 0), 0) : undefined;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Money that has arrived, from the books.
        {asAt && ` As at ${day(asAt)}.`}
        {income?.detail?.fy_start && income?.detail?.fy_end &&
          ` This financial year runs ${day(income.detail.fy_start)} to ${day(income.detail.fy_end)}.`}
      </p>

      {finance.error && <Failed what="The books could not be read." detail={finance.error} />}

      {/* ── Grants ─────────────────────────────────────────────────────────── */}
      <Panel
        title="Grants"
        icon={Landmark}
        subtitle="Restricted funds: what was awarded, what has landed, what is still owed, and what has been spent."
      >
        {finance.isLoading && <p className="text-sm text-slate-500">…</p>}

        {!finance.isLoading && !finance.error && funds.length === 0 && (
          <p className="text-sm text-slate-500">
            No funds in the books yet. A fund appears here once it has an income code in
            accounts-map.json.
          </p>
        )}

        {funds.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Fund</th>
                  <th className="py-2 pr-4 font-medium">Funder</th>
                  <th className="py-2 pr-4 font-medium text-right">Awarded</th>
                  <th className="py-2 pr-4 font-medium text-right">Received</th>
                  <th className="py-2 pr-4 font-medium text-right">Receivable</th>
                  <th className="py-2 pr-4 font-medium text-right">Spent</th>
                  <th className="py-2 font-medium text-right">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f.code} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-slate-900">{f.fund}</td>
                    <td className="py-2 pr-4 text-slate-600">{f.funder || '—'}</td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">{money(f.awarded)}</td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">{money(f.received)}</td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">{money(f.receivable)}</td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">{money(f.spent)}</td>
                    <td className="py-2 text-right whitespace-nowrap font-medium">{money(f.remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            In the pipeline — {grants.length} application{grants.length === 1 ? '' : 's'}
          </p>
          {grants.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing in the pipeline.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(stageCounts).sort(([a], [b]) => a.localeCompare(b)).map(([stage, n]) => (
                <span key={stage} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
                  <span className="font-semibold">{n}</span> {stage.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </Panel>

      {/* ── Subscriptions ──────────────────────────────────────────────────── */}
      <Panel
        title="Subscriptions"
        icon={HeartHandshake}
        subtitle="Membership of the society. Free · £3 a month · £10 a month, collected through Zeffy — fee-free, so income equals receipts."
      >
        {dashboard.isLoading && <p className="text-sm text-slate-500">…</p>}

        {dashboard.error && (
          <Failed what="Membership counts could not be read." detail={dashboard.error} />
        )}

        {tiers && (
          memberTotal === 0 ? (
            <p className="text-sm text-slate-700">
              <span className="font-semibold">No members yet</span> — membership opens on Beam Day,
              28 December 2026.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 font-medium">Tier</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium text-right">Members</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((t, i) => (
                    <tr key={`${t.tier}-${t.status}-${i}`} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 text-slate-900">{t.tier || '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{t.status || '—'}</td>
                      <td className="py-2 text-right font-medium">{t.members}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200">
                    <td className="py-2 pr-4 font-medium text-slate-900" colSpan={2}>Total</td>
                    <td className="py-2 text-right font-bold">{memberTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        )}

        <dl className="mt-5 pt-4 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Subscription income to date (4100)
            </dt>
            <dd className="text-2xl font-bold text-slate-900 mt-1">
              {finance.isLoading ? '…' : subscriptionCode ? money(subscriptionCode.total_to_date) : '—'}
            </dd>
            <dd className="text-xs text-slate-400 mt-0.5">
              {finance.isLoading ? '' : subscriptionCode ? `as at ${day(asAt)}` : NOT_PUBLISHED}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Zeffy payouts receivable (1100)
            </dt>
            <dd className="text-2xl font-bold text-slate-900 mt-1">
              {finance.isLoading
                ? '…'
                : !income
                  ? '—'
                  : income.detail?.zeffy_receivable === null ||
                    income.detail?.zeffy_receivable === undefined
                    ? 'not recorded'
                    : money(income.detail.zeffy_receivable)}
            </dd>
            <dd className="text-xs text-slate-400 mt-0.5">
              Money members have paid that Zeffy has not yet paid out.
            </dd>
          </div>
        </dl>
      </Panel>

      {/* ── Earned ─────────────────────────────────────────────────────────── */}
      <Panel
        title="Earned income"
        icon={ShoppingBag}
        subtitle="Unrestricted income the society has earned: trading, events and ticketing, and fees for services."
      >
        {finance.isLoading && <p className="text-sm text-slate-500">…</p>}

        {!finance.isLoading && !finance.error && !codes && <NotPublished />}

        {codes && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 font-medium">Code</th>
                    <th className="py-2 pr-4 font-medium">Account</th>
                    <th className="py-2 pr-4 font-medium text-right">To date</th>
                    <th className="py-2 font-medium text-right">This year</th>
                  </tr>
                </thead>
                <tbody>
                  {earnedCodes.map((c) => <CodeRow key={c.code} row={c} />)}
                  <tr className="border-t border-slate-200">
                    <td className="py-2 pr-4" />
                    <td className="py-2 pr-4 font-medium text-slate-900">Total earned</td>
                    <td className="py-2 pr-4 text-right font-bold whitespace-nowrap">
                      {money(income?.detail?.unrestricted_earned)}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap text-slate-600">
                      {money(earnedCodes.reduce((sum, c) => sum + c.this_fy, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Donations sit outside the total on purpose. */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Donations (4400) — <span className="font-normal text-slate-600">not earned income</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gifts, including the costs a director meets personally and books as a donation.
                    Kept out of the earned total so the trading picture stays honest.
                  </p>
                </div>
                <p className="text-2xl font-bold text-slate-900 whitespace-nowrap">
                  {donations ? money(donations.total_to_date) : money(income?.detail?.donations)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-4">
              As at {day(asAt)} · published by build-finance.mjs from the ledger.
            </p>
          </>
        )}
      </Panel>
    </div>
  );
}
