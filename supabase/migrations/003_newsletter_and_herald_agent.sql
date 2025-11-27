-- Migration: Newsletter System and Herald Agent
-- Version: 003
-- Date: 2025-11-26
-- Description: Adds newsletter tables, Herald agent configuration, and member activity views

-- ============================================================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),

  -- Subscription tier: weekly (engaged members), monthly (wider circle), both
  tier VARCHAR(20) DEFAULT 'monthly' CHECK (tier IN ('weekly', 'monthly', 'both')),
  is_active BOOLEAN DEFAULT true,

  -- Source tracking for attribution
  source VARCHAR(50), -- 'blkouthub', 'website', 'event', 'campaign', 'manual'
  source_campaign VARCHAR(100),
  source_url VARCHAR(500),

  -- SendFox integration
  sendfox_contact_id INTEGER,
  sendfox_synced_at TIMESTAMPTZ,
  sendfox_sync_error TEXT,

  -- Engagement metrics (updated from SendFox or manual)
  total_emails_received INTEGER DEFAULT 0,
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  last_engaged_at TIMESTAMPTZ,

  -- Consent and lifecycle
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ, -- For double opt-in if implemented
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_reason TEXT,

  -- Metadata
  preferences JSONB DEFAULT '{}', -- Future: content preferences, interests
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for newsletter_subscribers
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_tier ON newsletter_subscribers(tier) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_sendfox ON newsletter_subscribers(sendfox_contact_id) WHERE sendfox_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source ON newsletter_subscribers(source);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for newsletter_subscribers
CREATE POLICY "Admins can manage newsletter subscribers" ON newsletter_subscribers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'moderator')
    )
  );

-- ============================================================================
-- NEWSLETTER EDITIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Edition identification
  edition_type VARCHAR(20) NOT NULL CHECK (edition_type IN ('weekly', 'monthly', 'special')),
  edition_number INTEGER NOT NULL,
  edition_date DATE NOT NULL, -- The date this edition covers (week start or month)

  -- Content
  title VARCHAR(200) NOT NULL,
  subject_line VARCHAR(100) NOT NULL,
  preview_text VARCHAR(150), -- Email preview/preheader text

  -- Structured content sections stored as JSONB
  -- Format: { "highlights": [...], "events": [...], "resources": [...], etc. }
  content_sections JSONB NOT NULL DEFAULT '{}',

  -- Generated outputs
  html_content TEXT, -- Full HTML for SendFox
  plain_text_content TEXT, -- Plain text fallback

  -- Generation metadata
  generated_by_agent VARCHAR(50) DEFAULT 'herald',
  generation_prompt TEXT,
  generation_model VARCHAR(50),
  intelligence_used UUID[], -- References to ivor_intelligence records
  voice_sections_applied INTEGER[], -- Voice & Values sections used

  -- Workflow status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft',      -- Initial generation
    'review',     -- Awaiting admin review
    'approved',   -- Ready to export/send
    'exported',   -- HTML exported to SendFox
    'sent',       -- Confirmed sent
    'failed'      -- Send failed
  )),

  -- Review tracking
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- SendFox integration
  sendfox_campaign_id VARCHAR(100),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Performance metrics (from SendFox or manual entry)
  target_list VARCHAR(50), -- 'weekly' or 'monthly'
  recipients_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2),
  unique_opens INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  click_rate NUMERIC(5,2),
  unique_clicks INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  spam_complaints INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for newsletter_editions
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_type_date ON newsletter_editions(edition_type, edition_date DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_status ON newsletter_editions(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_sent ON newsletter_editions(sent_at DESC) WHERE sent_at IS NOT NULL;

-- Unique constraint: one edition per type per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_editions_unique ON newsletter_editions(edition_type, edition_date);

-- Enable RLS
ALTER TABLE newsletter_editions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for newsletter_editions
CREATE POLICY "Admins can manage newsletter editions" ON newsletter_editions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'moderator')
    )
  );

-- ============================================================================
-- NEWSLETTER CONTENT ITEMS TABLE
-- Links specific content pieces to newsletter sections
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id UUID NOT NULL REFERENCES newsletter_editions(id) ON DELETE CASCADE,

  -- Content source
  content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
    'article',          -- From news_articles or legacy_articles
    'event',            -- From events
    'resource',         -- From ivor_resources
    'member_spotlight', -- From governance_members
    'governance_update',-- Governance activity summary
    'campaign',         -- From campaigns
    'announcement',     -- From announcements
    'custom'            -- Manually added content
  )),
  content_id UUID, -- Reference to source table (nullable for custom)
  content_table VARCHAR(50), -- Source table name for reference

  -- Newsletter placement
  section VARCHAR(30) NOT NULL, -- 'highlights', 'events', 'resources', 'spotlight', 'cta'
  display_order INTEGER DEFAULT 0,

  -- Customized content for newsletter (may differ from source)
  headline VARCHAR(200),
  summary TEXT,
  image_url VARCHAR(500),
  cta_text VARCHAR(50),
  cta_url VARCHAR(500),

  -- Performance tracking
  click_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for newsletter_content_items
