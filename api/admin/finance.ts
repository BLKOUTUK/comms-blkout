// GET /api/admin/finance — the one read behind /admin/finance, "the books".
//
// Finance is one system, not two. The ledger is the bookkeeping pipeline in
// ~/blkout/projects/financial-management/ (bank CSVs → accounts-map.json →
// build-finance.mjs → finance.json), written monthly through Mission Control's statement
// upload; build-finance.mjs publishes nine `finance.*` measures into metrics.snapshots.
// The metrics schema is not exposed over PostgREST and metrics.* has no grant to any API
// role, so the browser cannot reach those rows at all. This route calls
// public.admin_finance_snapshot() (migration 017, service_role-only, SECURITY DEFINER)
// with the service role, which never leaves the server.
//
// The session guard is applied in server.ts (api/_auth.ts, GUARDED_PATHS): '/api/admin'
// is prefix-matched, so an unauthenticated GET is answered 401 before this handler runs.
//
// On any upstream failure this returns 502 with the status and the error text. It never
// returns a partial or defaulted body — a page with no position must say so, and it can
// only do that if the route refuses to invent one. In particular `books` may be JSON
// null (nothing has ever been published) and that null is passed through untouched.
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[admin/finance] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    return res.status(500).json({ error: 'Server misconfigured: finance source unavailable' });
  }

  try {
    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_finance_snapshot`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(15000),
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      console.error('[admin/finance] Upstream error:', upstream.status, text.slice(0, 500));
      return res.status(502).json({
        error: text.slice(0, 500) || 'Finance snapshot failed',
        upstream_status: upstream.status,
      });
    }

    let snapshot: unknown;
    try {
      snapshot = JSON.parse(text);
    } catch {
      console.error('[admin/finance] Upstream returned non-JSON:', text.slice(0, 200));
      return res.status(502).json({
        error: 'Finance snapshot was not JSON',
        upstream_status: upstream.status,
      });
    }

    return res.status(200).json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[admin/finance] Error:', message);
    return res.status(502).json({ error: message, upstream_status: null });
  }
}
