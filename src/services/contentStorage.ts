/**
 * Content Storage Types and Service
 * Handles campaign content records and platform variants for the ContentEditor
 */

import type { PlatformType, CampaignContentType, ContentItemStatus } from '@/types/campaign';

/**
 * Platform-specific variant dimensions and settings
 */
export interface PlatformVariantSettings {
  platform: PlatformType;
  width: number;
  height: number;
  aspectRatio: string;
  maxFileSize: number; // in bytes
  supportedFormats: string[];
}

/**
 * Platform variant record for storing individual platform versions of content
 */
export interface ContentVariantRecord {
  id: string;
  contentId: string;
  platform: PlatformType;

  // Media information
  mediaUrl?: string;
  thumbnailUrl?: string;
  originalWidth?: number;
  originalHeight?: number;
  variantWidth: number;
  variantHeight: number;
  aspectRatio: string;

  // Platform-specific content
  caption: string;
  hashtags: string[];
  mentions?: string[];

  // Scheduling
  scheduledFor?: Date;
  publishedAt?: Date;

  // Status
  status: ContentItemStatus;
  isSelected: boolean; // Whether to publish to this platform

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Main campaign content record for storage
 */
export interface CampaignContentRecord {
  id: string;
  campaignId: string;

  // Content details
  title: string;
  type: CampaignContentType;
  primaryPlatform: PlatformType;

  // Media
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  originalWidth?: number;
  originalHeight?: number;

  // Caption and text
  caption: string;
  hashtags: string[];

  // Scheduling
  primaryScheduledFor?: Date;

  // Status
  status: ContentItemStatus;