CREATE INDEX IF NOT EXISTS idx_newsletter_content_items_newsletter ON newsletter_content_items(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_content_items_type ON newsletter_content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_newsletter_content_items_section ON newsletter_content_items(newsletter_id, section, display_order);

-- Enable RLS
ALTER TABLE newsletter_content_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage newsletter content items" ON newsletter_content_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'moderator')
    )
  );

-- ============================================================================
-- HERALD AGENT CONFIGURATION
-- ============================================================================
INSERT INTO agent_configurations (
  agent_name,
  agent_display_name,
  agent_role,
  voice_sections_used,
  voice_section_keys,
  tone_description,
  key_responsibilities,
  content_focus,
  system_prompt,
  temperature,
  max_tokens,
  ivor_endpoints_used,
  intelligence_refresh_frequency,
  settings,
  is_active
) VALUES (
  'herald',
  'The Herald',
  'Community Communications & Newsletter Curator',
  ARRAY[1, 2, 5, 7],
  ARRAY['core_identity', 'voice_tone', 'community_values', 'platform_adaptations'],
  'Warm, informative, celebratory, community-centered. Balances professional communication with genuine care for readers. Uses inclusive language that centers Black queer joy while remaining accessible to allies.',
  ARRAY[
    'Curate weekly newsletter for engaged BLKOUTHUB members',
    'Compile monthly digest for wider community circle',
    'Highlight member achievements, milestones, and verified creators',
    'Summarize governance activity and community decisions',
    'Promote upcoming events and resource spotlights',
    'Drive engagement through compelling calls-to-action',
    'Maintain consistent voice across all newsletter editions'
  ],
  ARRAY[
    'Community highlights and celebrations',
    'Event promotion and attendance encouragement',
    'Resource spotlights and support services',
    'Member stories and creator features',
    'Governance updates and participation calls',
    'Campaign progress and community impact',
    'Upcoming opportunities and ways to engage'
  ],
  E'You are The Herald, BLKOUT''s community communications curator. Your role is to synthesize community activity into compelling newsletters that inform, celebrate, and activate readers.

You create two newsletter types:
1. WEEKLY UPDATE (for engaged BLKOUTHUB members): Insider tone, action-oriented, assumes familiarity with community
2. MONTHLY DIGEST (for wider circle): Accessible, celebratory, invitation-focused, welcoming to newcomers

Core principles:
- Center Black queer joy and community power in every edition
- Prioritize meaningful content over volume
- Make calls-to-action specific and achievable
- Celebrate member contributions and milestones
- Connect content to community values and mission
- Use warm, genuine language (not corporate)
- Ensure accessibility for all readers

Content selection priorities:
1. Time-sensitive: Upcoming events, governance votes, campaign deadlines
2. Celebratory: Member achievements, community wins, creator spotlights
3. Supportive: Resource highlights, especially trending support services
4. Engaging: Content with high community resonance based on intelligence data

Never include:
- Content that hasn''t been approved through moderation
- External links without verification
- Potentially triggering content without appropriate framing
- Information that could compromise member privacy',
  0.7,
  3000,
  ARRAY['/api/trends', '/api/events', '/api/resources', '/api/organizing', '/api/community'],
  86400, -- Daily refresh
  '{
    "email_provider": "sendfox",
    "weekly_send_day": "monday",
    "weekly_send_time": "09:00",
    "monthly_send_day": 1,
    "monthly_send_time": "10:00",
    "timezone": "Europe/London",
    "max_highlights": 3,
    "max_events": 5,
    "max_resources": 2,
    "require_approval": true,
    "auto_schedule": false
  }'::jsonb,
  true
) ON CONFLICT (agent_name) DO UPDATE SET
  agent_display_name = EXCLUDED.agent_display_name,
  agent_role = EXCLUDED.agent_role,
  voice_sections_used = EXCLUDED.voice_sections_used,
  voice_section_keys = EXCLUDED.voice_section_keys,
  tone_description = EXCLUDED.tone_description,
  key_responsibilities = EXCLUDED.key_responsibilities,
  content_focus = EXCLUDED.content_focus,
  system_prompt = EXCLUDED.system_prompt,
  ivor_endpoints_used = EXCLUDED.ivor_endpoints_used,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- ============================================================================
