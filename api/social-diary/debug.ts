import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const envCheck = {
    TAVILY_API_KEY: process.env.TAVILY_API_KEY ? `Set (${process.env.TAVILY_API_KEY.substring(0, 10)}...)` : 'NOT SET',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? `Set (${process.env.OPENROUTER_API_KEY.substring(0, 15)}...)` : 'NOT SET',
    APIFY_API_KEY: process.env.APIFY_API_KEY ? `Set (${process.env.APIFY_API_KEY.substring(0, 15)}...)` : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_KEY ? `Set (length: ${SUPABASE_SERVICE_KEY.length})` : 'NOT SET',
    SUPABASE_URL: SUPABASE_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET'
  };

  // Test Supabase insert if requested
  let insertTest = null;
  if (req.query.testInsert === 'true' && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const testHash = `debug_test_${Date.now()}`;

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: 'Debug Test Event',
          description: 'Test from debug endpoint',
          date: '2025-12-31',
          location: 'Test Location',
          organizer: 'Debug Test',
          url: `https://debug.test/${testHash}`,
          url_hash: testHash,
          cost: 'Free',
          tags: ['debug', 'test'],
          source: 'debug_test',
          source_platform: 'debug',
          relevance_score: 50,
          status: 'pending',
          discovery_method: 'debug_test'
        }])
        .select();

      if (error) {
        insertTest = {
          success: false,
          error: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        };
      } else {
        // Clean up test data
        if (data && data.length > 0) {
          await supabase.from('events').delete().eq('id', data[0].id);
        }
        insertTest = {
          success: true,
          message: 'Insert test passed and cleaned up',
          insertedId: data?.[0]?.id
        };
      }
    } catch (err) {
      insertTest = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  return res.status(200).json({
    message: 'Environment check',
    env: envCheck,
    insertTest,
    hint: 'Add ?testInsert=true to test Supabase insert',
    timestamp: new Date().toISOString()
  });
}
