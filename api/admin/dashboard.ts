// GET /api/admin/dashboard — the one read behind the /admin front page.
//
// public.open_loops and every metrics.* view have no grant to any API role, and the
// metrics schema is not exposed over PostgREST, so the browser cannot reach them at all.
// This route calls public.admin_dashboard_snapshot() (migration 016, service_role-only,
// SECURITY DEFINER) with the service role, which never leaves the server.
//
// The session guard is applied in server.ts (api/_auth.ts, GUARDED_PATHS): an
// unauthenticated GET is answered 401 before this handler runs.
//
// On any upstream failure this returns 502 with the status and the error text. It never
// returns a partial or defaulted body — a tile with no number must say "unavailable",
// and it can only do that if the route refuses to invent one.
//
// It also carries the society's private identifiers (UTR, insurance). Those are Coolify
// runtime vars, read from process.env per request below — never imported into the client,
// which is why they cannot live in src/lib/orgIdentity.ts: that file is compiled into the
// public bundle. This route is the only path they take to the page, and it is guarded.
import type { Request, Response } from 'express';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** An env string, or null when unset or empty. Never a placeholder — an absent value must
 *  render as "not recorded", and it can only do that if this returns null. */
function envValue(raw: string | undefined): string | null {
  const trimmed = (raw || '').trim();
  return trimmed ? trimmed : null;
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[admin/dashboard] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    return res.status(500).json({ error: 'Server misconfigured: dashboard source unavailable' });
  }

  try {
    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/rpc/admin_dashboard_snapshot`, {
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
      console.error('[admin/dashboard] Upstream error:', upstream.status, text.slice(0, 500));
      return res.status(502).json({
        error: text.slice(0, 500) || 'Dashboard snapshot failed',
        upstream_status: upstream.status,
      });
    }

    let snapshot: unknown;
    try {
      snapshot = JSON.parse(text);
    } catch {
      console.error('[admin/dashboard] Upstream returned non-JSON:', text.slice(0, 200));
      return res.status(502).json({
        error: 'Dashboard snapshot was not JSON',
        upstream_status: upstream.status,
      });
    }

    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      // Nothing to attach identifiers to. Pass it through as before rather than invent a shape.
      return res.status(200).json(snapshot);
    }

    // Read per request, not at module load: these are Coolify runtime vars, and a module
    // constant would freeze whatever was set when the process booted.
    const identifiers = {
      utr: envValue(process.env.ORG_UTR),
      tax_office: envValue(process.env.ORG_TAX_OFFICE),
      insurer: envValue(process.env.ORG_INSURER),
      insurance_policy_number: envValue(process.env.ORG_INSURANCE_POLICY_NUMBER),
      insurance_period: envValue(process.env.ORG_INSURANCE_PERIOD),
      insurance_cover: envValue(process.env.ORG_INSURANCE_COVER),
    };

    return res.status(200).json({ ...(snapshot as Record<string, unknown>), identifiers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[admin/dashboard] Error:', message);
    return res.status(502).json({ error: message, upstream_status: null });
  }
}
