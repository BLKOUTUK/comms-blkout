
import { Layout } from '@/components/layout/Layout';
import { Database } from 'lucide-react';

// Until 3 Sep 2026 this page rendered mock values, hardcoded "↑ 5.2%" deltas and a
// literal bar chart. The real numbers live in the metrics.* views in Supabase, which
// a browser client cannot reach (schema not exposed); they will arrive through a
// server-side metrics route. Until then this page says so rather than inventing.
const VIEWS = [
  'metrics.first_gestures_summary',
  'metrics.memberships_by_tier',
  'metrics.event_interest_by_event',
  'metrics.grant_pipeline_live',
];

export function Analytics() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Not connected yet</p>
        </div>

        <div className="card max-w-2xl">
          <div className="flex gap-4">
            <Database className="w-6 h-6 text-blkout-600 shrink-0 mt-1" />
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                There are no live numbers on this page. The figures that exist are in the
                <code className="mx-1 px-1 bg-gray-100 rounded">metrics.*</code>
                views in Supabase, which this browser client can't read. Query them
                directly for now:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
                {VIEWS.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <p>
                A server-side metrics route is planned; when it lands this page reads from it.
                The dashboard already shows live event and moderation counts from ivor-core.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
