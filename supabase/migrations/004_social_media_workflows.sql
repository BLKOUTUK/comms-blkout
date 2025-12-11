-- Migration: Social Media Workflow Tables
-- Description: Tables for n8n social media automation workflows
-- Date: 2024-12-11

-- ============================================
-- AGENT TASKS TABLE (for SocialSync)
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('news_crawler', 'viral_trends', 'event_scheduler', 'brand_guardian', 'griot', 'listener', 'weaver', 'strategist', 'herald')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    target_platform VARCHAR(50) CHECK (target_platform IN ('instagram', 'tiktok', 'linkedin', 'twitter', 'youtube', 'newsletter')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES auth.users(id),
    suggested_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- GENERATED ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.generated_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.agent_tasks(id) ON DELETE SET NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    aspect_ratio VARCHAR(20) DEFAULT '1:1',
    style VARCHAR(100),
    prompt TEXT,
    overlay_text TEXT,
    logo_id VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL MEDIA PUBLISHING QUEUE
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_media_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.generated_assets(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'twitter', 'youtube')),
    caption TEXT,
    hashtags TEXT[] DEFAULT '{}',
    scheduled_for TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'published', 'failed', 'cancelled')),
    platform_post_id VARCHAR(255),
    publish_result JSONB,
    published_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTENT ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_item_id UUID REFERENCES public.social_media_queue(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_post_id VARCHAR(255),
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagement INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    raw_data JSONB DEFAULT '{}',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(queue_item_id, fetched_at)
);

-- ============================================
-- ANALYTICS SUMMARIES (Daily aggregates)
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    posts_count INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    total_impressions INTEGER DEFAULT 0,
    total_reach INTEGER DEFAULT 0,
    connection_score INTEGER DEFAULT 0,
    engagement_rate VARCHAR(10),
    platform_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNITY RESPONSES (AI-generated)
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    context TEXT,
    member_name VARCHAR(255) DEFAULT 'Community Member',
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('resources', 'events', 'support', 'general', 'feedback')),
    urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
    generated_caption TEXT,
    generated_hashtags TEXT[] DEFAULT '{}',
    visual_suggestion TEXT,
    response_tone VARCHAR(50),
    internal_notes TEXT,
    status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'published', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    published_to_queue_id UUID REFERENCES public.social_media_queue(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS TABLE (for Social Diary Researcher)
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(500),
    venue_name VARCHAR(255),
    city VARCHAR(100),
    organizer VARCHAR(255),
    url TEXT,
    cost VARCHAR(100) DEFAULT 'TBC',
    tags TEXT[] DEFAULT '{}',
    source VARCHAR(255),
    source_platform VARCHAR(100),
    relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published', 'past')),
    discovery_method VARCHAR(50) DEFAULT 'manual' CHECK (discovery_method IN ('manual', 'n8n_social_diary', 'ivor', 'community_submission')),
    image_url TEXT,
    featured BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(url)
);

-- ============================================
-- INDEXES
-- ============================================

-- Agent Tasks
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_type ON public.agent_tasks(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON public.agent_tasks(created_at DESC);

-- Generated Assets
CREATE INDEX IF NOT EXISTS idx_generated_assets_task_id ON public.generated_assets(task_id);
CREATE INDEX IF NOT EXISTS idx_generated_assets_created_at ON public.generated_assets(created_at DESC);

-- Social Media Queue
CREATE INDEX IF NOT EXISTS idx_social_media_queue_status ON public.social_media_queue(status);
CREATE INDEX IF NOT EXISTS idx_social_media_queue_scheduled_for ON public.social_media_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_media_queue_platform ON public.social_media_queue(platform);

-- Content Analytics
CREATE INDEX IF NOT EXISTS idx_content_analytics_queue_item_id ON public.content_analytics(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_platform ON public.content_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_content_analytics_fetched_at ON public.content_analytics(fetched_at DESC);

-- Community Responses
CREATE INDEX IF NOT EXISTS idx_community_responses_status ON public.community_responses(status);
CREATE INDEX IF NOT EXISTS idx_community_responses_urgency ON public.community_responses(urgency);
CREATE INDEX IF NOT EXISTS idx_community_responses_category ON public.community_responses(category);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_relevance_score ON public.events(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_discovery_method ON public.events(discovery_method);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public read access for events (approved only)
CREATE POLICY "Public can view approved events"
    ON public.events FOR SELECT
    USING (status IN ('approved', 'published'));

-- Service role can do anything (for n8n automation)
CREATE POLICY "Service role full access - agent_tasks"
    ON public.agent_tasks FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access - generated_assets"
    ON public.generated_assets FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access - social_media_queue"
    ON public.social_media_queue FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access - content_analytics"
    ON public.content_analytics FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access - analytics_summaries"
    ON public.analytics_summaries FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access - community_responses"
    ON public.community_responses FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access - events"
    ON public.events FOR ALL
    USING (auth.role() = 'service_role');

-- Authenticated users can read all
CREATE POLICY "Authenticated users can read agent_tasks"
    ON public.agent_tasks FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read generated_assets"
    ON public.generated_assets FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read social_media_queue"
    ON public.social_media_queue FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read content_analytics"
    ON public.content_analytics FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read analytics_summaries"
    ON public.analytics_summaries FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read community_responses"
    ON public.community_responses FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read events"
    ON public.events FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_tasks_updated_at
    BEFORE UPDATE ON public.agent_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_media_queue_updated_at
    BEFORE UPDATE ON public.social_media_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_responses_updated_at
    BEFORE UPDATE ON public.community_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.agent_tasks IS 'Tasks generated by AI agents for content creation';
COMMENT ON TABLE public.generated_assets IS 'AI-generated media assets (images, videos)';
COMMENT ON TABLE public.social_media_queue IS 'Queue for scheduled social media posts';
COMMENT ON TABLE public.content_analytics IS 'Engagement metrics for published posts';
COMMENT ON TABLE public.analytics_summaries IS 'Daily aggregated analytics with BLKOUT Connection Score';
COMMENT ON TABLE public.community_responses IS 'AI-generated responses to community questions';
COMMENT ON TABLE public.events IS 'Black LGBTQ+ events discovered by Social Diary Researcher';

COMMENT ON COLUMN public.analytics_summaries.connection_score IS 'BLKOUT methodology: Comments(3x) + Shares(2x) + Likes(1x)';
COMMENT ON COLUMN public.events.relevance_score IS 'AI-assessed relevance to Black LGBTQ+ community (0-100)';
