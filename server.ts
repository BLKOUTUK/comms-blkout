/**
 * Express server for Coolify deployment
 * Serves both the static Vite frontend and the API routes
 * (replaces Vercel serverless functions)
 */

import express from 'express';
import { join } from 'path';

const APP_ROOT = process.cwd();  // /app in Docker (WORKDIR)
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(express.json({ limit: '10mb' }));

// API Routes - must come before static file serving
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
  console.log(`[Server] Static: /dist`);
  console.log(`[Server] OpenRouter: ${process.env.OPENROUTER_API_KEY ? 'configured' : 'NOT configured'}`);
  console.log(`[Server] Supabase: ${process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL ? 'configured' : 'NOT configured'}`);
});
