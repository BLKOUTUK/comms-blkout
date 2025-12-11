import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const envCheck = {
    TAVILY_API_KEY: process.env.TAVILY_API_KEY ? `Set (${process.env.TAVILY_API_KEY.substring(0, 10)}...)` : 'NOT SET',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? `Set (${process.env.OPENROUTER_API_KEY.substring(0, 15)}...)` : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'NOT SET',
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET'
  };

  return res.status(200).json({
    message: 'Environment check',
    env: envCheck,
    timestamp: new Date().toISOString()
  });
}
