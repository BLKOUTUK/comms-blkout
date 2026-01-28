/**
 * useContentEditor Hook
 *
 * Manages content editing workflow including:
 * - Loading/saving content to Supabase
 * - Media upload and variant generation
 * - Status tracking
 */

import { useState, useCallback } from 'react';
import type { CampaignContentItem, PlatformType, CampaignContentType } from '@/types/campaign';
import {
  type CampaignContentRecord,
  type ContentVariantRecord,
  type PlatformPreset,
  saveContent,
  updateContent,
  saveVariantsBatch,
  updateVariantStatus,
  deleteVariant,
  uploadMedia,
  getPlatformPresets,
  getPresetsForPlatform,
  PLATFORM_DIMENSIONS,
} from '@/services/contentStorage';
import {
  generateVariants,
  getImageDimensions,
  type VariantResult,
} from '@/services/imageResize';

interface UseContentEditorReturn {
  // State
  isOpen: boolean;
  selectedContent: CampaignContentItem | null;
  contentRecord: CampaignContentRecord | null;
  variants: ContentVariantRecord[];
  presets: PlatformPreset[];
  isLoading: boolean;
  isSaving: boolean;
  isGeneratingVariants: boolean;
  error: string | null;

  // Actions
  openEditor: (content: CampaignContentItem, campaignId: string) => void;
  closeEditor: () => void;
  uploadSourceMedia: (file: File) => Promise<void>;
  generatePlatformVariants: (selectedPlatforms: string[]) => Promise<void>;
  updateVariantRecord: (variantId: string, updates: Partial<ContentVariantRecord>) => Promise<void>;
  removeVariant: (variantId: string) => Promise<void>;
  saveAndClose: (updates: Partial<CampaignContentRecord>) => Promise<void>;
  scheduleContent: (scheduledFor: Date, platformOverrides?: Record<string, Date>) => Promise<void>;
}

