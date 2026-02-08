/**
 * Meta Platform Connection Status
 * Returns which platforms are connected and token expiry info
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const { data, error } = await supabase
    .from('platform_tokens')
    .select('platform, account_name, account_id, expires_at, updated_at')
    .order('platform');

  if (error) {
    // Table might not exist yet
    if (error.code === '42P01') {
      return res.status(200).json({
        connected: false,
        message: 'platform_tokens table does not exist — run the SQL migration first',
        platforms: [],
      });
    }
    return res.status(500).json({ error: error.message });
  }

  const now = new Date();
  const platforms = (data || []).map(t => ({
    platform: t.platform,
    account_name: t.account_name,
    account_id: t.account_id,
    connected: true,
    expired: t.expires_at ? new Date(t.expires_at) < now : false,
    expires_at: t.expires_at,
    updated_at: t.updated_at,
  }));

  return res.status(200).json({
    connected: platforms.length > 0,
    platforms,
  });
}
