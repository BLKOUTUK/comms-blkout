/**
 * Analytics — reach, followers, members, the Hub, the newsletter and first gestures.
 *
 * Built 11 Oct 2026 (Rob: "an analytics page on comms dashboard with key data that report on
 * our engagement, followers, members, Hub, newsletter opens etc"). Reads the monthly
 * metrics.snapshots rows through the guarded service-role route (migration 025) — the same
 * rows the board numbers page is rendered from, so the two can never disagree.
 *
 * Rules carried over from the board numbers page and the Dashboard:
 * - a figure that was not collected is a gap ("—", with the reason on hover), never a 0;
 * - web figures are GB visitors (crawlers filtered out by the collector's country rule);
 * - newsletter opens are inflated by Apple Mail, so clicks sit beside them;
 * - no "unmet" / 48-hour-window count: that measure was retired on 29 Sep 2026 (Rob), so the
 *   RPC does not return it.
 */

import { Globe, Instagram, Users, Mail, HeartHandshake } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/shared/StatCard';
import { useAdminAnalytics, indexRows, type RowIndex, type SnapshotRow } from '@/hooks/useAdminAnalytics';

const SITES: { key: string; name: string }[] = [
  { key: 'apex', name: 'blkoutuk.com' },
  { key: 'events', name: 'Events' },
  { key: 'news', name: 'News' },
  { key: 'voices', name: 'Voices' },
  { key: 'comms', name: 'Discover (comms)' },
  { key: 'compass', name: "Ivor's Compass" },
  { key: 'commons', name: 'Commons' },
];

// Platforms nobody collects yet. Listed so the gap is visible, not forgotten.
const NOT_COLLECTED_FOLLOWERS = ['Facebook', 'YouTube', 'TikTok', 'LinkedIn', 'X'];

