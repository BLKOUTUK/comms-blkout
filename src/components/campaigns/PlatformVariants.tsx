/**
 * PlatformVariants Component
 *
 * Displays and manages platform-specific variants of content items.
 * Features: variant grid, preview modal, batch actions, per-variant controls.
 */

import React, { useState, useCallback } from 'react';
import {
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Music,
  Download,
  RefreshCw,
  Trash2,
  X,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Video,
  Calendar,
  ChevronDown,
  CheckSquare,
  Square,
  Package,
} from 'lucide-react';

// Types
export interface ContentVariantRecord {
  id: string;
  contentId: string;
  presetId: string;
  platform: 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'facebook';
  variantType: string;
  width: number;
  height: number;
  status: 'pending' | 'generating' | 'ready' | 'failed';
  outputUrl?: string;
  thumbnailUrl?: string;
  scheduledFor?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformPreset {
  id: string;
  platform: 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'facebook';
  name: string;
  variantType: string;
  width: number;
  height: number;
  description?: string;
}

interface PlatformVariantsProps {
  contentId: string;
  sourceMedia: {
    url: string;
    type: 'image' | 'video';
    width: number;
    height: number;
  } | null;
  variants: ContentVariantRecord[];
  presets: PlatformPreset[];
  onGenerateVariants: (presetIds: string[]) => Promise<void>;
  onUpdateVariant: (variantId: string, updates: Partial<ContentVariantRecord>) => Promise<void>;
  onDeleteVariant: (variantId: string) => Promise<void>;
  isGenerating: boolean;
}

// Platform icon mapping
const PlatformIcon: React.FC<{ platform: string; size?: number; className?: string }> = ({
  platform,
  size = 20,
  className = '',
}) => {
  switch (platform) {
    case 'instagram':
      return <Instagram size={size} className={className} />;
    case 'linkedin':
      return <Linkedin size={size} className={className} />;
    case 'twitter':
      return <Twitter size={size} className={className} />;
    case 'facebook':
      return <Facebook size={size} className={className} />;
    case 'tiktok':
      // Custom TikTok SVG icon
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      );
    default:
      return <Music size={size} className={className} />;
  }
};

// Platform color mapping
const platformColors: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  linkedin: 'bg-blue-600',
  twitter: 'bg-sky-500',
  tiktok: 'bg-black',
  facebook: 'bg-blue-700',
};

const platformBorderColors: Record<string, string> = {
  instagram: 'border-pink-500',
  linkedin: 'border-blue-600',
  twitter: 'border-sky-500',
  tiktok: 'border-gray-800',
  facebook: 'border-blue-700',
};

// Status badge component
const StatusBadge: React.FC<{ status: ContentVariantRecord['status'] }> = ({ status }) => {
  const statusConfig: Record<
    ContentVariantRecord['status'],
    { bg: string; text: string; icon: React.ReactNode; label: string; pulse?: boolean }
  > = {
    pending: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      icon: <Clock size={12} />,
      label: 'Pending',
    },
    generating: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      icon: <Loader2 size={12} className="animate-spin" />,
      label: 'Generating',
      pulse: true,
    },
    ready: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: <Check size={12} />,
      label: 'Ready',
    },
    failed: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: <AlertCircle size={12} />,
      label: 'Failed',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${'pulse' in config && config.pulse ? 'animate-pulse' : ''}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

