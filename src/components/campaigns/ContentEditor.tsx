import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Upload,
  Image,
  Calendar,
  Check,
  Clock,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Video,
  Hash,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { CampaignContentItem, PlatformType, ContentItemStatus } from '@/types/campaign';
import type { CampaignContentRecord, ContentVariantRecord } from '@/services/contentStorage';
import {
  PLATFORM_CHAR_LIMITS,
  createVariantRecord,
  getPrimaryDimensions,
} from '@/services/contentStorage';

/**
 * Props for the ContentEditor modal
 */
interface ContentEditorProps {
  content: CampaignContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: CampaignContentRecord, variants: ContentVariantRecord[]) => Promise<void>;
  campaignId: string;
}

/**
 * Platform configuration with icons and colors
 */
const platformConfig: Record<PlatformType, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  label: string;
}> = {
  instagram: { icon: Instagram, color: 'text-pink-500', bgColor: 'bg-gradient-to-br from-purple-500 to-pink-500', label: 'Instagram' },
  twitter: { icon: Twitter, color: 'text-blue-400', bgColor: 'bg-blue-400', label: 'Twitter/X' },
  linkedin: { icon: Linkedin, color: 'text-blue-700', bgColor: 'bg-blue-700', label: 'LinkedIn' },
  facebook: { icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-600', label: 'Facebook' },
  tiktok: { icon: Video, color: 'text-black', bgColor: 'bg-black', label: 'TikTok' },
  email: { icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-600', label: 'Email' },
  website: { icon: Image, color: 'text-gray-600', bgColor: 'bg-gray-600', label: 'Website' },
  newsletter: { icon: Calendar, color: 'text-indigo-600', bgColor: 'bg-indigo-600', label: 'Newsletter' },
};

/**
 * Status badge configuration
 */
const statusConfig: Record<ContentItemStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  ready: { label: 'Ready', color: 'bg-blue-100 text-blue-700' },
  scheduled: { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-700' },
  published: { label: 'Published', color: 'bg-green-100 text-green-700' },
};

/**
 * Focus trap hook for modal accessibility
 */
function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return;
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return containerRef;
}

/**
 * ContentEditor Modal Component
 * Main modal for editing campaign content items with media upload and platform variants
 */
export function ContentEditor({
  content,
  isOpen,
  onClose,
  onSave,
  campaignId,
}: ContentEditorProps) {
  // State
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [primaryPlatform, setPrimaryPlatform] = useState<PlatformType>('instagram');
  const [primarySchedule, setPrimarySchedule] = useState<string>('');
  const [variants, setVariants] = useState<ContentVariantRecord[]>([]);
  const [expandedVariants, setExpandedVariants] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const focusTrapRef = useFocusTrap(isOpen);

  // Available platforms for variants
  const availablePlatforms: PlatformType[] = ['instagram', 'twitter', 'linkedin', 'facebook', 'tiktok'];

  // Initialize form from content
  useEffect(() => {
    if (content && isOpen) {
      setTitle(content.title || '');
      setCaption(Array.isArray(content.content) ? content.content.join('\n') : content.content || '');
      setHashtags(content.hashtags || []);
      setPrimaryPlatform(content.platform === 'all' || content.platform === 'internal' ? 'instagram' : content.platform);
      setPrimarySchedule(content.scheduledFor ? new Date(content.scheduledFor).toISOString().slice(0, 16) : '');

      // Initialize variants for each platform
      const initialVariants = availablePlatforms.map(platform =>
        createVariantRecord(
          content.id,
          platform,
          Array.isArray(content.content) ? content.content.join('\n') : content.content || '',
          content.hashtags || []
        )
      );
      setVariants(initialVariants);
    } else if (isOpen) {
      // Reset form for new content
      setTitle('');
      setCaption('');
      setHashtags([]);
      setMediaUrl(null);
      setPrimaryPlatform('instagram');
      setPrimarySchedule('');
      setVariants(availablePlatforms.map(platform =>
        createVariantRecord(`new_${Date.now()}`, platform, '', [])
      ));
    }
  }, [content, isOpen]);

  // Handle escape key
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [handleEscapeKey]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Character count for current platform
  const charLimit = PLATFORM_CHAR_LIMITS[primaryPlatform] || 2200;
  const charCount = caption.length;
  const isOverLimit = charCount > charLimit;

  // Handle file upload
  const handleFileUpload = (file: File) => {
    setError(null);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Please upload an image or video file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setMediaUrl(url);
      setMediaType(isImage ? 'image' : 'video');

      // Get dimensions for images
      if (isImage) {
        const img = new window.Image();
        img.onload = () => {
          setOriginalDimensions({ width: img.width, height: img.height });
        };
        img.src = url;
      } else {
        // For videos, we'd need to use video element to get dimensions
        setOriginalDimensions({ width: 1080, height: 1920 }); // Default video dimensions
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Add hashtag
  const addHashtag = () => {
    const tag = newHashtag.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setNewHashtag('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHashtag();
    }
  };

  // Toggle variant selection
  const toggleVariantSelection = (platform: PlatformType) => {
    setVariants(variants.map(v =>
      v.platform === platform ? { ...v, isSelected: !v.isSelected } : v
    ));
  };

  // Update variant schedule
  const updateVariantSchedule = (platform: PlatformType, dateStr: string) => {
    setVariants(variants.map(v =>
      v.platform === platform ? { ...v, scheduledFor: dateStr ? new Date(dateStr) : undefined } : v
    ));
  };

  // Generate variants (placeholder for AI generation)
  const handleGenerateVariants = () => {
    // This would integrate with an AI service to generate platform-specific variants
    console.log('Generating variants for media...');
  };

  // Save handler
  const handleSave = async (scheduleNow: boolean = false) => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const contentRecord: CampaignContentRecord = {
        id: content?.id || `content_${Date.now()}`,
        campaignId,
        title: title.trim(),
        type: content?.type || 'social',
        primaryPlatform,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? mediaType : undefined,
        originalWidth: originalDimensions?.width,
        originalHeight: originalDimensions?.height,
        caption,
        hashtags,
        primaryScheduledFor: scheduleNow && primarySchedule ? new Date(primarySchedule) : undefined,
        status: scheduleNow ? 'scheduled' : 'draft',
        metadata: content?.metadata,
        assignedAgent: content?.assignedAgent,
        createdAt: content ? new Date() : new Date(),
        updatedAt: new Date(),
      };

      const selectedVariants = variants
        .filter(v => v.isSelected)
        .map(v => ({
          ...v,
          caption,
          hashtags,
          mediaUrl: mediaUrl || undefined,
          status: (scheduleNow ? 'scheduled' : 'draft') as ContentItemStatus,
          updatedAt: new Date(),
        }));

      await onSave(contentRecord, selectedVariants);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  // Selected variants count
  const selectedVariantsCount = useMemo(() =>
    variants.filter(v => v.isSelected).length
  , [variants]);

  if (!isOpen) return null;

  const PlatformIcon = platformConfig[primaryPlatform]?.icon || Image;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-editor-title"
    >
      <div
        ref={focusTrapRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blkout-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${platformConfig[primaryPlatform]?.bgColor || 'bg-gray-500'} rounded-lg flex items-center justify-center text-white`}>
              <PlatformIcon size={24} />
            </div>
            <div>
              <h2 id="content-editor-title" className="text-xl font-semibold text-gray-900">
                {content ? 'Edit Content' : 'New Content'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[content?.status || 'draft'].color}`}>
                  {statusConfig[content?.status || 'draft'].label}
                </span>
                <span className="text-sm text-gray-500">
                  {platformConfig[primaryPlatform]?.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blkout-500"
            aria-label="Close editor"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title Input */}
            <div>
              <label htmlFor="content-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="content-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter content title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent"
              />
            </div>

            {/* Media Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media
              </label>

              {mediaUrl ? (
                <div className="space-y-3">
                  {/* Preview */}
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    {mediaType === 'image' ? (
                      <img
                        src={mediaUrl}
                        alt="Upload preview"
                        className="max-h-64 mx-auto object-contain"
                      />
                    ) : (
                      <video
                        src={mediaUrl}
                        controls
                        className="max-h-64 mx-auto"
                      />
                    )}
                    <button
                      onClick={() => setMediaUrl(null)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm"
                      aria-label="Remove media"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>

                  {/* Dimensions info */}
                  {originalDimensions && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        Source: {originalDimensions.width} x {originalDimensions.height}px
                      </span>
                      <button
                        onClick={handleGenerateVariants}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        <Sparkles size={14} />
                        Generate Variants
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? 'border-blkout-500 bg-blkout-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload media file"
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <Upload size={40} className={`mx-auto mb-3 ${isDragging ? 'text-blkout-500' : 'text-gray-400'}`} />
                  <p className="text-gray-600 font-medium">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Supports images and videos
                  </p>
                </div>
              )}
            </div>

            {/* Caption Editor */}
            <div>
              <label htmlFor="content-caption" className="block text-sm font-medium text-gray-700 mb-1">
                Caption
              </label>
              <textarea
                id="content-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption..."
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent resize-none ${
                  isOverLimit ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${isOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {charCount.toLocaleString()} / {charLimit.toLocaleString()} characters
                  {isOverLimit && ' (over limit)'}
                </span>
                <span className="text-xs text-gray-400">
                  {primaryPlatform === 'twitter' ? 'Threads will be auto-split' : ''}
                </span>
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blkout-100 text-blkout-700 rounded-full text-sm"
                  >
                    <Hash size={12} />
                    {tag}
                    <button
                      onClick={() => removeHashtag(tag)}
                      className="ml-1 hover:text-blkout-900"
                      aria-label={`Remove hashtag ${tag}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyDown={handleHashtagKeyDown}
                  placeholder="Add hashtag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={addHashtag}
                  disabled={!newHashtag.trim()}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Platform Variants Panel */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedVariants(!expandedVariants)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Platform Variants</span>
                  <span className="text-xs px-2 py-0.5 bg-blkout-100 text-blkout-700 rounded-full">
                    {selectedVariantsCount} selected
                  </span>
                </div>
                {expandedVariants ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {expandedVariants && (
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {variants.map((variant) => {
                    const config = platformConfig[variant.platform];
                    const dimensions = getPrimaryDimensions(variant.platform);
                    const Icon = config?.icon || Image;

                    return (
                      <div
                        key={variant.platform}
                        className={`border rounded-lg p-3 transition-colors ${
                          variant.isSelected
                            ? 'border-blkout-300 bg-blkout-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={variant.isSelected}
                              onChange={() => toggleVariantSelection(variant.platform)}
                              className="rounded border-gray-300 text-blkout-600 focus:ring-blkout-500"
                            />
                            <div className={`w-6 h-6 ${config?.bgColor || 'bg-gray-500'} rounded flex items-center justify-center text-white`}>
                              <Icon size={14} />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {config?.label}
                            </span>
                          </label>
                          {variant.isSelected && (
                            <Check size={14} className="text-green-500" />
                          )}
                        </div>

                        {/* Thumbnail placeholder */}
                        <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400">
                          {mediaUrl ? (
                            <img
                              src={mediaUrl}
                              alt={`${variant.platform} preview`}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Image size={24} />
                          )}
                        </div>

                        {/* Dimensions */}
                        <p className="text-xs text-gray-500 mb-2">
                          {dimensions.width} x {dimensions.height} ({dimensions.aspectRatio})
                        </p>

                        {/* Individual schedule */}
                        {variant.isSelected && (
                          <input
                            type="datetime-local"
                            value={variant.scheduledFor ? new Date(variant.scheduledFor).toISOString().slice(0, 16) : ''}
                            onChange={(e) => updateVariantSchedule(variant.platform, e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blkout-500 focus:border-transparent"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Primary Scheduling Section */}
            <div>
              <label htmlFor="primary-schedule" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Schedule
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="primary-schedule"
                    type="datetime-local"
                    value={primarySchedule}
                    onChange={(e) => setPrimarySchedule(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-500 focus:border-transparent"
                  />
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={14} />
                  <span>or set per-platform above</span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {selectedVariantsCount > 0 && (
                <span>Publishing to {selectedVariantsCount} platform{selectedVariantsCount !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={isSaving || !title.trim()}
                className="px-4 py-2 border border-blkout-600 text-blkout-600 hover:bg-blkout-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving || !title.trim() || !primarySchedule}
                className="px-4 py-2 bg-blkout-600 text-white hover:bg-blkout-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Calendar size={16} />
                    Save & Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentEditor;
