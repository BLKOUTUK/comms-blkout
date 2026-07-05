-- Phase 0: Apply missing functions and triggers to production Supabase
-- Source: 003_newsletter_and_herald_agent.sql, 005_herald_content_selection_functions.sql,
--         003_content_performance_feedback_loop.sql

-- ============================================================================
-- FROM 003_newsletter_and_herald_agent.sql
-- ============================================================================

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

CREATE OR REPLACE FUNCTION update_newsletter_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER trigger_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_subscribers_updated_at();

CREATE OR REPLACE FUNCTION update_newsletter_editions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_newsletter_editions_updated_at ON newsletter_editions;
CREATE TRIGGER trigger_newsletter_editions_updated_at
  BEFORE UPDATE ON newsletter_editions
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_editions_updated_at();

-- ============================================================================
-- FROM 005_herald_content_selection_functions.sql
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
  v_limit := CASE p_edition_type
    WHEN 'weekly' THEN 2
    WHEN 'monthly' THEN 3
    ELSE 2
  END;

  RETURN QUERY
  WITH governance_activity AS (
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
    COALESCE(
      (SELECT COUNT(*)
       FROM ivor_analytics ia
       WHERE ia.resource_id = ir.id
         AND ia.created_at >= NOW() - (p_days_back || ' days')::INTERVAL),
      0
    )::BIGINT AS access_count,
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
  v_days_back := CASE p_edition_type
    WHEN 'weekly' THEN 7
    WHEN 'monthly' THEN 30
    ELSE 7
  END;

  SELECT COALESCE(jsonb_agg(row_to_json(h)::jsonb), '[]'::jsonb)
  INTO v_highlights
  FROM get_newsletter_highlights(p_edition_type, v_days_back) h;

  SELECT COALESCE(jsonb_agg(row_to_json(e)::jsonb), '[]'::jsonb)
  INTO v_events
  FROM get_upcoming_events(p_edition_type, 14) e;

  SELECT COALESCE(jsonb_agg(row_to_json(cv)::jsonb), '[]'::jsonb)
  INTO v_community_voice
  FROM get_community_voice(p_edition_type, v_days_back) cv;

  SELECT COALESCE(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
  INTO v_resources
  FROM get_trending_resources(p_edition_type, v_days_back) r;

  SELECT COALESCE(jsonb_agg(row_to_json(c)::jsonb), '[]'::jsonb)
  INTO v_campaigns
  FROM get_active_campaigns(p_edition_type) c;

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

-- ============================================================================
-- FROM 003_content_performance_feedback_loop.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION boost_content_relevance(
    p_content_ids UUID[],
    p_boost_amount NUMERIC,
    p_reason TEXT DEFAULT 'high_engagement'
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
    content_id UUID;
BEGIN
    updated_count := 0;

    FOREACH content_id IN ARRAY p_content_ids
    LOOP
        UPDATE ivor_intelligence
        SET
            relevance_score = LEAST(1.0, relevance_score + (p_boost_amount / 100)),
            score_adjustments = score_adjustments + 1,
            last_adjustment_at = NOW(),
            adjustment_history = adjustment_history || jsonb_build_object(
                'timestamp', NOW(),
                'adjustment', p_boost_amount,
                'reason', p_reason,
                'previous_score', relevance_score
            ),
            updated_at = NOW()
        WHERE ivor_intelligence.content_id = boost_content_relevance.content_id
          AND is_active = true;

        IF FOUND THEN
            INSERT INTO feedback_loop_events (
                event_type, source_table, source_id,
                previous_value, change_amount, change_reason,
                triggered_by
            )
            SELECT
                'relevance_boost', 'ivor_intelligence', id,
                relevance_score - (p_boost_amount / 100), p_boost_amount, p_reason,
                'system'
            FROM ivor_intelligence
            WHERE ivor_intelligence.content_id = boost_content_relevance.content_id;

            updated_count := updated_count + 1;
        END IF;
    END LOOP;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reduce_content_relevance(
    p_content_ids UUID[],
    p_reduction_amount NUMERIC,
    p_reason TEXT DEFAULT 'low_engagement'
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
    content_id UUID;
BEGIN
    updated_count := 0;

    FOREACH content_id IN ARRAY p_content_ids
    LOOP
        UPDATE ivor_intelligence
        SET
            relevance_score = GREATEST(0.0, relevance_score - (p_reduction_amount / 100)),
            score_adjustments = score_adjustments + 1,
            last_adjustment_at = NOW(),
            adjustment_history = adjustment_history || jsonb_build_object(
                'timestamp', NOW(),
                'adjustment', -p_reduction_amount,
                'reason', p_reason,
                'previous_score', relevance_score
            ),
            updated_at = NOW()
        WHERE ivor_intelligence.content_id = reduce_content_relevance.content_id
          AND is_active = true;

        IF FOUND THEN
            INSERT INTO feedback_loop_events (
                event_type, source_table, source_id,
                previous_value, change_amount, change_reason,
                triggered_by
            )
            SELECT
                'relevance_reduction', 'ivor_intelligence', id,
                relevance_score + (p_reduction_amount / 100), -p_reduction_amount, p_reason,
                'system'
            FROM ivor_intelligence
            WHERE ivor_intelligence.content_id = reduce_content_relevance.content_id;

            updated_count := updated_count + 1;
        END IF;
    END LOOP;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_agent_quality_score(
    p_agent_id UUID,
    p_agent_type TEXT,
    p_approval_rate NUMERIC
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO agent_quality_scores (
        agent_id, agent_type, approval_rate, rejection_rate,
        score_period, period_start, period_end
    )
    VALUES (
        p_agent_id, p_agent_type, p_approval_rate, 1 - p_approval_rate,
        'weekly', date_trunc('week', NOW()), date_trunc('week', NOW()) + INTERVAL '1 week'
    )
    ON CONFLICT (agent_id, agent_type, score_period, period_start)
    DO UPDATE SET
        approval_rate = p_approval_rate,
        rejection_rate = 1 - p_approval_rate,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_performance_feedback()
RETURNS TRIGGER AS $$
DECLARE
    high_engagement_threshold NUMERIC := 0.4;
    low_engagement_threshold NUMERIC := 0.1;
    engagement_rate NUMERIC;
BEGIN
    IF NEW.metric_type = 'engagement' THEN
        engagement_rate := NEW.metric_value;

        IF engagement_rate > high_engagement_threshold THEN
            PERFORM boost_content_relevance(
                ARRAY[NEW.content_id],
                10,
                'high_engagement_trigger'
            );
        ELSIF engagement_rate < low_engagement_threshold THEN
            PERFORM reduce_content_relevance(
                ARRAY[NEW.content_id],
                5,
                'low_engagement_trigger'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_performance_feedback ON content_performance;
CREATE TRIGGER trigger_performance_feedback
    AFTER INSERT ON content_performance
    FOR EACH ROW
    EXECUTE FUNCTION process_performance_feedback();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_newsletter_highlights TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_community_voice TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_resources TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_campaigns TO authenticated;
GRANT EXECUTE ON FUNCTION get_newsletter_content TO authenticated;
GRANT EXECUTE ON FUNCTION get_herald_intelligence TO authenticated;
GRANT EXECUTE ON FUNCTION update_subscriber_engagement TO authenticated;
GRANT EXECUTE ON FUNCTION boost_content_relevance TO authenticated;
GRANT EXECUTE ON FUNCTION reduce_content_relevance TO authenticated;
