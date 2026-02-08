-- Platform Tokens Table
-- Stores OAuth access tokens for social media platforms (Facebook, Instagram, LinkedIn, etc.)
-- Used by the publish queue in /api/social-diary/publish.ts

CREATE TABLE IF NOT EXISTS platform_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL UNIQUE,  -- 'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'
  account_id text NOT NULL,       -- Platform-specific account/page ID
  account_name text,              -- Human-readable name (page name, username)
  access_token text NOT NULL,     -- OAuth access token (encrypted at rest by Supabase)
  refresh_token text,             -- For platforms that support token refresh
  expires_at timestamptz,         -- When the token expires
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: Only service role can access tokens (not exposed to frontend)
ALTER TABLE platform_tokens ENABLE ROW LEVEL SECURITY;

-- No public policies — tokens are only accessed server-side via service role key
COMMENT ON TABLE platform_tokens IS 'OAuth tokens for social media publishing. Access via service role only.';
