// /api/admin/content — the one read and the two writes behind /admin/calendar ("Content").
//
// The register is public.content_calendar. It has no grant path a browser can use safely:
// RLS gates it on is_editor_or_admin() and the whole point of migration 018 is that the
// vocabulary and the status_log are enforced in one place, not re-implemented in every
// caller. So all three operations run SECURITY DEFINER, service_role-only, from this
// server, and the service key never leaves it.
//
//   GET  /api/admin/content?from=YYYY-MM-DD&to=YYYY-MM-DD  → admin_content_list
//   POST /api/admin/content/:id/status  {status}           → admin_content_set_status
//   POST /api/admin/content             {title, …}         → admin_content_insert
//
// The session guard is applied in server.ts (api/_auth.ts, GUARDED_PATHS): '/api/admin' is
// prefix-matched, so an unauthenticated request is answered 401 before this handler runs.
// The guard also attaches req.user, which is who the status_log records as the actor —
// a status change with no name against it is a change nobody can be asked about.
//
// On any upstream failure this returns 502 with the status and the error text. It never
// returns a partial or defaulted body: a calendar that cannot reach the register must say
// so, and it can only say so if the route refuses to answer with an empty list.
import type { Request, Response } from 'express';
import type { SessionUser } from '../_auth.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const STATUSES = ['draft', 'ready', 'scheduled', 'posted', 'skipped'];

/** Monday of the week containing `d`, in UTC. The register's week starts where the diary does. */
function mondayOf(d: Date): string {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const shift = (copy.getUTCDay() + 6) % 7;          // Sun=0 → 6, Mon=1 → 0
  copy.setUTCDate(copy.getUTCDate() - shift);
  return copy.toISOString().slice(0, 10);
}

function plusDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Call a service-role RPC. Returns the parsed body, or throws with the upstream detail. */
async function rpc(fn: string, args: Record<string, unknown>): Promise<unknown> {
  const upstream = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(15000),
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    const err = new Error(text.slice(0, 500) || `${fn} failed`) as Error & { upstreamStatus?: number };
    err.upstreamStatus = upstream.status;
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error(`${fn} did not return JSON`) as Error & { upstreamStatus?: number };
    err.upstreamStatus = upstream.status;
    throw err;
  }
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[admin/content] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    return res.status(500).json({ error: 'Server misconfigured: the register is unreachable' });
  }

  const actor = (req as Request & { user?: SessionUser }).user?.email || 'admin';

  try {
    // ── the read ───────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const today = new Date();
      const from = isDate(req.query.from) ? req.query.from : mondayOf(today);
      const to = isDate(req.query.to) ? req.query.to : plusDays(from, 35);
      if (to < from) return res.status(400).json({ error: '`to` is before `from`' });

      const snapshot = await rpc('admin_content_list', { p_from: from, p_to: to });
      return res.status(200).json(snapshot);
    }

    if (req.method === 'POST') {
      // ── the status write: /api/admin/content/:id/status ───────────────────────────
      const statusMatch = req.path.match(/\/([0-9a-fA-F-]{36})\/status\/?$/);
      if (statusMatch) {
        const status = (req.body || {}).status;
        if (typeof status !== 'string' || !STATUSES.includes(status)) {
          return res.status(400).json({ error: `status must be one of ${STATUSES.join(', ')}` });
        }
        const row = await rpc('admin_content_set_status', {
          p_id: statusMatch[1], p_status: status, p_actor: actor,
        });
        return res.status(200).json(row);
      }

      // ── the insert: an approved agent draft becoming a register row ───────────────
      const body = (req.body || {}) as Record<string, unknown>;
      if (typeof body.title !== 'string' || !body.title.trim()) {
        return res.status(400).json({ error: 'title is required' });
      }
      const metadata = (body.metadata && typeof body.metadata === 'object' ? body.metadata : {}) as Record<string, unknown>;
      const result = await rpc('admin_content_insert', {
        p_row: {
          title: body.title,
          content_type: body.content_type,
          status: body.status,
          scheduled_for: body.scheduled_for,
          primary_content: body.primary_content,
          hashtags: body.hashtags,
          media_urls: body.media_urls,
          generated_by_agent: body.generated_by_agent,
          generation_prompt: body.generation_prompt,
          internal_notes: body.internal_notes,
          priority: body.priority,
          metadata,
        },
      });
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const upstreamStatus = (error as { upstreamStatus?: number }).upstreamStatus ?? null;
    console.error('[admin/content] Error:', upstreamStatus, message.slice(0, 500));
    return res.status(502).json({ error: message.slice(0, 500), upstream_status: upstreamStatus });
  }
}