const num = (n: number) => Number(n).toLocaleString('en-GB');
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—');
const monthName = (period: string) =>
  new Date(`${period}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function okValue(idx: RowIndex, measure: string, period: string): number | null {
  const r = idx[measure]?.[period];
  return r && r.status === 'ok' && r.value !== null ? Number(r.value) : null;
}

/** A table cell: the number, or a gap that says why on hover. */
function Cell({ idx, measure, period }: { idx: RowIndex; measure: string; period: string }) {
  const r = idx[measure]?.[period];
  if (!r) return <td className="py-2 px-3 text-right text-gray-400" title="Not collected for this month">—</td>;
  if (r.status !== 'ok' || r.value === null)
    return <td className="py-2 px-3 text-right text-amber-600" title={`${r.status} — ${r.source}`}>—</td>;
  return <td className="py-2 px-3 text-right tabular-nums">{num(Number(r.value))}</td>;
}

/** Latest ok row for a measure, by period then collection time. */
function latest(idx: RowIndex, measure: string): SnapshotRow | null {
  const rows = Object.values(idx[measure] || {}).filter((r) => r.status === 'ok' && r.value !== null);
  rows.sort((a, b) => (a.period + a.taken_at).localeCompare(b.period + b.taken_at));
  return rows.length ? rows[rows.length - 1] : null;
}

export function Analytics() {
  const { data, error, isLoading } = useAdminAnalytics();

  if (isLoading) return <Layout><p className="text-gray-500">Loading analytics…</p></Layout>;
  if (error || !data)
    return (
      <Layout>
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Analytics unavailable — /api/admin/analytics did not answer: {error}
        </p>
      </Layout>
    );

  const idx = indexRows(data.rows);
  // Closed months = those the monthly collector has run for (it writes the web rows).
  const closed = [...new Set(data.rows.filter((r) => r.measure === 'web.apex.visitors').map((r) => r.period))].sort();
  const months = closed.slice(-3);
  const last = months[months.length - 1];

  const allSitesVisitors = (p: string) => {
    const vals = SITES.map((s) => okValue(idx, `web.${s.key}.visitors`, p));
    return vals.every((v) => v === null) ? null : vals.reduce<number>((a, v) => a + (v ?? 0), 0);
  };
  const sitesCollected = (p: string) => SITES.filter((s) => okValue(idx, `web.${s.key}.visitors`, p) !== null).length;

  const ig = latest(idx, 'instagram.followers');
  const hub = latest(idx, 'hub.members');
  const opened90 = latest(idx, 'newsletter.opened_90d');
  const list = latest(idx, 'newsletter.list');
  const members = latest(idx, 'memberships.total');
  const sources = (idx['web.apex.visitors_by_source']?.[last]?.detail?.sources || {}) as Record<string, number>;
  const lastSends = (idx['newsletter.sends']?.[last]?.detail?.campaigns || []) as Array<Record<string, unknown>>;
  const gaps = data.rows.filter((r) => r.status !== 'ok' && months.includes(r.period));

  const tile = (r: SnapshotRow | null) => (r ? num(Number(r.value)) : 'not collected');
  const allLast = last ? allSitesVisitors(last) : null;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Monthly figures, collected on the 1st of each month.
            {last && <> Latest closed month: <strong>{monthName(last)}</strong>.</>} The same stored figures as the board
            numbers page.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title={`Website visitors, ${last ? monthName(last) : '—'}`} value={allLast === null ? 'not collected' : num(allLast)} icon={Globe} />
          <StatCard title="Instagram followers" value={tile(ig)} icon={Instagram} iconColor="text-pink-600" iconBg="bg-pink-100" />
          <StatCard title="BLKOUTHUB members" value={tile(hub)} icon={HeartHandshake} iconColor="text-fuchsia-600" iconBg="bg-fuchsia-100" />
          <StatCard title="Newsletter readers, last 90 days" value={tile(opened90)} icon={Mail} iconColor="text-amber-600" iconBg="bg-amber-100" />
          <StatCard
            title={members && Number(members.value) === 0 ? 'Members — opens 28 Dec 2026' : 'Members'}
            value={tile(members)}
            icon={Users}
            iconColor="text-purple-600"
            iconBg="bg-purple-100"
          />
        </div>

        {/* Reach */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Websites</h2>
          <p className="text-sm text-gray-500 mb-4">Visitors from the UK each month (Plausible). Crawlers and overseas traffic are filtered out.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">Site</th>
                  {months.map((m) => <th key={m} className="py-2 px-3 text-right">{monthName(m)}</th>)}
                </tr>
              </thead>
              <tbody>
                {SITES.map((s) => (
                  <tr key={s.key} className="border-b border-gray-100">
                    <td className="py-2 pr-3">{s.name}</td>
                    {months.map((m) => <Cell key={m} idx={idx} measure={`web.${s.key}.visitors`} period={m} />)}
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2 pr-3">All sites</td>
                  {months.map((m) => {
                    const v = allSitesVisitors(m);
                    return (
                      <td key={m} className="py-2 px-3 text-right tabular-nums" title={`${sitesCollected(m)} of ${SITES.length} sites collected`}>
                        {v === null ? '—' : num(v)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">A person who visits two sites counts once on each, so "All sites" is visits to sites, not people.</p>
          {Object.keys(sources).length > 0 && (
            <div className="mt-5">
              <h3 className="font-semibold text-gray-900 mb-2">Where blkoutuk.com visitors came from, {monthName(last)}</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(sources).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <span key={k} className="text-sm bg-gray-100 rounded px-2 py-1">{k} <strong>{num(v)}</strong></span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Followers */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Followers</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-3">Instagram</td>
                <td className="py-2 px-3 text-right tabular-nums">{ig ? num(Number(ig.value)) : '—'}</td>
                <td className="py-2 px-3 text-gray-500">{ig ? `as at ${day(ig.taken_at)}` : 'not collected'}</td>
              </tr>
              {NOT_COLLECTED_FOLLOWERS.map((p) => (
                <tr key={p} className="border-b border-gray-100 text-gray-400">
                  <td className="py-2 pr-3">{p}</td>
                  <td className="py-2 px-3 text-right">—</td>
                  <td className="py-2 px-3">not collected yet</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Members and the Hub */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Members and the Hub</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3">Measure</th>
                {months.map((m) => <th key={m} className="py-2 px-3 text-right">{monthName(m)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['memberships.total', 'Members (membership opens 28 Dec 2026)'],
                ['hub.members', 'BLKOUTHUB members'],
                ['hub.joins', 'Joined the Hub in the month'],
              ].map(([m, label]) => (
                <tr key={m} className="border-b border-gray-100">
                  <td className="py-2 pr-3">{label}</td>
                  {months.map((p) => <Cell key={p} idx={idx} measure={m} period={p} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Newsletter */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Newsletter</h2>
          <p className="text-sm text-gray-500 mb-4">
            {list && opened90 ? <>{num(Number(opened90.value))} of {num(Number(list.value))} on the list opened something in the last 90 days ({pct(Number(opened90.value), Number(list.value))}). </> : null}
            Opens are inflated by Apple Mail; clicks are the honest number.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3">Measure</th>
                {months.map((m) => <th key={m} className="py-2 px-3 text-right">{monthName(m)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['newsletter.list', 'On the list'],
                ['newsletter.sends', 'Emails sent'],
                ['newsletter.send.recipients', 'Delivered to'],
                ['newsletter.send.unique_opens', 'Opened'],
                ['newsletter.send.unique_clicks', 'Clicked'],
                ['newsletter.send.unsubscribes', 'Unsubscribed'],
              ].map(([m, label]) => (
                <tr key={m} className="border-b border-gray-100">
                  <td className="py-2 pr-3">{label}</td>
                  {months.map((p) => <Cell key={p} idx={idx} measure={m} period={p} />)}
                </tr>
              ))}
              <tr className="text-gray-600">
                <td className="py-2 pr-3">Open rate · click rate</td>
                {months.map((p) => {
                  const r = okValue(idx, 'newsletter.send.recipients', p);
                  const o = okValue(idx, 'newsletter.send.unique_opens', p);
                  const c = okValue(idx, 'newsletter.send.unique_clicks', p);
                  return (
                    <td key={p} className="py-2 px-3 text-right tabular-nums">
                      {r && o !== null && c !== null ? `${pct(o, r)} · ${pct(c, r)}` : '—'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
          {lastSends.length > 0 && (
            <div className="mt-5">
              <h3 className="font-semibold text-gray-900 mb-2">Emails sent in {monthName(last)}</h3>
              <ul className="text-sm space-y-1">
                {lastSends.map((c, i) => {
                  const rec = Number(c.recipients || 0);
                  return (
                    <li key={String(c.id ?? i)}>
                      <span className="text-gray-500">{c.sent_at ? day(String(c.sent_at)) : ''}</span>{' '}
                      <strong>{String(c.subject ?? 'Untitled send')}</strong> — {num(rec)} delivered, {num(Number(c.unique_opens || 0))} opened ({pct(Number(c.unique_opens || 0), rec)}), {num(Number(c.unique_clicks || 0))} clicked ({pct(Number(c.unique_clicks || 0), rec)})
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Engagement */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Engagement</h2>
          <p className="text-sm text-gray-500 mb-4">A first gesture is the first time a man reaches us: so far an event signup, an Ivor's Compass claim or a reply to Hub outreach.</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3">Measure</th>
                {months.map((m) => <th key={m} className="py-2 px-3 text-right">{monthName(m)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['gestures.in_month', 'First gestures in the month'],
                ['gestures.total', 'First gestures held, to date'],
                ['gestures.met', 'Met, to date'],
                ['events.interest.picnic-2026', 'Picnic interest signups'],
                ['events.rsvps', 'Event RSVPs'],
                ['news.voting.votes', 'News votes cast'],
              ].map(([m, label]) => (
                <tr key={m} className="border-b border-gray-100">
                  <td className="py-2 pr-3">{label}</td>
                  {months.map((p) => <Cell key={p} idx={idx} measure={m} period={p} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reach: Priestley's 7-11-4, measured monthly by comms-blkout brand-7114.yml */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Reach: 7-11-4</h2>
          <p className="text-sm text-gray-500 mb-4">Can someone spend 7 hours with BLKOUT, across 11 interactions, on 4 platforms? Hours count long-form media published in the last 12 months; Reels and reading time are estimates.</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3">Measure</th>
                {months.map((m) => <th key={m} className="py-2 px-3 text-right">{monthName(m)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['brand.7114.hours_12m', 'Hours of media, last 12 months (target 7)'],
                ['brand.7114.touches_per_fortnight', 'Touches per fortnight (target 11)'],
                ['brand.7114.platforms_active', 'Platforms active (target 4)'],
                ['brand.7114.youtube.minutes_12m', 'YouTube minutes, last 12 months'],
                ['brand.7114.voices.minutes_12m', 'Voices reading minutes, last 12 months'],
                ['brand.7114.youtube.uploads', 'YouTube uploads'],
                ['brand.7114.youtube.views', 'YouTube views (Studio export)'],
                ['brand.7114.youtube.watch_hours', 'YouTube watch hours (Studio export)'],
                ['brand.7114.youtube.impressions', 'YouTube thumbnail impressions'],
                ['brand.7114.youtube.ctr_pct', 'YouTube click-through rate, %'],
                ['brand.7114.youtube.subscribers_net', 'YouTube subscribers, net change'],
                ['brand.7114.youtube.audience_55plus_pct', 'YouTube views from viewers 55+, %'],
                ['brand.7114.youtube.audience_male_pct', 'YouTube views from men, %'],
                ['brand.7114.instagram.posts', 'Instagram posts'],
                ['brand.7114.instagram.avg_comments', 'Instagram comments per post'],
                ['brand.7114.voices.essays', 'Voices essays'],
                ['brand.7114.digest.editions', 'AIvor digests'],
              ].map(([m, label]) => (
                <tr key={m} className="border-b border-gray-100">
                  <td className="py-2 pr-3">{label}</td>
                  {months.map((p) => <Cell key={p} idx={idx} measure={m} period={p} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {gaps.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Sources that did not answer</h2>
            <ul className="text-sm text-amber-700 space-y-1">
              {gaps.map((g) => <li key={g.measure + g.period}>{monthName(g.period)} · {g.measure} — {g.status} ({g.source})</li>)}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Read {day(data.generated_at)} from metrics.snapshots. "—" means not collected that month; hover for the reason.
        </p>
      </div>
    </Layout>
  );
}
