-- Campaign Content Management Schema
-- Stores content items with media variants for multi-platform publishing

-- Enable storage if not already
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaign content items table
CREATE TABLE IF NOT EXISTS campaign_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  content_key TEXT NOT NULL, -- Original key from JSON (e.g., "instagram-post_1_announcement")

  -- Content details
  title TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[],
  platform TEXT NOT NULL, -- Primary platform: instagram, twitter, linkedin, tiktok
  content_type TEXT NOT NULL, -- carousel, reel, post, story, thread

  -- Source media (uploaded by user)
  source_media_url TEXT,
  source_media_type TEXT, -- image, video
  source_media_width INT,
  source_media_height INT,

  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'media_attached', 'variants_ready', 'scheduled', 'published')),

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, content_key)
);

-- Platform variants table (auto-generated resizes)
CREATE TABLE IF NOT EXISTS campaign_content_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES campaign_content(id) ON DELETE CASCADE,

  -- Variant details
  platform TEXT NOT NULL, -- instagram, linkedin, tiktok
  variant_type TEXT NOT NULL, -- feed, story, portrait, landscape, square

  -- Dimensions
  width INT NOT NULL,
  height INT NOT NULL,
  aspect_ratio TEXT, -- e.g., "1:1", "9:16", "16:9"

  -- Generated media
  media_url TEXT,
  media_status TEXT DEFAULT 'pending' CHECK (media_status IN ('pending', 'generating', 'ready', 'failed')),

  -- Scheduling (can differ per platform)
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_id, platform, variant_type)
);

-- Platform variant presets
CREATE TABLE IF NOT EXISTS platform_variant_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  variant_type TEXT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,

  UNIQUE(platform, variant_type)
);

-- Insert default presets
INSERT INTO platform_variant_presets (platform, variant_type, width, height, aspect_ratio, description, is_default) VALUES
  -- Instagram
  ('instagram', 'feed_square', 1080, 1080, '1:1', 'Instagram Feed Square', true),
  ('instagram', 'feed_portrait', 1080, 1350, '4:5', 'Instagram Feed Portrait', false),
  ('instagram', 'feed_landscape', 1080, 566, '1.91:1', 'Instagram Feed Landscape', false),
  ('instagram', 'story', 1080, 1920, '9:16', 'Instagram Story/Reel', true),
  ('instagram', 'carousel', 1080, 1080, '1:1', 'Instagram Carousel Slide', false),

  -- LinkedIn
  ('linkedin', 'square', 1080, 1080, '1:1', 'LinkedIn Square', true),
  ('linkedin', 'landscape', 1200, 627, '1.91:1', 'LinkedIn Landscape', true),
  ('linkedin', 'portrait', 627, 1200, '1:1.91', 'LinkedIn Portrait', false),

  -- TikTok
  ('tiktok', 'video', 1080, 1920, '9:16', 'TikTok Video', true),

  -- Twitter/X
  ('twitter', 'single', 1200, 675, '16:9', 'Twitter Single Image', true),
  ('twitter', 'square', 1080, 1080, '1:1', 'Twitter Square', false),

  -- Facebook
  ('facebook', 'feed', 1200, 630, '1.91:1', 'Facebook Feed', true),
  ('facebook', 'square', 1080, 1080, '1:1', 'Facebook Square', false),
  ('facebook', 'story', 1080, 1920, '9:16', 'Facebook Story', false)
ON CONFLICT (platform, variant_type) DO NOTHING;

-- Create storage bucket for campaign assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-assets', 'campaign-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'campaign-assets');

-- Storage policy: Allow public reads
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'campaign-assets');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_content_updated_at
  BEFORE UPDATE ON campaign_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER campaign_content_variants_updated_at
  BEFORE UPDATE ON campaign_content_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_content_campaign ON campaign_content(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_content_status ON campaign_content(status);
CREATE INDEX IF NOT EXISTS idx_campaign_content_scheduled ON campaign_content(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_variants_content ON campaign_content_variants(content_id);
CREATE INDEX IF NOT EXISTS idx_variants_platform ON campaign_content_variants(platform);