// Preview Modal Component
const PreviewModal: React.FC<{
  variant: ContentVariantRecord;
  preset?: PlatformPreset;
  onClose: () => void;
  onRegenerate: () => void;
  onDownload: () => void;
  isRegenerating: boolean;
}> = ({ variant, preset, onClose, onRegenerate, onDownload, isRegenerating }) => {
  return (
    <div className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${platformColors[variant.platform]}`}>
              <PlatformIcon platform={variant.platform} size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {variant.platform} {variant.variantType}
              </h3>
              <p className="text-sm text-gray-500">
                {variant.width} x {variant.height}px
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-180px)]">
          <div className="flex justify-center">
            {variant.status === 'ready' && variant.outputUrl ? (
              <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={variant.outputUrl}
                  alt={`${variant.platform} ${variant.variantType}`}
                  className="max-w-full h-auto"
                  style={{ maxHeight: '60vh' }}
                />
              </div>
            ) : variant.status === 'generating' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 size={48} className="animate-spin text-blkout-500 mb-4" />
                <p className="text-gray-600">Generating variant...</p>
              </div>
            ) : variant.status === 'failed' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <p className="text-red-600 font-medium mb-2">Generation Failed</p>
                {variant.error && (
                  <p className="text-sm text-gray-500 max-w-md">{variant.error}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ImageIcon size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">No preview available</p>
              </div>
            )}
          </div>

          {/* Preset Info */}
          {preset && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preset Details</h4>
              <p className="text-sm text-gray-600">{preset.description || preset.name}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <StatusBadge status={variant.status} />
          <div className="flex items-center gap-3">
            <button
              onClick={onRegenerate}
              disabled={isRegenerating || variant.status === 'generating'}
              className="btn btn-outline inline-flex items-center gap-2"
            >
              {isRegenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Regenerate
            </button>
            <button
              onClick={onDownload}
              disabled={variant.status !== 'ready' || !variant.outputUrl}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Schedule Override Picker Component
const ScheduleOverridePicker: React.FC<{
  value?: Date;
  onChange: (date: Date | undefined) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Calendar size={12} />
        {value ? formatDate(value) : 'Set schedule'}
        <ChevronDown size={12} />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-dropdown bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
          <input
            type="datetime-local"
            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blkout-500"
            value={value ? value.toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              if (e.target.value) {
                onChange(new Date(e.target.value));
              } else {
                onChange(undefined);
              }
              setIsOpen(false);
            }}
          />
          {value && (
            <button
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
              }}
              className="mt-2 text-xs text-red-500 hover:text-red-700"
            >
              Clear override
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Main Component
export const PlatformVariants: React.FC<PlatformVariantsProps> = ({
  contentId: _contentId,
  sourceMedia,
  variants,
  presets,
  onGenerateVariants,
  onUpdateVariant,
  onDeleteVariant,
  isGenerating,
}) => {
  // Note: _contentId is available for future API calls if needed
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [previewVariant, setPreviewVariant] = useState<ContentVariantRecord | null>(null);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  // Get preset for a variant
  const getPresetForVariant = useCallback(
    (variant: ContentVariantRecord) => {
      return presets.find((p) => p.id === variant.presetId);
    },
    [presets]
  );

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedVariants.size === variants.length) {
      setSelectedVariants(new Set());
    } else {
      setSelectedVariants(new Set(variants.map((v) => v.id)));
    }
  };

  const toggleSelectVariant = (variantId: string) => {
    const newSelection = new Set(selectedVariants);
    if (newSelection.has(variantId)) {
      newSelection.delete(variantId);
    } else {
      newSelection.add(variantId);
    }
    setSelectedVariants(newSelection);
  };

  // Batch actions
  const handleGenerateSelected = async () => {
    const selectedPresetIds = variants
      .filter((v) => selectedVariants.has(v.id) && v.status !== 'generating')
      .map((v) => v.presetId);
    if (selectedPresetIds.length > 0) {
      await onGenerateVariants(selectedPresetIds);
    }
  };

  const handleDownloadAll = async () => {
    const readyVariants = variants.filter(
      (v) => (selectedVariants.size === 0 || selectedVariants.has(v.id)) && v.status === 'ready' && v.outputUrl
    );

    // Download each file individually
    for (const variant of readyVariants) {
      if (variant.outputUrl) {
        const link = document.createElement('a');
        link.href = variant.outputUrl;
        link.download = `${variant.platform}-${variant.variantType}-${variant.width}x${variant.height}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  };

  // Per-variant actions
  const handleRegenerate = async (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;

    setRegeneratingIds((prev) => new Set(prev).add(variantId));
    try {
      await onGenerateVariants([variant.presetId]);
    } finally {
      setRegeneratingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(variantId);
        return newSet;
      });
    }
  };

  const handleScheduleChange = async (variantId: string, date: Date | undefined) => {
    await onUpdateVariant(variantId, { scheduledFor: date });
  };

  const handleDownloadSingle = (variant: ContentVariantRecord) => {
    if (variant.outputUrl) {
      const link = document.createElement('a');
      link.href = variant.outputUrl;
      link.download = `${variant.platform}-${variant.variantType}-${variant.width}x${variant.height}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Group variants by platform
  const groupedVariants = variants.reduce(
    (acc, variant) => {
      if (!acc[variant.platform]) {
        acc[variant.platform] = [];
      }
      acc[variant.platform].push(variant);
      return acc;
    },
    {} as Record<string, ContentVariantRecord[]>
  );

  const readyCount = variants.filter((v) => v.status === 'ready').length;
  const selectedCount = selectedVariants.size;

  return (
    <div className="space-y-6">
      {/* Header with Batch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {selectedVariants.size === variants.length && variants.length > 0 ? (
              <CheckSquare size={18} className="text-blkout-600" />
            ) : (
              <Square size={18} />
            )}
            Select All
          </button>
          <span className="text-sm text-gray-400">
            {selectedCount > 0 ? `${selectedCount} selected` : `${variants.length} variants`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateSelected}
            disabled={isGenerating || selectedCount === 0}
            className="btn btn-primary btn-sm inline-flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Generate Selected
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={readyCount === 0}
            className="btn btn-outline btn-sm inline-flex items-center gap-2"
          >
            <Package size={14} />
            Download {selectedCount > 0 ? 'Selected' : 'All'}
          </button>
        </div>
      </div>

      {/* Source Media Preview */}
      {sourceMedia && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            {sourceMedia.type === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
            <span>Source Media ({sourceMedia.width} x {sourceMedia.height}px)</span>
          </div>
          <div className="flex justify-center">
            {sourceMedia.type === 'image' ? (
              <img
                src={sourceMedia.url}
                alt="Source media"
                className="max-h-48 rounded-lg shadow-sm object-contain"
              />
            ) : (
              <video
                src={sourceMedia.url}
                className="max-h-48 rounded-lg shadow-sm"
                controls
              />
            )}
          </div>
        </div>
      )}

      {/* Variants Grid */}
      {Object.keys(groupedVariants).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedVariants).map(([platform, platformVariants]) => (
            <div key={platform}>
              {/* Platform Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${platformColors[platform]}`}
                >
                  <PlatformIcon platform={platform} size={16} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{platform}</h3>
                <span className="text-sm text-gray-500">
                  {platformVariants.length} variant{platformVariants.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Variant Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {platformVariants.map((variant) => {
                  const preset = getPresetForVariant(variant);
                  const isSelected = selectedVariants.has(variant.id);
                  const isRegenerating = regeneratingIds.has(variant.id);

                  return (
                    <div
                      key={variant.id}
                      className={`relative bg-white rounded-lg border-2 transition-all hover:shadow-lg ${
                        isSelected
                          ? `${platformBorderColors[platform]} shadow-md`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleSelectVariant(variant.id)}
                        className="absolute top-3 left-3 z-10 p-1 bg-white rounded shadow-sm hover:shadow transition-shadow"
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-blkout-600" />
                        ) : (
                          <Square size={18} className="text-gray-400" />
                        )}
                      </button>

                      {/* Thumbnail / Preview Area */}
                      <div
                        onClick={() => setPreviewVariant(variant)}
                        className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden cursor-pointer relative group"
                      >
                        {variant.status === 'ready' && (variant.thumbnailUrl || variant.outputUrl) ? (
                          <>
                            <img
                              src={variant.thumbnailUrl || variant.outputUrl}
                              alt={`${platform} ${variant.variantType}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity">
                                Click to preview
                              </span>
                            </div>
                          </>
                        ) : variant.status === 'generating' ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-blkout-500" />
                          </div>
                        ) : variant.status === 'failed' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-red-500">
                            <AlertCircle size={32} />
                            <span className="text-xs mt-2">Failed</span>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon size={32} />
                            <span className="text-xs mt-2">Pending</span>
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-3">
                        {/* Variant Type & Dimensions */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {preset?.name || variant.variantType}
                          </span>
                          <StatusBadge status={variant.status} />
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          {variant.width} x {variant.height}px
                        </p>

                        {/* Schedule Override */}
                        <div className="mb-3">
                          <ScheduleOverridePicker
                            value={variant.scheduledFor}
                            onChange={(date) => handleScheduleChange(variant.id, date)}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRegenerate(variant.id)}
                            disabled={isRegenerating || variant.status === 'generating'}
                            className="flex-1 btn btn-outline btn-sm inline-flex items-center justify-center gap-1"
                            title="Regenerate"
                          >
                            {isRegenerating ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <RefreshCw size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownloadSingle(variant)}
                            disabled={variant.status !== 'ready'}
                            className="flex-1 btn btn-outline btn-sm inline-flex items-center justify-center gap-1"
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteVariant(variant.id)}
                            className="btn btn-outline btn-sm text-red-500 hover:text-red-700 hover:border-red-300"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No variants yet</h3>
          <p className="text-gray-500 mb-4">
            Generate platform-specific variants from your source media
          </p>
          {presets.length > 0 && (
            <button
              onClick={() => onGenerateVariants(presets.map((p) => p.id))}
              disabled={isGenerating || !sourceMedia}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Generate All Variants
            </button>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewVariant && (
        <PreviewModal
          variant={previewVariant}
          preset={getPresetForVariant(previewVariant)}
          onClose={() => setPreviewVariant(null)}
          onRegenerate={() => handleRegenerate(previewVariant.id)}
          onDownload={() => handleDownloadSingle(previewVariant)}
          isRegenerating={regeneratingIds.has(previewVariant.id)}
        />
      )}
    </div>
  );
};

export default PlatformVariants;
