import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Filter, Search, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFundraisingDrafts, AUDIENCE_NAMES } from '@/hooks/useFundraisingDrafts';
import type { FundraisingDraft } from '@/hooks/useFundraisingDrafts';

const STATUS_COLORS: Record<FundraisingDraft['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  reviewed: 'bg-amber-100 text-amber-700',
  sent: 'bg-blue-100 text-blue-700',
  responded: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-gray-100 text-gray-500',
};

function DriftBadge({ summary }: { summary: FundraisingDraft['drift_summary'] }) {
  const drift = summary?.DRIFT ?? 0;
  const missing = summary?.MISSING ?? 0;
  const ambiguous = summary?.AMBIGUOUS ?? 0;
  if (drift > 0 || missing > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
        <AlertCircle className="w-3 h-3" />
        {drift > 0 ? `${drift} drift` : ''}
        {drift > 0 && missing > 0 ? ' · ' : ''}
        {missing > 0 ? `${missing} missing` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
      <CheckCircle2 className="w-3 h-3" />
      clean {ambiguous > 0 ? `(${ambiguous} defensive)` : ''}
    </span>
  );
}

export function Fundraising() {
  const { drafts, isLoading, error } = useFundraisingDrafts();
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return drafts.filter((d) => {
      if (audienceFilter !== 'all' && d.audience_profile !== audienceFilter) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (typeFilter !== 'all' && d.output_type !== typeFilter) return false;
      if (s) {
        const haystack = `${d.partner_name ?? ''} ${d.org_name ?? ''} ${d.file_path}`.toLowerCase();
        if (!haystack.includes(s)) return false;
      }
      return true;
    });
  }, [drafts, search, audienceFilter, statusFilter, typeFilter]);

  const typesPresent = useMemo(
    () => Array.from(new Set(drafts.map((d) => d.output_type))).sort(),
    [drafts],
  );

  const stats = useMemo(() => {
    const byStatus = { draft: 0, reviewed: 0, sent: 0, responded: 0, archived: 0 };
    drafts.forEach((d) => {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    });
    return byStatus;
  }, [drafts]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Critical Frequency · Fundraising Drafts</h1>
          <p className="text-slate-600 mt-1">
            Audience-tailored briefings, FAQs, and talking points generated via NotebookLM.
            Drafts live as markdown files in <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">apps/comms-blkout/src/fundraising/outputs/</code>.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {(['draft', 'reviewed', 'sent', 'responded', 'archived'] as const).map((s) => (
            <div key={s} className={`rounded p-3 ${STATUS_COLORS[s]}`}>
              <div className="text-2xl font-bold">{stats[s]}</div>
              <div className="text-xs uppercase tracking-wide">{s}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search partner, org, or path…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border-0 focus:ring-0 text-sm bg-transparent outline-none"
            />
          </div>
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1 text-sm"
          >
            <option value="all">All audiences</option>
            {Object.entries(AUDIENCE_NAMES).map(([k, name]) => (
              <option key={k} value={k}>
                {k} — {name}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1 text-sm"
          >
            <option value="all">All types</option>
            {typesPresent.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="reviewed">Reviewed</option>
            <option value="sent">Sent</option>
            <option value="responded">Responded</option>
            <option value="archived">Archived</option>
          </select>
          <div className="text-xs text-slate-500">
            <Filter className="w-3 h-3 inline mr-1" />
            {filtered.length} of {drafts.length}
          </div>
        </div>

        {/* Loading / error */}
        {isLoading && <div className="text-slate-500">Loading drafts from Supabase…</div>}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            {error}. If you've just run the migration, also run <code>fundraising sync</code> from the
            fundraising CLI to populate this table.
          </div>
        )}

        {/* Drafts list */}
        <div className="space-y-2">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {d.audience_profile}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {d.output_type}
                    </span>
                    {d.partner_name && (
                      <span className="text-sm text-slate-700">· {d.partner_name}</span>
                    )}
                    {d.org_name && d.org_name !== d.partner_name && (
                      <span className="text-xs text-slate-500">(CRM: {d.org_name})</span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[d.status]}`}
                    >
                      {d.status}
                    </span>
                    <DriftBadge summary={d.drift_summary} />
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">{d.file_path}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {d.word_count ?? '?'} words · {d.references_count ?? '?'} refs
                    {d.generated_at && (
                      <>
                        {' '}· generated {d.generated_at.slice(0, 10)}
                      </>
                    )}
                    {d.sent_at && (
                      <>
                        {' '}· sent {d.sent_at.slice(0, 10)}
                        {d.sent_to && ` to ${d.sent_to}`}
                      </>
                    )}
                  </div>
                  {d.notes && (
                    <div className="text-xs text-slate-600 mt-1 italic">{d.notes}</div>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No drafts match the current filters.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Fundraising;
