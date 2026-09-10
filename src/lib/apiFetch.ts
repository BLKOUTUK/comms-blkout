import { supabase } from '@/lib/supabase';

// Every comms /api/* route except health and the OAuth/webhook callbacks now requires a
// Supabase session bearer (api/_auth.ts). This is the only way the client should call
// them: it attaches the live access token and turns a refused call into one recognisable
// error rather than a JSON parse failure three frames later.
//
// Note it asks Supabase for the session on every call rather than caching a token —
// supabase-js refreshes in the background, and a stale token is a 401 the user cannot
// explain.

export class ApiAuthError extends Error {
  constructor(message = 'Sign in required') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new ApiAuthError();

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);

  const response = await fetch(path, { ...init, headers });
  if (response.status === 401) throw new ApiAuthError();
  return response;
}

/**
 * Open a guarded route's response in a new tab, or save it.
 *
 * `window.open` cannot carry an Authorization header, so a guarded preview/export URL
 * opened that way lands on a 401. Fetch it with the session instead and hand the browser
 * a blob.
 */
export async function openWithSession(
  path: string,
  opts: { download?: string } = {}
): Promise<void> {
  const response = await apiFetch(path);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.slice(0, 300) || `HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  if (opts.download) {
    const a = document.createElement('a');
    a.href = url;
    a.download = opts.download;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.open(url, '_blank');
  }

  // Revoke late: an immediate revoke can beat the new tab's own load.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
