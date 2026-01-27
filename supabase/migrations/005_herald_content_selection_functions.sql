-- Migration: Herald Content Selection Functions
-- Version: 005
-- Date: 2026-01-27
-- Description: SQL functions for Herald agent's content selection queries
-- Phase: 2.1 - Herald Newsletter Agent Configuration

-- ============================================================================
-- CONTENT SELECTION FUNCTIONS FOR HERALD AGENT
-- These functions provide the content selection algorithm specified in the
-- delivery plan for weekly and monthly newsletter generation.
-- ============================================================================

-- ============================================================================
-- 1. GET NEWSLETTER HIGHLIGHTS
-- Source: legacy_articles/news_articles ORDER BY interest_score
-- Weekly: max 3, Monthly: max 5
-- ============================================================================
CREATE OR REPLACE FUNCTION get_newsletter_highlights(
  p_edition_type VARCHAR DEFAULT 'weekly',
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  excerpt TEXT,
  featured_image VARCHAR,
  source_url VARCHAR,
  interest_score INTEGER,
  published_at TIMESTAMPTZ,
  category VARCHAR
) AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Set limit based on edition type
  v_limit := CASE p_edition_type
    WHEN 'weekly' THEN 3
    WHEN 'monthly' THEN 5
    ELSE 3
  END;

  RETURN QUERY
  SELECT
    na.id,
    na.title::VARCHAR,
    na.excerpt::TEXT,
    na.featured_image::VARCHAR,
    na.source_url::VARCHAR,
    COALESCE(na.interest_score, 0)::INTEGER,
    na.published_at,
    na.category::VARCHAR
  FROM news_articles na
  WHERE na.status = 'published'
    AND na.published_at >= NOW() - (p_days_back || ' days')::INTERVAL
  ORDER BY
    na.interest_score DESC NULLS LAST,
    na.published_at DESC
  LIMIT v_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_newsletter_highlights IS 'Returns top articles by interest score for newsletter highlights section';

-- ============================================================================
-- 2. GET UPCOMING EVENTS
-- Source: events WHERE date > NOW() AND date <= NOW() + 14 days
-- Weekly: max 5, Monthly: max 4
-- ============================================================================
CREATE OR REPLACE FUNCTION get_upcoming_events(
  p_edition_type VARCHAR DEFAULT 'weekly',
  p_days_ahead INTEGER DEFAULT 14
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  event_date DATE,
  start_time TIME,
  end_time TIME,
  location VARCHAR,
  event_url VARCHAR,
  image_url VARCHAR,
  relevance_score INTEGER,
  category VARCHAR
) AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Set limit based on edition type
  v_limit := CASE p_edition_type
    WHEN 'weekly' THEN 5
    WHEN 'monthly' THEN 4
    ELSE 5
  END;

  RETURN QUERY
  SELECT
    e.id,
    e.title::VARCHAR,
    e.description::TEXT,
    e.date AS event_date,
    e.start_time,
    e.end_time,
    e.location::VARCHAR,
    e.url::VARCHAR AS event_url,
    e.image_url::VARCHAR,
    COALESCE(e.relevance_score, 50)::INTEGER,
    e.category::VARCHAR
  FROM events e
  WHERE e.status = 'approved'
    AND e.date >= CURRENT_DATE
    AND e.date <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
  ORDER BY
    e.relevance_score DESC NULLS LAST,
    e.date ASC,
    e.start_time ASC NULLS LAST
  LIMIT v_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_upcoming_events IS 'Returns upcoming approved events for newsletter events section';

