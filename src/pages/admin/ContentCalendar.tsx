/**
 * Content — /admin/calendar
 *
 * What this page was until 10 September 2026: a month grid, a list view, campaign tabs, a
 * platform filter, a pipeline-health panel that graded four JSON files against a checklist,
 * and a content editor that saved into a table nothing read. All of it drew on four campaign
 * files compiled into this bundle. It could not show a single real scheduled post, because
 * the register those posts live in was not wired to it.
 *
 * What it is now: one read of public.content_calendar through the guarded route, shown as
 * the three questions a person actually has — what is ready to post, what is coming, what
 * went out. Every control that could not answer one of those is gone.
 *
 * The route stays /admin/calendar so nothing external breaks; the sidebar says "Content".
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Mail, Download, AlertTriangle, ImageOff } from 'lucide-react';
import {
  useAdminContent,
  NEXT_STATUS,
  CONTENT_STATUSES,
  type ContentRow,
  type ContentStatus,
} from '@/hooks/useAdminContent';
import { NewItemForm } from '@/components/content/NewItemForm';

const STATUS_CHIP: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  ready: 'bg-blue-100 text-blue-800 border-blue-200',
  scheduled: 'bg-amber-100 text-amber-800 border-amber-200',
  posted: 'bg-green-100 text-green-800 border-green-200',
  skipped: 'bg-rose-50 text-rose-700 border-rose-200',
};

const ACTION_LABEL: Record<ContentStatus, string> = {
  draft: 'Back to draft',
  ready: 'Mark ready',
  scheduled: 'Schedule',
  posted: 'Posted',
  skipped: 'Skip',
};

const DAY_FMT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London',
});
const TIME_FMT = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
});

const dayKey = (iso: string) => iso.slice(0, 10);

function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
      STATUS_CHIP[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {status}
    </span>
  );
}

function Channels({ row }: { row: ContentRow }) {
  const channels = row.metadata?.channels;
  if (!channels || !channels.length) return <span className="text-xs text-gray-400">no channel</span>;
  return <span className="text-xs text-gray-600">{channels.join(' · ')}</span>;
}

/** The first media URL, or an explicit "no image" — never a grey box that could be either. */
function Thumb({ row }: { row: ContentRow }) {
  const url = (row.media_urls || [])[0];
  if (!url) {
    return (
      <span className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-300 shrink-0"
            title="No media on this row">
        <ImageOff size={14} />
      </span>
    );
  }
  return (
    <img src={url} alt="" loading="lazy"
         className="w-10 h-10 rounded object-cover border border-gray-200 shrink-0" />
  );
}

function StatusControl({
  row, onSet, busy,
}: { row: ContentRow; onSet: (id: string, s: ContentStatus) => void; busy: boolean }) {
  const moves = NEXT_STATUS[row.status] ?? [];
  if (!moves.length) return null;
  return (
    <span className="flex gap-1 shrink-0">
      {moves.map((next) => (
        <button
          key={next}
          disabled={busy}
          onClick={() => onSet(row.id, next)}
          className="text-xs px-2 py-1 rounded border border-gray-200 hover:border-blkout-400 hover:bg-blkout-50 disabled:opacity-40"
        >
          {busy ? '…' : ACTION_LABEL[next]}
        </button>
      ))}
    </span>
  );
}