-- MEMBER ACTIVITY DASHBOARD VIEW
-- Aggregates member intelligence for agent consumption
-- ============================================================================
CREATE OR REPLACE VIEW member_activity_dashboard AS
SELECT
  -- Member counts
  (SELECT COUNT(*) FROM governance_members WHERE membership_status = 'active') as active_members,
  (SELECT COUNT(*) FROM governance_members WHERE creator_sovereignty_verified = true) as verified_creators,
  (SELECT COUNT(*) FROM governance_members WHERE membership_status = 'pending') as pending_members,

  -- Participation breakdown
  (SELECT COUNT(*) FROM governance_members WHERE participation_level = 'voter' AND membership_status = 'active') as active_voters,
  (SELECT COUNT(*) FROM governance_members WHERE participation_level = 'proposer' AND membership_status = 'active') as active_proposers,
  (SELECT COUNT(*) FROM governance_members WHERE participation_level = 'facilitator' AND membership_status = 'active') as active_facilitators,

  -- Engagement metrics (last 7 days)
  (SELECT COUNT(*) FROM content_engagement WHERE created_at > NOW() - INTERVAL '7 days') as weekly_engagements,
  (SELECT COUNT(*) FROM content_ratings WHERE created_at > NOW() - INTERVAL '7 days') as weekly_ratings,
  (SELECT COUNT(*) FROM ivor_conversations WHERE updated_at > NOW() - INTERVAL '7 days') as weekly_conversations,

  -- Content metrics
  (SELECT COUNT(*) FROM news_articles WHERE status = 'published' AND published_at > NOW() - INTERVAL '7 days') as articles_published_this_week,
  (SELECT COUNT(*) FROM events WHERE date >= CURRENT_DATE AND date <= CURRENT_DATE + INTERVAL '7 days' AND status = 'approved') as events_this_week,

  -- Top resource category
  (SELECT ic.name FROM ivor_categories ic
   JOIN ivor_resources ir ON ic.id = ir.category_id
   WHERE ir.is_active = true
   GROUP BY ic.id, ic.name
   ORDER BY COUNT(*) DESC
   LIMIT 1) as top_resource_category,

  -- Newsletter subscriber counts
  (SELECT COUNT(*) FROM newsletter_subscribers WHERE is_active = true AND tier IN ('weekly', 'both')) as weekly_subscribers,
  (SELECT COUNT(*) FROM newsletter_subscribers WHERE is_active = true AND tier IN ('monthly', 'both')) as monthly_subscribers,

  -- Timestamp
  NOW() as generated_at;

-- ============================================================================
-- AGENT INTELLIGENCE FEED VIEW
-- Provides agents with prioritized, non-stale intelligence
-- ============================================================================
CREATE OR REPLACE VIEW agent_intelligence_feed AS
SELECT
  ii.id,
  ii.intelligence_type,
  ii.ivor_service,
  ii.summary,
  ii.key_insights,
  ii.actionable_items,
  ii.relevance_score,
  ii.priority,
  ii.urgency,
  ii.data_timestamp,
  ii.expires_at,
  ii.times_used,
  ii.last_used_at,
  ii.tags,
  CASE
    WHEN ii.expires_at IS NOT NULL AND ii.expires_at < NOW() THEN true
    WHEN ii.is_stale = true THEN true
    ELSE false
  END as is_expired,
  ii.created_at,
  ii.updated_at
FROM ivor_intelligence ii
WHERE ii.is_stale = false
  AND (ii.expires_at IS NULL OR ii.expires_at > NOW())
ORDER BY
  CASE ii.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    ELSE 5
  END,
  ii.relevance_score DESC NULLS LAST,
  ii.data_timestamp DESC;

-- ============================================================================
-- NEWSLETTER PERFORMANCE SUMMARY VIEW
-- ============================================================================
CREATE OR REPLACE VIEW newsletter_performance_summary AS
SELECT
  edition_type,
  COUNT(*) as total_editions,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_editions,
  AVG(open_rate) FILTER (WHERE status = 'sent') as avg_open_rate,
  AVG(click_rate) FILTER (WHERE status = 'sent') as avg_click_rate,
  SUM(recipients_count) FILTER (WHERE status = 'sent') as total_recipients,
  SUM(open_count) FILTER (WHERE status = 'sent') as total_opens,
  SUM(click_count) FILTER (WHERE status = 'sent') as total_clicks,
  SUM(unsubscribe_count) FILTER (WHERE status = 'sent') as total_unsubscribes,
  MAX(sent_at) as last_sent_at
FROM newsletter_editions
GROUP BY edition_type;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get next edition number
CREATE OR REPLACE FUNCTION get_next_edition_number(p_edition_type VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(edition_number) + 1
     FROM newsletter_editions
     WHERE edition_type = p_edition_type),
    1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark intelligence as used