-- ============================================================================
-- 3. GET COMMUNITY VOICE (Governance Updates)
-- Source: governance_proposals, governance_votes, member achievements
-- Weekly: max 2, Monthly: max 3
-- ============================================================================
CREATE OR REPLACE FUNCTION get_community_voice(
  p_edition_type VARCHAR DEFAULT 'weekly',
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  voice_type VARCHAR,
  title VARCHAR,
  summary TEXT,
  participant_count INTEGER,
  created_at TIMESTAMPTZ,
  status VARCHAR,
  url VARCHAR
) AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Set limit based on edition type
  v_limit := CASE p_edition_type
    WHEN 'weekly' THEN 2
    WHEN 'monthly' THEN 3
    ELSE 2
  END;

  -- Return governance proposals and activities
  RETURN QUERY
  WITH governance_activity AS (
    -- Active or recently completed proposals
    SELECT
      gp.id,
      'proposal'::VARCHAR AS voice_type,
      gp.title::VARCHAR,
      gp.description::TEXT AS summary,
      (SELECT COUNT(DISTINCT gv.member_id)::INTEGER
       FROM governance_votes gv
       WHERE gv.proposal_id = gp.id) AS participant_count,
      gp.created_at,
      gp.status::VARCHAR,
      ('https://blkout.community/governance/proposals/' || gp.id::TEXT)::VARCHAR AS url
    FROM governance_proposals gp
    WHERE gp.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND gp.status IN ('active', 'passed', 'implemented')

    UNION ALL

    -- Member milestones (verified creators, new facilitators)
    SELECT
      gm.id,
      'milestone'::VARCHAR AS voice_type,
      CASE
        WHEN gm.participation_level = 'facilitator' THEN 'New Community Facilitator'
        WHEN gm.creator_sovereignty_verified = true THEN 'Verified Creator Spotlight'
        ELSE 'Community Member Highlight'
      END::VARCHAR AS title,
      ('Celebrating ' || COALESCE(gm.display_name, 'Community Member'))::TEXT AS summary,
      1::INTEGER AS participant_count,
      gm.updated_at AS created_at,
      gm.membership_status::VARCHAR AS status,
      NULL::VARCHAR AS url
    FROM governance_members gm
    WHERE gm.updated_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND (gm.creator_sovereignty_verified = true OR gm.participation_level IN ('facilitator', 'proposer'))
      AND gm.membership_status = 'active'
  )
  SELECT *
  FROM governance_activity
  ORDER BY
    participant_count DESC,
    created_at DESC
  LIMIT v_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_community_voice IS 'Returns governance activity and member achievements for community voice section';

-- ============================================================================
-- 4. GET TRENDING RESOURCES
-- Source: ivor_resources with access/recommendation tracking
-- Weekly: max 2, Monthly: max 3
-- ============================================================================
CREATE OR REPLACE FUNCTION get_trending_resources(
  p_edition_type VARCHAR DEFAULT 'weekly',
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  category_name VARCHAR,
  website_url VARCHAR,
  priority INTEGER,
  access_count BIGINT,
  recommendation_count BIGINT
) AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Set limit based on edition type
  v_limit := CASE p_edition_type
    WHEN 'weekly' THEN 2
    WHEN 'monthly' THEN 3
    ELSE 2
  END;

  RETURN QUERY
  SELECT
    ir.id,
    ir.title::VARCHAR,
    ir.description::TEXT,
    COALESCE(ic.name, 'General')::VARCHAR AS category_name,
    ir.website_url::VARCHAR,
    COALESCE(ir.priority, 0)::INTEGER,
    -- Count resource accesses (from IVOR analytics if available)
    COALESCE(
      (SELECT COUNT(*)
       FROM ivor_analytics ia
       WHERE ia.resource_id = ir.id
         AND ia.created_at >= NOW() - (p_days_back || ' days')::INTERVAL),
      0
    )::BIGINT AS access_count,
    -- Count times recommended by IVOR
    COALESCE(
      (SELECT COUNT(*)
       FROM ivor_conversation_resources icr
       WHERE icr.resource_id = ir.id
         AND icr.created_at >= NOW() - (p_days_back || ' days')::INTERVAL),
      0
    )::BIGINT AS recommendation_count
  FROM ivor_resources ir
  LEFT JOIN ivor_categories ic ON ir.category_id = ic.id
  WHERE ir.is_active = true
  ORDER BY
    (COALESCE(ir.priority, 0) * 2 +
     COALESCE((SELECT COUNT(*) FROM ivor_analytics ia WHERE ia.resource_id = ir.id AND ia.created_at >= NOW() - (p_days_back || ' days')::INTERVAL), 0)) DESC,
    ir.updated_at DESC
  LIMIT v_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_trending_resources IS 'Returns trending community resources for newsletter resources section';

-- ============================================================================
-- 5. GET ACTIVE CAMPAIGNS (Call to Action)
-- Source: campaigns table with status = 'active'
-- Weekly: max 1, Monthly: max 2
-- ============================================================================
CREATE OR REPLACE FUNCTION get_active_campaigns(
  p_edition_type VARCHAR DEFAULT 'weekly'
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  campaign_type VARCHAR,
  priority VARCHAR,
  start_date DATE,
  end_date DATE,
  key_messages TEXT[],
  target_audience JSONB,
  cta_url VARCHAR
) AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Set limit based on edition type
  v_limit := CASE p_edition_type
    WHEN 'weekly' THEN 1
    WHEN 'monthly' THEN 2
    ELSE 1
  END;

  RETURN QUERY
  SELECT
    c.id,
    c.title::VARCHAR,
    c.description::TEXT,
    c.campaign_type::VARCHAR,
    c.priority::VARCHAR,
    c.start_date::DATE,
    c.end_date::DATE,
    c.key_messages::TEXT[],
    c.target_audience,
    COALESCE(
      (c.metadata->>'cta_url')::VARCHAR,
      'https://blkout.community/campaigns/' || c.slug
    )::VARCHAR AS cta_url
  FROM campaigns c
  WHERE c.status = 'active'
    AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
  ORDER BY
    CASE c.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END,
    c.start_date ASC
  LIMIT v_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_active_campaigns IS 'Returns active campaigns for newsletter call-to-action section';