  // Metadata
  metadata?: Record<string, unknown>;
  assignedAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Standard platform dimensions for social media
 */
export const PLATFORM_DIMENSIONS: Record<PlatformType, PlatformVariantSettings[]> = {
  instagram: [
    { platform: 'instagram', width: 1080, height: 1080, aspectRatio: '1:1', maxFileSize: 8 * 1024 * 1024, supportedFormats: ['jpg', 'png'] },
    { platform: 'instagram', width: 1080, height: 1350, aspectRatio: '4:5', maxFileSize: 8 * 1024 * 1024, supportedFormats: ['jpg', 'png'] },
    { platform: 'instagram', width: 1080, height: 1920, aspectRatio: '9:16', maxFileSize: 8 * 1024 * 1024, supportedFormats: ['jpg', 'png', 'mp4'] },
  ],
  twitter: [
    { platform: 'twitter', width: 1200, height: 675, aspectRatio: '16:9', maxFileSize: 5 * 1024 * 1024, supportedFormats: ['jpg', 'png', 'gif'] },
    { platform: 'twitter', width: 1080, height: 1080, aspectRatio: '1:1', maxFileSize: 5 * 1024 * 1024, supportedFormats: ['jpg', 'png', 'gif'] },
  ],
  linkedin: [
    { platform: 'linkedin', width: 1200, height: 627, aspectRatio: '1.91:1', maxFileSize: 8 * 1024 * 1024, supportedFormats: ['jpg', 'png'] },
    { platform: 'linkedin', width: 1080, height: 1080, aspectRatio: '1:1', maxFileSize: 8 * 1024 * 1024, supportedFormats: ['jpg', 'png'] },
  ],
  facebook: [
    { platform: 'facebook', width: 1200, height: 630, aspectRatio: '1.91:1', maxFileSize: 8 * 1024 * 1024, supportedFormats: ['jpg', 'png'] },
    { platform: 'facebook', width: 1080, height: 1080, aspectRatio: '1:1', maxFileSize: 8 * 1024 * 1024, supportedFormats: ['jpg', 'png'] },
  ],
  tiktok: [
    { platform: 'tiktok', width: 1080, height: 1920, aspectRatio: '9:16', maxFileSize: 287 * 1024 * 1024, supportedFormats: ['mp4', 'mov'] },
  ],
  email: [
    { platform: 'email', width: 600, height: 400, aspectRatio: '3:2', maxFileSize: 1 * 1024 * 1024, supportedFormats: ['jpg', 'png', 'gif'] },
  ],
  website: [
    { platform: 'website', width: 1920, height: 1080, aspectRatio: '16:9', maxFileSize: 10 * 1024 * 1024, supportedFormats: ['jpg', 'png', 'webp'] },
  ],
  newsletter: [
    { platform: 'newsletter', width: 600, height: 400, aspectRatio: '3:2', maxFileSize: 1 * 1024 * 1024, supportedFormats: ['jpg', 'png', 'gif'] },
  ],
};

/**
 * Character limits by platform
 */
export const PLATFORM_CHAR_LIMITS: Record<PlatformType, number> = {
  instagram: 2200,
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  tiktok: 2200,
  email: 10000,
  website: 50000,
  newsletter: 10000,
};

/**
 * Get the primary variant dimensions for a platform
 */
export function getPrimaryDimensions(platform: PlatformType): PlatformVariantSettings {
  return PLATFORM_DIMENSIONS[platform]?.[0] || PLATFORM_DIMENSIONS.instagram[0];
}

/**
 * Create a new content variant record
 */
export function createVariantRecord(
  contentId: string,
  platform: PlatformType,
  caption: string,
  hashtags: string[]
): ContentVariantRecord {
  const dimensions = getPrimaryDimensions(platform);

  return {
    id: `var_${Date.now()}_${platform}`,
    contentId,
    platform,
    variantWidth: dimensions.width,
    variantHeight: dimensions.height,
    aspectRatio: dimensions.aspectRatio,
    caption,
    hashtags,
    status: 'draft',
    isSelected: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create a new campaign content record
 */
export function createContentRecord(
  campaignId: string,
  title: string,
  type: CampaignContentType,
  primaryPlatform: PlatformType
): CampaignContentRecord {
  return {
    id: `content_${Date.now()}`,
    campaignId,
    title,
    type,
    primaryPlatform,
    caption: '',
    hashtags: [],
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================================
// Supabase CRUD Operations
// ============================================================================

import { supabase } from '@/lib/supabase';

export interface PlatformPreset {
  id?: string;
  platform: string;
  variant_type: string;
  width: number;
  height: number;
  aspect_ratio: string;
  description: string;
  is_default: boolean;
}

/**
 * Upload media to Supabase Storage
 */
export async function uploadMedia(
  file: File,
  campaignId: string,
  contentKey: string,
  originalFilename: string
): Promise<string> {
  const ext = originalFilename.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const path = `${campaignId}/${contentKey}/${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from('campaign-assets')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('campaign-assets')
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Save content record to Supabase
 */
export async function saveContent(
  content: Omit<CampaignContentRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CampaignContentRecord | null> {
  const { data, error } = await supabase
    .from('campaign_content')
    .insert({
      campaign_id: content.campaignId,
      content_key: content.title, // Using title as key for now
      title: content.title,
      caption: content.caption,
      hashtags: content.hashtags,
      platform: content.primaryPlatform,
      content_type: content.type,
      source_media_url: content.mediaUrl,
      source_media_type: content.mediaType,
      source_media_width: content.originalWidth,
      source_media_height: content.originalHeight,
      status: content.status,
      scheduled_for: content.primaryScheduledFor,
      metadata: content.metadata,
    })
    .select()
    .single();

  if (error) throw new Error(`Save failed: ${error.message}`);
  return data ? mapDbToContentRecord(data) : null;
}

/**
 * Update content record
 */
export async function updateContent(
  id: string,
  updates: Partial<CampaignContentRecord>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title) dbUpdates.title = updates.title;
  if (updates.caption) dbUpdates.caption = updates.caption;
  if (updates.hashtags) dbUpdates.hashtags = updates.hashtags;
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.mediaUrl) dbUpdates.source_media_url = updates.mediaUrl;
  if (updates.primaryScheduledFor) dbUpdates.scheduled_for = updates.primaryScheduledFor;

  const { error } = await supabase
    .from('campaign_content')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw new Error(`Update failed: ${error.message}`);
}

/**
 * Get variants for content
 */
export async function getVariantsForContent(contentId: string): Promise<ContentVariantRecord[]> {
  const { data, error } = await supabase
    .from('campaign_content_variants')
    .select('*')
    .eq('content_id', contentId);

  if (error) throw new Error(`Failed to get variants: ${error.message}`);
  return (data || []).map(mapDbToVariantRecord);
}

/**
 * Save multiple variants
 */
export async function saveVariantsBatch(
  variants: Omit<ContentVariantRecord, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<void> {
  const dbVariants = variants.map(v => ({
    content_id: v.contentId,
    platform: v.platform,
    variant_type: v.aspectRatio,
    width: v.variantWidth,
    height: v.variantHeight,
    aspect_ratio: v.aspectRatio,
    media_url: v.mediaUrl,
    media_status: v.status === 'ready' ? 'ready' : 'pending',
    scheduled_for: v.scheduledFor,
  }));

  const { error } = await supabase
    .from('campaign_content_variants')
    .insert(dbVariants);

  if (error) throw new Error(`Save variants failed: ${error.message}`);
}

/**
 * Update variant status
 */
export async function updateVariantStatus(
  id: string,
  status: string,
  mediaUrl?: string
): Promise<void> {
  const updates: Record<string, unknown> = { media_status: status };
  if (mediaUrl) updates.media_url = mediaUrl;

  const { error } = await supabase
    .from('campaign_content_variants')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(`Update variant failed: ${error.message}`);
}

/**
 * Delete variant
 */
export async function deleteVariant(id: string): Promise<void> {
  const { error } = await supabase
    .from('campaign_content_variants')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Delete variant failed: ${error.message}`);
}

/**
 * Get all platform presets
 */
export async function getPlatformPresets(): Promise<PlatformPreset[]> {
  const { data, error } = await supabase
    .from('platform_variant_presets')
    .select('*');

  if (error) {
    console.warn('Failed to get presets from DB, using defaults:', error.message);
    return getDefaultPresets();
  }
  return data || getDefaultPresets();
}

/**
 * Get presets for specific platform
 */
export async function getPresetsForPlatform(platform: string): Promise<PlatformPreset[]> {
  const { data, error } = await supabase
    .from('platform_variant_presets')
    .select('*')
    .eq('platform', platform);

  if (error) {
    console.warn('Failed to get presets, using defaults:', error.message);
    return getDefaultPresets().filter(p => p.platform === platform);
  }
  return data || [];
}

/**
 * Default presets fallback
 */
function getDefaultPresets(): PlatformPreset[] {
  return [
    { platform: 'instagram', variant_type: 'feed_square', width: 1080, height: 1080, aspect_ratio: '1:1', description: 'Instagram Feed Square', is_default: true },
    { platform: 'instagram', variant_type: 'story', width: 1080, height: 1920, aspect_ratio: '9:16', description: 'Instagram Story', is_default: false },
    { platform: 'linkedin', variant_type: 'landscape', width: 1200, height: 627, aspect_ratio: '1.91:1', description: 'LinkedIn Landscape', is_default: true },
    { platform: 'tiktok', variant_type: 'video', width: 1080, height: 1920, aspect_ratio: '9:16', description: 'TikTok Video', is_default: true },
    { platform: 'twitter', variant_type: 'single', width: 1200, height: 675, aspect_ratio: '16:9', description: 'Twitter Image', is_default: true },
  ];
}

// Helper mappers
function mapDbToContentRecord(db: Record<string, unknown>): CampaignContentRecord {
  return {
    id: String(db.id),
    campaignId: String(db.campaign_id),
    title: String(db.title),
    type: String(db.content_type) as CampaignContentType,
    primaryPlatform: String(db.platform) as PlatformType,
    mediaUrl: db.source_media_url as string | undefined,
    mediaType: db.source_media_type as 'image' | 'video' | undefined,
    originalWidth: db.source_media_width as number | undefined,
    originalHeight: db.source_media_height as number | undefined,
    caption: String(db.caption || ''),
    hashtags: (db.hashtags as string[]) || [],
    primaryScheduledFor: db.scheduled_for ? new Date(db.scheduled_for as string) : undefined,
    status: String(db.status) as ContentItemStatus,
    metadata: db.metadata as Record<string, unknown>,
    createdAt: new Date(db.created_at as string),
    updatedAt: new Date(db.updated_at as string),
  };
}

function mapDbToVariantRecord(db: Record<string, unknown>): ContentVariantRecord {
  return {
    id: String(db.id),
    contentId: String(db.content_id),
    platform: String(db.platform) as PlatformType,
    mediaUrl: db.media_url as string | undefined,
    variantWidth: Number(db.width),
    variantHeight: Number(db.height),
    aspectRatio: String(db.aspect_ratio),
    caption: '',
    hashtags: [],
    status: db.media_status === 'ready' ? 'ready' : 'draft',
    isSelected: true,
    scheduledFor: db.scheduled_for ? new Date(db.scheduled_for as string) : undefined,
    createdAt: new Date(db.created_at as string),
    updatedAt: new Date(db.updated_at as string),
  };
}