export function ContentCalendar() {
  const { data, error, isLoading, setStatus, refresh } = useAdminContent();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [justDrafted, setJustDrafted] = useState<ContentRow | null>(null);

  const onSet = async (id: string, next: ContentStatus) => {
    setBusyId(id);
    setWriteError(null);
    const failure = await setStatus(id, next);
    setBusyId(null);
    if (failure) setWriteError(failure);
  };

  const rows = data?.rows ?? [];

  const ready = useMemo(
    () => rows.filter((r) => r.status === 'ready'),
    [rows]);

  // The window: everything with a date inside it, whatever its status. Undated drafts are
  // in `drafts` below instead, because a day-grouped list has nowhere to put them.
  const byDay = useMemo(() => {
    const groups = new Map<string, ContentRow[]>();
    for (const r of rows) {
      if (!r.scheduled_for) continue;
      const key = dayKey(r.scheduled_for);
      if (data && (key < data.window.from || key > data.window.to)) continue;
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rows, data]);

  const drafts = useMemo(
    () => rows.filter((r) => r.status === 'draft' && !r.scheduled_for),
    [rows]);

  const posted = useMemo(
    () => rows.filter((r) => r.status === 'posted' && r.published_at)
             .sort((a, b) => (b.published_at || '').localeCompare(a.published_at || '')),
    [rows]);

  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          <p className="text-sm text-gray-600 mt-1">
            What is scheduled, ready, and posted. The register is <code className="text-xs bg-gray-100 px-1 rounded">content_calendar</code>;
            {' '}<code className="text-xs bg-gray-100 px-1 rounded">/post</code> publishes from it and writes back.
          </p>
        </header>

        {isLoading && <p className="text-gray-500">…</p>}

        {error && (
          <div className="card border-l-4 border-red-500 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-medium text-red-900">The register could not be read.</p>
                <p className="text-sm text-red-800 mt-1 font-mono break-all">{error}</p>
              </div>
            </div>
          </div>
        )}

        {data && (
          <>
            <NewItemForm
              campaigns={data.campaigns ?? []}
              onDrafted={(row) => { setJustDrafted(row); refresh(); }}
            />

            {justDrafted && (
              <div className={`card border-l-4 ${
                justDrafted.generated_by_agent
                  ? 'border-green-500 bg-green-50'
                  : 'border-amber-500 bg-amber-50'}`}>
                <p className={`text-sm font-medium ${
                  justDrafted.generated_by_agent ? 'text-green-900' : 'text-amber-900'}`}>
                  {justDrafted.generated_by_agent
                    ? 'Drafted by Sonnet — review before marking ready'
                    : `Saved without a draft: ${String(justDrafted.internal_notes || 'no reason given')}`}
                </p>
                <p className="text-sm text-gray-800 mt-2 font-medium">{justDrafted.title}</p>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{justDrafted.primary_content}</p>
                {!!(justDrafted.hashtags || []).length && (
                  <p className="text-xs text-gray-600 mt-2">{justDrafted.hashtags.join(' ')}</p>
                )}
              </div>
            )}

            {/* Counts. Every word in the vocabulary is shown, including the ones at zero —
                an absent chip reads as "not a thing", which is not what zero means. */}
            <div className="flex flex-wrap gap-2">
              {CONTENT_STATUSES.map((s) => (
                <span key={s} className={`px-3 py-1.5 rounded-lg border text-sm ${STATUS_CHIP[s]}`}>
                  <span className="font-semibold">{data.counts[s] ?? 0}</span> {s}
                </span>
              ))}
            </div>

            {writeError && (
              <p className="text-sm text-red-700 font-mono">{writeError}</p>
            )}

            {/* ── Ready to post ─────────────────────────────────────────────────── */}
            <section className="card">
              <h2 className="font-semibold text-gray-900 mb-1">Ready to post</h2>
              <p className="text-xs text-gray-500 mb-4">
                Cleared and waiting. Run <code className="bg-gray-100 px-1 rounded">/post</code> to publish one.
              </p>
              {ready.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing in the register for this window.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {ready.map((r) => (
                    <li key={r.id} className="py-2 flex items-center gap-3">
                      <Thumb row={r} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-gray-900 truncate">{r.title}</span>
                        <span className="block text-xs text-gray-500">
                          {r.metadata?.campaign || 'no campaign'} · <Channels row={r} /> ·{' '}
                          {(r.media_urls || []).length} media
                          {r.scheduled_for && ` · ${DAY_FMT.format(new Date(r.scheduled_for))}`}
                        </span>
                      </span>
                      <StatusControl row={r} onSet={onSet} busy={busyId === r.id} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── This week + next four weeks ───────────────────────────────────── */}
            <section className="card">
              <h2 className="font-semibold text-gray-900 mb-1">This week and the next four</h2>
              <p className="text-xs text-gray-500 mb-4">{data.window.from} to {data.window.to}</p>
              {byDay.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing in the register for this window.</p>
              ) : (
                <div className="space-y-4">
                  {byDay.map(([day, items]) => (
                    <div key={day}>
                      <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-1 mb-2">
                        {DAY_FMT.format(new Date(`${day}T12:00:00Z`))}
                      </h3>
                      <ul className="space-y-2">
                        {items.map((r) => (
                          <li key={r.id} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-11 shrink-0">
                              {r.scheduled_for ? TIME_FMT.format(new Date(r.scheduled_for)) : ''}
                            </span>
                            <Thumb row={r} />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm text-gray-900 truncate">{r.title}</span>
                              <span className="block text-xs text-gray-500">
                                {r.metadata?.campaign || 'no campaign'} · <Channels row={r} />
                              </span>
                            </span>
                            <StatusChip status={r.status} />
                            <StatusControl row={r} onSet={onSet} busy={busyId === r.id} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Undated drafts ────────────────────────────────────────────────────
                Written, no date. Without their own section they would be invisible on a
                page organised by day, which is how a draft gets forgotten. */}
            {drafts.length > 0 && (
              <section className="card">
                <h2 className="font-semibold text-gray-900 mb-1">Drafts with no date</h2>
                <p className="text-xs text-gray-500 mb-4">{drafts.length} written, none scheduled.</p>
                <ul className="divide-y divide-gray-100">
                  {drafts.map((r) => (
                    <li key={r.id} className="py-2 flex items-center gap-3">
                      <Thumb row={r} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-gray-900 truncate">{r.title}</span>
                        <span className="block text-xs text-gray-500">
                          {r.metadata?.campaign || 'no campaign'} · <Channels row={r} />
                        </span>
                      </span>
                      <StatusControl row={r} onSet={onSet} busy={busyId === r.id} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ── Posted ────────────────────────────────────────────────────────── */}
            <section className="card">
              <h2 className="font-semibold text-gray-900 mb-1">Posted, last 30 days</h2>
              {posted.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing in the register for this window.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {posted.map((r) => {
                    const links = Object.entries(r.metadata?.posted || {});
                    return (
                      <li key={r.id} className="py-2 flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-24 shrink-0">
                          {r.published_at ? DAY_FMT.format(new Date(r.published_at)) : ''}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-gray-900 truncate">{r.title}</span>
                          <span className="block text-xs text-gray-500">
                            {r.metadata?.campaign || 'no campaign'}
                          </span>
                        </span>
                        <span className="flex gap-2 shrink-0">
                          {links.length === 0 && <span className="text-xs text-gray-400">no link recorded</span>}
                          {links.map(([channel, info]) => (
                            info?.url
                              ? <a key={channel} href={info.url} target="_blank" rel="noreferrer"
                                   className="text-xs text-blkout-600 hover:underline">{channel}</a>
                              : <span key={channel} className="text-xs text-gray-400"
                                      title={info?.error || 'no url recorded'}>{channel}</span>
                          ))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* ── Quick actions ─────────────────────────────────────────────────── */}
            <section className="card">
              <h2 className="font-semibold text-gray-900 mb-3">Quick actions</h2>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/newsletters"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 text-sm">
                  <Mail size={15} /> Newsletters
                </Link>
                <a href="https://events.blkoutuk.com/api/calendar" download="blkout-events.ics"
                   className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-blkout-300 hover:bg-blkout-50 text-sm">
                  <Download size={15} /> Export ICS
                </a>
              </div>
            </section>

            <p className="text-xs text-gray-500">
              Automated routines — the weekly AIvor news digest and its Reel — publish on their
              own schedule and are not in this register.
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}
