
-- =====================================================
-- BLKOUT UK Communications System
-- Announcements Table Migration
-- =====================================================
-- This migration creates the announcements table for managing
-- community announcements displayed on the Discover page

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content fields
    title VARCHAR(255) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT, -- Full content (optional, if different from excerpt)
    
    -- Category with constraint
    category VARCHAR(50) NOT NULL CHECK (category IN ('event', 'update', 'campaign', 'urgent')),
    
    -- Optional link for more information
    link VARCHAR(500),
    
    -- Status management
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Author information (linked to auth.users)
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name VARCHAR(255), -- Cached author name for display
    
    -- Priority/ordering
    priority INTEGER DEFAULT 0, -- Higher priority shows first
    
    -- Display date (can be different from created_at for scheduled announcements)
    display_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Metadata timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement tracking (optional)
    view_count INTEGER DEFAULT 0,
    
    -- Soft delete support
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- Indexes for performance optimization
-- =====================================================

-- Index for fetching published announcements (most common query)
CREATE INDEX idx_announcements_published 
ON announcements(status, display_date DESC) 
WHERE deleted_at IS NULL;

-- Index for filtering by category
CREATE INDEX idx_announcements_category 
ON announcements(category, display_date DESC) 
WHERE status = 'published' AND deleted_at IS NULL;

-- Index for author queries
CREATE INDEX idx_announcements_author 
ON announcements(author_id, created_at DESC);

-- Index for priority ordering
CREATE INDEX idx_announcements_priority 
ON announcements(priority DESC, display_date DESC) 
WHERE status = 'published' AND deleted_at IS NULL;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published announcements
CREATE POLICY "Public can view published announcements"
ON announcements
FOR SELECT
USING (status = 'published' AND deleted_at IS NULL);

-- Policy: Authenticated users can view all announcements
CREATE POLICY "Authenticated users can view all announcements"
ON announcements
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- Policy: Only admins can insert announcements
-- (You'll need to create an is_admin() function or use a specific role)
CREATE POLICY "Admins can insert announcements"
ON announcements
FOR INSERT
TO authenticated
WITH CHECK (true); -- Replace with: is_admin() = true when admin function exists

-- Policy: Admins can update announcements
CREATE POLICY "Admins can update announcements"
ON announcements
FOR UPDATE
TO authenticated
USING (true) -- Replace with: is_admin() = true when admin function exists
WITH CHECK (true);

-- Policy: Admins can delete announcements (soft delete)
CREATE POLICY "Admins can delete announcements"
ON announcements
FOR DELETE
TO authenticated
USING (true); -- Replace with: is_admin() = true when admin function exists

-- =====================================================
-- Triggers
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Set published_at when status changes to published
    IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
        NEW.published_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_announcements_updated_at();

-- =====================================================
-- Helpful Views
-- =====================================================

-- View for active published announcements
CREATE OR REPLACE VIEW active_announcements AS
SELECT 
    id,
    title,
    excerpt,
    content,
    category,
    link,
    author_name,
    display_date,
    priority,
    view_count,
    created_at
FROM announcements
WHERE status = 'published'
    AND deleted_at IS NULL
ORDER BY priority DESC, display_date DESC;

-- View with author details
CREATE OR REPLACE VIEW announcements_with_author AS
SELECT 
    a.id,
    a.title,
    a.excerpt,
    a.content,
    a.category,
    a.link,
    a.status,
    a.display_date,
    a.priority,
    a.view_count,
    a.created_at,
    a.updated_at,
    a.published_at,
    a.author_id,
    a.author_name,
    u.email as author_email
FROM announcements a
LEFT JOIN auth.users u ON a.author_id = u.id
WHERE a.deleted_at IS NULL;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_announcement_views(announcement_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE announcements
    SET view_count = view_count + 1
    WHERE id = announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE announcements IS 'Stores community announcements displayed on the Discover page';
COMMENT ON COLUMN announcements.priority IS 'Higher values appear first. Default is 0.';
COMMENT ON COLUMN announcements.display_date IS 'Date shown to users, can be scheduled for future';
COMMENT ON COLUMN announcements.status IS 'draft: not visible, published: visible to public, archived: hidden but preserved';
COMMENT ON COLUMN announcements.deleted_at IS 'Soft delete timestamp. NULL means active.';