-- ============================================================================
-- 6. MASTER FUNCTION: GET ALL NEWSLETTER CONTENT
-- Combines all content sources into a single JSON result for Herald
-- ============================================================================
CREATE OR REPLACE FUNCTION get_newsletter_content(
  p_edition_type VARCHAR DEFAULT 'weekly'
)
RETURNS JSONB AS $$
DECLARE
  v_highlights JSONB;
  v_events JSONB;
  v_community_voice JSONB;
  v_resources JSONB;
  v_campaigns JSONB;
  v_intelligence JSONB;
  v_days_back INTEGER;
BEGIN
  -- Set lookback period based on edition type
  v_days_back := CASE p_edition_type
    WHEN 'weekly' THEN 7
    WHEN 'monthly' THEN 30
    ELSE 7
  END;

  -- Gather highlights
  SELECT COALESCE(jsonb_agg(row_to_json(h)::jsonb), '[]'::jsonb)
  INTO v_highlights
  FROM get_newsletter_highlights(p_edition_type, v_days_back) h;

  -- Gather events
  SELECT COALESCE(jsonb_agg(row_to_json(e)::jsonb), '[]'::jsonb)
  INTO v_events
  FROM get_upcoming_events(p_edition_type, 14) e;

  -- Gather community voice
  SELECT COALESCE(jsonb_agg(row_to_json(cv)::jsonb), '[]'::jsonb)
  INTO v_community_voice
  FROM get_community_voice(p_edition_type, v_days_back) cv;

  -- Gather resources
  SELECT COALESCE(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
  INTO v_resources
  FROM get_trending_resources(p_edition_type, v_days_back) r;

  -- Gather campaigns
  SELECT COALESCE(jsonb_agg(row_to_json(c)::jsonb), '[]'::jsonb)
  INTO v_campaigns
  FROM get_active_campaigns(p_edition_type) c;

  -- Gather intelligence summary
  SELECT COALESCE(
    jsonb_build_object(
      'active_members', (SELECT COUNT(*) FROM governance_members WHERE membership_status = 'active'),
      'verified_creators', (SELECT COUNT(*) FROM governance_members WHERE creator_sovereignty_verified = true),
      'weekly_subscribers', (SELECT COUNT(*) FROM newsletter_subscribers WHERE is_active = true AND tier IN ('weekly', 'both')),
      'monthly_subscribers', (SELECT COUNT(*) FROM newsletter_subscribers WHERE is_active = true AND tier IN ('monthly', 'both')),
      'total_events_upcoming', (SELECT COUNT(*) FROM events WHERE status = 'approved' AND date >= CURRENT_DATE),
      'generated_at', NOW()
    ),
    '{}'::jsonb
  )
  INTO v_intelligence;

  -- Return combined newsletter content
  RETURN jsonb_build_object(
    'edition_type', p_edition_type,
    'generated_at', NOW(),
    'sections', jsonb_build_object(
      'highlights', v_highlights,
      'events', v_events,
      'community_voice', v_community_voice,
      'resources', v_resources,
      'call_to_action', v_campaigns
    ),
    'intelligence', v_intelligence,
    'content_counts', jsonb_build_object(
      'highlights', jsonb_array_length(v_highlights),
      'events', jsonb_array_length(v_events),
      'community_voice', jsonb_array_length(v_community_voice),
      'resources', jsonb_array_length(v_resources),
      'call_to_action', jsonb_array_length(v_campaigns)
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_newsletter_content IS 'Master function that gathers all content for Herald newsletter generation';

-- ============================================================================
-- 7. HERALD INTELLIGENCE QUERIES
-- Specific queries for Herald to understand community context
-- ============================================================================
CREATE OR REPLACE FUNCTION get_herald_intelligence()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'member_activity', (
      SELECT jsonb_build_object(
        'total_active', COUNT(*) FILTER (WHERE membership_status = 'active'),
        'new_this_week', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'),
        'new_this_month', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'),
        'verified_creators', COUNT(*) FILTER (WHERE creator_sovereignty_verified = true),
        'facilitators', COUNT(*) FILTER (WHERE participation_level = 'facilitator'),
        'proposers', COUNT(*) FILTER (WHERE participation_level = 'proposer')
      )
      FROM governance_members
    ),
    'content_performance', (
      SELECT jsonb_build_object(
        'articles_this_week', COUNT(*) FILTER (WHERE published_at > NOW() - INTERVAL '7 days'),
        'avg_interest_score', ROUND(AVG(interest_score)::NUMERIC, 1),
        'top_category', (
          SELECT category FROM news_articles
          WHERE status = 'published'
          GROUP BY category
          ORDER BY COUNT(*) DESC, AVG(interest_score) DESC
          LIMIT 1
        )
      )
      FROM news_articles
      WHERE status = 'published'
    ),
    'governance_activity', (
      SELECT jsonb_build_object(
        'active_proposals', COUNT(*) FILTER (WHERE status = 'active'),
        'passed_this_month', COUNT(*) FILTER (WHERE status = 'passed' AND updated_at > NOW() - INTERVAL '30 days'),
        'total_votes_this_month', (
          SELECT COUNT(*) FROM governance_votes
          WHERE created_at > NOW() - INTERVAL '30 days'
        )
      )
      FROM governance_proposals
    ),
    'resource_trends', (
      SELECT jsonb_build_object(
        'total_active_resources', COUNT(*) FILTER (WHERE is_active = true),
        'top_categories', (
          SELECT COALESCE(jsonb_agg(cat), '[]'::jsonb)
          FROM (
            SELECT jsonb_build_object('name', ic.name, 'count', COUNT(*)) as cat
            FROM ivor_resources ir
            JOIN ivor_categories ic ON ir.category_id = ic.id
            WHERE ir.is_active = true
            GROUP BY ic.name
            ORDER BY COUNT(*) DESC
            LIMIT 3
          ) cats
        )
      )
      FROM ivor_resources
    ),
    'subscriber_stats', (
      SELECT jsonb_build_object(
        'weekly_tier', COUNT(*) FILTER (WHERE tier IN ('weekly', 'both') AND is_active = true),
        'monthly_tier', COUNT(*) FILTER (WHERE tier IN ('monthly', 'both') AND is_active = true),
        'new_this_week', COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '7 days' AND is_active = true),
        'unsubscribed_this_month', COUNT(*) FILTER (WHERE unsubscribed_at > NOW() - INTERVAL '30 days')
      )
      FROM newsletter_subscribers
    ),
    'generated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_herald_intelligence IS 'Returns comprehensive intelligence data for Herald agent decision-making';

-- ============================================================================
-- 8. UPDATE HERALD AGENT CONFIGURATION WITH NEW INTELLIGENCE QUERIES
-- ============================================================================
UPDATE agent_configurations
SET
  settings = settings || jsonb_build_object(
    'content_selection_functions', jsonb_build_array(
      'get_newsletter_highlights',
      'get_upcoming_events',
      'get_community_voice',
      'get_trending_resources',
      'get_active_campaigns',
      'get_newsletter_content',
      'get_herald_intelligence'
    ),
    'content_limits', jsonb_build_object(
      'weekly', jsonb_build_object(
        'highlights', 3,
        'events', 5,
        'community_voice', 2,
        'resources', 2,
        'call_to_action', 1
      ),
      'monthly', jsonb_build_object(
        'highlights', 5,
        'events', 4,
        'community_voice', 3,
        'resources', 3,
        'call_to_action', 2
      )
    )
  ),
  updated_at = NOW()
WHERE agent_name = 'herald';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_newsletter_highlights TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_community_voice TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_resources TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_campaigns TO authenticated;
GRANT EXECUTE ON FUNCTION get_newsletter_content TO authenticated;
GRANT EXECUTE ON FUNCTION get_herald_intelligence TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION get_newsletter_highlights IS 'Herald: Fetch top articles by interest score for newsletter highlights';
COMMENT ON FUNCTION get_upcoming_events IS 'Herald: Fetch upcoming approved events within specified timeframe';
COMMENT ON FUNCTION get_community_voice IS 'Herald: Fetch governance activity and member achievements';
COMMENT ON FUNCTION get_trending_resources IS 'Herald: Fetch trending community resources based on usage';
COMMENT ON FUNCTION get_active_campaigns IS 'Herald: Fetch active campaigns for call-to-action section';
COMMENT ON FUNCTION get_newsletter_content IS 'Herald: Master function combining all newsletter sections';
COMMENT ON FUNCTION get_herald_intelligence IS 'Herald: Comprehensive intelligence data for content decisions';