export function useContentEditor(): UseContentEditorReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<CampaignContentItem | null>(null);
  const [contentRecord, setContentRecord] = useState<CampaignContentRecord | null>(null);
  const [variants, setVariants] = useState<ContentVariantRecord[]>([]);
  const [presets, setPresets] = useState<PlatformPreset[]>([]);
  const [campaignId, setCampaignId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Open editor for a content item
  const openEditor = useCallback(async (content: CampaignContentItem, campId: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedContent(content);
    setCampaignId(campId);
    setIsOpen(true);

    try {
      // Load presets
      const allPresets = await getPlatformPresets();
      setPresets(allPresets);

      // Determine platform
      const platform = (content.platform === 'all' || content.platform === 'internal'
        ? 'instagram'
        : content.platform) as PlatformType;

      // Create content record from campaign item
      const record: CampaignContentRecord = {
        id: `local_${Date.now()}`,
        campaignId: campId,
        title: content.title,
        type: (content.type || 'social') as CampaignContentType,
        primaryPlatform: platform,
        caption: Array.isArray(content.content) ? content.content.join('\n\n') : (content.content || ''),
        hashtags: content.hashtags || [],
        status: content.status || 'draft',
        metadata: content.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setContentRecord(record);
      setVariants([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Close editor
  const closeEditor = useCallback(() => {
    setIsOpen(false);
    setSelectedContent(null);
    setContentRecord(null);
    setVariants([]);
    setError(null);
  }, []);

  // Upload source media
  const uploadSourceMedia = useCallback(async (file: File) => {
    if (!contentRecord) return;
    setIsLoading(true);
    setError(null);

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(file);

      // Upload to Supabase Storage
      const mediaUrl = await uploadMedia(
        file,
        campaignId,
        contentRecord.title.replace(/\s+/g, '-').toLowerCase(),
        file.name
      );

      // Update content record
      const updatedRecord: CampaignContentRecord = {
        ...contentRecord,
        mediaUrl,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        originalWidth: dimensions.width,
        originalHeight: dimensions.height,
        status: 'ready' as const,
        updatedAt: new Date(),
      };

      setContentRecord(updatedRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload media');
    } finally {
      setIsLoading(false);
    }
  }, [contentRecord, campaignId]);

  // Generate platform variants
  const generatePlatformVariants = useCallback(async (selectedPlatforms: string[]) => {
    if (!contentRecord?.mediaUrl) {
      setError('Please upload source media first');
      return;
    }

    setIsGeneratingVariants(true);
    setError(null);

    try {
      // Get presets for selected platforms
      const presetsToGenerate: PlatformPreset[] = [];
      for (const platform of selectedPlatforms) {
        const platformPresets = await getPresetsForPlatform(platform);
        // Get default preset for each platform
        const defaultPreset = platformPresets.find(p => p.is_default) || platformPresets[0];
        if (defaultPreset) {
          presetsToGenerate.push(defaultPreset);
        }
      }

      if (presetsToGenerate.length === 0) {
        // Use fallback from PLATFORM_DIMENSIONS
        for (const platform of selectedPlatforms) {
          const dims = PLATFORM_DIMENSIONS[platform as PlatformType];
          if (dims && dims[0]) {
            presetsToGenerate.push({
              platform,
              variant_type: 'default',
              width: dims[0].width,
              height: dims[0].height,
              aspect_ratio: dims[0].aspectRatio,
              description: `${platform} default`,
              is_default: true,
            });
          }
        }
      }

      // Fetch source image
      const response = await fetch(contentRecord.mediaUrl);
      const blob = await response.blob();
      const file = new File([blob], 'source.jpg', { type: blob.type });

      // Generate variants using canvas resize
      const results: VariantResult[] = await generateVariants(file, presetsToGenerate);

      // Create variant records (upload happens on save)
      const variantRecords: ContentVariantRecord[] = results.map((result, idx) => ({
        id: `variant_${Date.now()}_${idx}`,
        contentId: contentRecord.id,
        platform: result.preset.platform as PlatformType,
        mediaUrl: result.dataUrl, // Use data URL for preview, upload on save
        variantWidth: result.width,
        variantHeight: result.height,
        aspectRatio: result.preset.aspect_ratio,
        caption: contentRecord.caption,
        hashtags: contentRecord.hashtags,
        status: 'ready',
        isSelected: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      setVariants(prev => [...prev, ...variantRecords]);
      setContentRecord(prev => prev ? { ...prev, status: 'ready' as const, updatedAt: new Date() } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate variants');
    } finally {
      setIsGeneratingVariants(false);
    }
  }, [contentRecord]);

  // Update a variant
  const updateVariantRecord = useCallback(async (variantId: string, updates: Partial<ContentVariantRecord>) => {
    try {
      // If it's a persisted variant (UUID format), update in DB
      if (variantId.match(/^[0-9a-f-]{36}$/i)) {
        await updateVariantStatus(
          variantId,
          updates.status || 'ready',
          updates.mediaUrl
        );
      }

      setVariants(prev =>
        prev.map(v => v.id === variantId ? { ...v, ...updates, updatedAt: new Date() } : v)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update variant');
    }
  }, []);

  // Remove a variant
  const removeVariant = useCallback(async (variantId: string) => {
    try {
      // If it's a persisted variant, delete from DB
      if (variantId.match(/^[0-9a-f-]{36}$/i)) {
        await deleteVariant(variantId);
      }
      setVariants(prev => prev.filter(v => v.id !== variantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete variant');
    }
  }, []);

  // Save content and close
  const saveAndClose = useCallback(async (updates: Partial<CampaignContentRecord>) => {
    if (!contentRecord) return;
    setIsSaving(true);
    setError(null);

    try {
      const updatedRecord = { ...contentRecord, ...updates, updatedAt: new Date() };

      // Check if this is a new record (local ID) or existing (UUID)
      const isNew = contentRecord.id.startsWith('local_');

      if (isNew) {
        // Create new record
        const { id: _id, createdAt: _c, updatedAt: _u, ...saveData } = updatedRecord;
        const saved = await saveContent(saveData);

        if (saved && variants.length > 0) {
          // Upload variant media and save records
          const variantsToSave = variants.map(v => ({
            ...v,
            contentId: saved.id,
          }));
          await saveVariantsBatch(variantsToSave);
        }
      } else {
        // Update existing
        await updateContent(contentRecord.id, updates);
      }

      closeEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setIsSaving(false);
    }
  }, [contentRecord, variants, closeEditor]);

  // Schedule content
  const scheduleContent = useCallback(async (
    scheduledFor: Date,
    platformOverrides?: Record<string, Date>
  ) => {
    if (!contentRecord) return;

    const updates: Partial<CampaignContentRecord> = {
      primaryScheduledFor: scheduledFor,
      status: 'scheduled',
    };

    // Update variants with platform-specific schedules
    if (platformOverrides) {
      for (const variant of variants) {
        const override = platformOverrides[variant.platform];
        if (override && variant.id) {
          await updateVariantRecord(variant.id, { scheduledFor: override });
        }
      }
    }

    await saveAndClose(updates);
  }, [contentRecord, variants, saveAndClose, updateVariantRecord]);

  return {
    isOpen,
    selectedContent,
    contentRecord,
    variants,
    presets,
    isLoading,
    isSaving,
    isGeneratingVariants,
    error,
    openEditor,
    closeEditor,
    uploadSourceMedia,
    generatePlatformVariants,
    updateVariantRecord,
    removeVariant,
    saveAndClose,
    scheduleContent,
  };
}
