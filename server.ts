/**
 * Express server for Coolify deployment
 * Serves both the static Vite frontend and the API routes
 * (replaces Vercel serverless functions)
 */

import express from 'express';
import { join } from 'path';
import { GUARDED_PATHS, requireSessionMiddleware } from './api/_auth.js';

const APP_ROOT = process.cwd();  // /app in Docker (WORKDIR)
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(express.json({ limit: '10mb' }));

// Session guard — must sit above every route it protects. GUARDED_PATHS (api/_auth.ts)
// is prefix-matched, so '/api/admin' covers /api/admin/*. Health, the OAuth callbacks
// and provider webhooks are deliberately outside it; the reasons are listed there.
app.use(GUARDED_PATHS, requireSessionMiddleware);

// API Routes - must come before static file serving
app.all('/api/admin/dashboard', async (req, res) => {
  try {
    const handler = await import('./api/admin/dashboard.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/admin/finance', async (req, res) => {
  try {
    const handler = await import('./api/admin/finance.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Admin finance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// The content register. Three shapes on two paths, all behind the same '/api/admin'
// guard: GET the window, POST a status change, POST a new row (an approved agent draft,
// or the new-item form's Sonnet draft). One handler, registered on both paths, because
// express does not prefix-match a route the way the guard does.
app.all('/api/admin/content', async (req, res) => {
  try {
    const handler = await import('./api/admin/content.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Admin content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// The new-item form's "Draft with Sonnet". Registered before the :id/status route because
// 'draft' is not a uuid and must not be read as one.
app.all('/api/admin/content/draft', async (req, res) => {
  try {
    const handler = await import('./api/admin/content-draft.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Admin content draft error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/admin/content/:id/status', async (req, res) => {
  try {
    const handler = await import('./api/admin/content.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Admin content status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/herald/generate', async (req, res) => {
  try {
    const handler = await import('./api/herald/generate.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Herald API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' });
  }
});

app.all('/api/social-diary/research', async (req, res) => {
  try {
    const handler = await import('./api/social-diary/research.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Social diary research error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/social-diary/publish', async (req, res) => {
  try {
    const handler = await import('./api/social-diary/publish.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Social diary publish error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Meta (Facebook/Instagram) OAuth
app.all('/api/auth/meta/connect', async (req, res) => {
  try {
    const handler = await import('./api/auth/meta/connect.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Meta connect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/auth/meta/status', async (req, res) => {
  try {
    const handler = await import('./api/auth/meta/status.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Meta status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/auth/meta/callback', async (req, res) => {
  try {
    const handler = await import('./api/auth/meta/callback.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Meta callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/auth/connect', async (req, res) => {
  try {
    const handler = await import('./api/auth/connect.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Auth connect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.all('/api/auth/callback', async (req, res) => {
  try {
    const handler = await import('./api/auth/callback.js');
    await handler.default(req as any, res as any);
  } catch (error) {
    console.error('[Server] Auth callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health: says WHO answered, on which Node, and whether the database is reachable.
// A 200 from the SPA fallback proves nothing, so this route sits above it and the
// client checks `service` before believing the status.
app.get('/api/health', async (_req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let db = 'FAILED: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set';
  if (supabaseUrl && serviceKey) {
    try {
      // Probes newsletter_editions. Until 10 September 2026 it probed the agent-config
      // table, which was dropped as an orphan (crm migration 020_drop_orphan_tables.sql);
      // a 404 there would have read as "database unreachable" on every health check.
      const r = await fetch(`${supabaseUrl}/rest/v1/newsletter_editions?select=id&limit=1`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        signal: AbortSignal.timeout(5000),
      });
      db = r.ok ? 'ok' : `FAILED: HTTP ${r.status}`;
    } catch (error) {
      db = `FAILED: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  const ok = db === 'ok';
  res.status(ok ? 200 : 503).json({
    service: 'comms-blkout',
    status: ok ? 'ok' : 'degraded',
    node: process.version,
    commit: process.env.SOURCE_COMMIT || null,
    db,
    time: new Date().toISOString(),
  });
});

// Static file serving (Vite build output)
app.use(express.static(join(APP_ROOT, 'dist'), {
  maxAge: '1d',
  etag: true,
}));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(join(APP_ROOT, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] BLKOUT Comms running on port ${PORT}`);
  console.log(`[Server] API: /api/herald/generate`);
  console.log(`[Server] Admin: /api/admin/dashboard, /api/admin/finance, /api/admin/content (session required)`);
  console.log(`[Server] Guarded: ${GUARDED_PATHS.join(' ')}`);
  console.log(`[Server] Health: /api/health`);
  console.log(`[Server] Static: /dist`);
  console.log(`[Server] OpenRouter: ${process.env.OPENROUTER_API_KEY ? 'configured' : 'NOT configured'}`);
  console.log(`[Server] Supabase: ${process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL ? 'configured' : 'NOT configured'}`);
});
