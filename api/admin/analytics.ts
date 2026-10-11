// GET /api/admin/analytics — the one read behind /admin/analytics.
//
// Reach (Plausible, per site), followers, members, the Hub, the newsletter and first gestures,
// as stored month by month in metrics.snapshots by the monthly collector (1st, 06:00 UTC) and
// the ingest routines. The metrics schema is not exposed over PostgREST and metrics.* has no
// grant to any API role, so this route calls public.admin_analytics_snapshot() (migration 025,
// service_role-only, SECURITY DEFINER) with the service role, which never leaves the server.
//
// The session guard is applied in server.ts (api/_auth.ts, GUARDED_PATHS): '/api/admin'
// is prefix-matched, so an unauthenticated GET is answered 401 before this handler runs.
//
// On any upstream failure this returns 502 with the status and the error text. It never
// returns a partial or defaulted body: a figure the page did not fetch is not a figure.
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
    console.error('[admin/analytics] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    return res.status(500).json({ error: 'Server misconfigured: analytics source unavailable' });
  }

  try {
    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_analytics_snapshot`, {
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
      console.error('[admin/analytics] Upstream error:', upstream.status, text.slice(0, 500));
      return res.status(502).json({
        error: text.slice(0, 500) || 'Analytics snapshot failed',
        upstream_status: upstream.status,
      });
    }

    let snapshot: unknown;
    try {
      snapshot = JSON.parse(text);
    } catch {
      console.error('[admin/analytics] Upstream returned non-JSON:', text.slice(0, 200));
      return res.status(502).json({
        error: 'Analytics snapshot was not JSON',
        upstream_status: upstream.status,
      });
    }

    return res.status(200).json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[admin/analytics] Error:', message);
    return res.status(502).json({ error: message, upstream_status: null });
  }
}
