// Server-side session guard for comms-blkout's /api/* routes.
//
// Until today every route here except /api/health answered unauthenticated: anyone who
// knew the URL could run the herald generator or the social-diary publisher. This is the
// same check events-calendar uses on its moderation routes
// (../events-calendar/api/pending-openings.ts): a Supabase session JWT arrives as
// `Authorization: Bearer <token>` and is verified against `${SUPABASE_URL}/auth/v1/user`
// with the ANON key as apikey. Only Supabase can say whether a token is real, so the
// check is a live call, not a local decode.
//
// It never falls open. If SUPABASE_URL or the anon key is missing the server cannot
// verify anything, so it answers 500 — a misconfigured deploy must not read as "allowed".
import type { Request, Response, NextFunction } from 'express';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export interface SessionUser {
  id: string;
  email: string;
}

/** Paths behind the guard. Prefix-matched by express, so '/api/admin' covers /api/admin/*. */
export const GUARDED_PATHS = [
  '/api/admin',
  '/api/herald/generate',
  '/api/social-diary/research',
  '/api/social-diary/publish',
  '/api/auth/connect',
  '/api/auth/meta/connect',
  '/api/auth/meta/status',
];

// Deliberately NOT guarded, and why:
//   /api/health                — the liveness probe Coolify and the sidebar dot read
//   /api/auth/callback         — the OAuth provider redirects the browser here with no session
//   /api/auth/meta/callback    — same
//   /api/webhooks/*            — provider-initiated; they carry their own signature, not a session

async function verifyToken(authHeader: string | undefined): Promise<SessionUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const user = await response.json();
    if (!user || !user.id) return null;
    return { id: user.id, email: user.email || user.id };
  } catch (error) {
    console.error('[auth] Token verification error:', error);
    return null;
  }
}

/**
 * Verify the caller's session. Returns the user, or answers 401 and returns null —
 * callers must stop when they get null.
 */
export async function requireSession(req: Request, res: Response): Promise<SessionUser | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[auth] SUPABASE_URL or SUPABASE_ANON_KEY missing — cannot verify sessions');
    res.status(500).json({ error: 'Server misconfigured: sessions cannot be verified' });
    return null;
  }

  const user = await verifyToken(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: 'Sign in required' });
    return null;
  }
  return user;
}

/** Express middleware form of requireSession, for the path list above. */
export async function requireSessionMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const user = await requireSession(req, res);
  if (!user) return; // requireSession has already answered
  (req as Request & { user?: SessionUser }).user = user;
  next();
}