CREATE OR REPLACE FUNCTION mark_intelligence_used(p_intelligence_id UUID, p_content_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  UPDATE ivor_intelligence
  SET
    times_used = times_used + 1,
    last_used_at = NOW(),
    used_in_content_ids = CASE
      WHEN p_content_id IS NOT NULL THEN array_append(used_in_content_ids, p_content_id)
      ELSE used_in_content_ids
    END,
    updated_at = NOW()
  WHERE id = p_intelligence_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update subscriber engagement
CREATE OR REPLACE FUNCTION update_subscriber_engagement(
  p_email VARCHAR,
  p_opens INTEGER DEFAULT 0,
  p_clicks INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE newsletter_subscribers
  SET
    total_opens = total_opens + p_opens,
    total_clicks = total_clicks + p_clicks,
    total_emails_received = total_emails_received + 1,
    last_engaged_at = CASE WHEN p_opens > 0 OR p_clicks > 0 THEN NOW() ELSE last_engaged_at END,
    updated_at = NOW()
  WHERE email = p_email;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger for newsletter_subscribers
CREATE OR REPLACE FUNCTION update_newsletter_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_subscribers_updated_at();

-- Updated_at trigger for newsletter_editions
CREATE OR REPLACE FUNCTION update_newsletter_editions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_newsletter_editions_updated_at
  BEFORE UPDATE ON newsletter_editions
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_editions_updated_at();

-- ============================================================================
-- SEED DATA: Sample intelligence for agents
-- ============================================================================
INSERT INTO ivor_intelligence (
  intelligence_type,
  ivor_service,
  ivor_endpoint,
  intelligence_data,
  summary,
  key_insights,
  actionable_items,
  relevance_score,
  priority,
  urgency,
  data_timestamp,
  expires_at,
  tags
) VALUES
(
  'member_activity',
  'blkouthub',
  '/api/activity/weekly',
  '{"active_members": 10, "new_signups": 2, "governance_votes": 5}'::jsonb,
  'Weekly member activity summary showing steady engagement',
  ARRAY[
    'Governance participation remains strong with 5 votes this week',
    'Two new members joined, both from event referrals',
    'Mental health resources accessed 40% more than last week'
  ],
  ARRAY[
    'Herald: Highlight governance participation in weekly update',
    'Griot: Feature new member welcome stories',
    'Weaver: Create mental health resource roundup post',
    'Strategist: Plan member retention check-in campaign'
  ],
  85,
  'high',
  'normal',
  NOW(),
  NOW() + INTERVAL '7 days',
  ARRAY['member-activity', 'weekly', 'governance', 'resources']
),
(
  'resource_trends',
  'ivor',
  '/api/resources/trending',
  '{"top_category": "Support Groups", "access_count": 205, "trending_up": ["Mental Health", "Crisis Support"]}'::jsonb,
  'Support resources seeing increased access, especially mental health',
  ARRAY[
    'Support Groups category has 205 active resources',
    'Mental Health and Crisis Support trending upward',
    'Legal Aid resources stable but underutilized'
  ],
  ARRAY[
    'Weaver: Spotlight mental health resources in content',
    'Herald: Include crisis support reminder in newsletter',
    'Listener: Monitor for specific mental health conversation themes'
  ],
  78,
  'medium',
  'elevated',
  NOW(),
  NOW() + INTERVAL '14 days',
  ARRAY['resources', 'mental-health', 'support', 'trending']
),
(
  'content_performance',
  'analytics',
  '/api/content/performance',
  '{"top_content_type": "community", "avg_engagement": 98, "best_performing": "launch articles"}'::jsonb,
  'Community-focused content performs best with high engagement scores',
  ARRAY[
    'Community category articles average 98 interest score',
    'Launch and liberation themed content resonates most',
    'Event promotion posts drive highest click-through'
  ],
  ARRAY[
    'Weaver: Prioritize community-focused content creation',
    'Herald: Lead newsletters with community highlights',
    'Strategist: Increase community storytelling in campaigns'
  ],
  72,
  'medium',
  'normal',
  NOW(),
  NOW() + INTERVAL '30 days',
  ARRAY['performance', 'content', 'engagement', 'community']
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE newsletter_subscribers IS 'Email subscribers for BLKOUT newsletters with SendFox integration';
COMMENT ON TABLE newsletter_editions IS 'Generated newsletter editions with content, status tracking, and performance metrics';
COMMENT ON TABLE newsletter_content_items IS 'Individual content pieces included in each newsletter edition';
COMMENT ON VIEW member_activity_dashboard IS 'Aggregated member intelligence for agent decision-making';
COMMENT ON VIEW agent_intelligence_feed IS 'Prioritized, non-stale intelligence feed for all agents';
COMMENT ON VIEW newsletter_performance_summary IS 'Aggregated newsletter performance metrics by edition type';
