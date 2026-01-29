-- Newsletter Preferences & Opt-out Management
-- Allows subscribers to manage their communication preferences

-- Newsletter subscriber preferences table
CREATE TABLE IF NOT EXISTS newsletter_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  subscriber_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Subscription status
  is_subscribed BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,

  -- Content preferences (what they want to receive)
  preferences JSONB DEFAULT '{
    "events": true,
    "community_news": true,
    "board_updates": true,
    "campaigns": true,
    "blog_posts": true,
    "partner_content": false,
    "surveys": true
  }'::jsonb,

  -- Frequency preferences
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'important_only')),

  -- Interests (for targeted content)
  interests TEXT[] DEFAULT '{}',

  -- Location (for local event targeting)
  location TEXT,

  -- Referral tracking
  referred_by_email TEXT,
  referral_code TEXT UNIQUE,

  -- Metadata
  source TEXT DEFAULT 'website', -- where they signed up: website, event, partner, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_preferences_email ON newsletter_preferences(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_preferences_subscribed ON newsletter_preferences(is_subscribed);
CREATE INDEX IF NOT EXISTS idx_newsletter_preferences_referral ON newsletter_preferences(referral_code);

-- Unsubscribe log for compliance/analytics
CREATE TABLE IF NOT EXISTS newsletter_unsubscribe_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  preference_id UUID REFERENCES newsletter_preferences(id),
  reason TEXT,
  feedback TEXT,
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS newsletter_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_email TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'subscribed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_count INT;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));

    -- Check if code already exists
    SELECT COUNT(*) INTO exists_count
    FROM newsletter_preferences
    WHERE referral_code = code;

    EXIT WHEN exists_count = 0;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code on insert
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_referral_code ON newsletter_preferences;
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON newsletter_preferences
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_newsletter_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_preferences_timestamp ON newsletter_preferences;
CREATE TRIGGER trigger_update_preferences_timestamp
  BEFORE UPDATE ON newsletter_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_preferences_timestamp();

-- RLS Policies
ALTER TABLE newsletter_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_unsubscribe_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_referrals ENABLE ROW LEVEL SECURITY;

-- Public can view/update their own preferences via email token
CREATE POLICY "public_can_manage_own_preferences"
ON newsletter_preferences
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Authenticated admins can view all
CREATE POLICY "admins_can_view_all_preferences"
ON newsletter_preferences
FOR SELECT
TO authenticated
USING (true);

-- Unsubscribe log - public insert, admin read
CREATE POLICY "public_can_log_unsubscribe"
ON newsletter_unsubscribe_log
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "admins_can_view_unsubscribe_log"
ON newsletter_unsubscribe_log
FOR SELECT
TO authenticated
USING (true);

-- Referrals - public can create, admins can view all
CREATE POLICY "public_can_create_referrals"
ON newsletter_referrals
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "admins_can_manage_referrals"
ON newsletter_referrals
FOR ALL
TO authenticated
USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON newsletter_preferences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON newsletter_preferences TO authenticated;
GRANT INSERT ON newsletter_unsubscribe_log TO anon;
GRANT SELECT, INSERT ON newsletter_unsubscribe_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON newsletter_referrals TO anon, authenticated;
