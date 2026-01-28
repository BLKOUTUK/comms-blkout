// Image Resize Service
// Client-side image resizing using native Canvas API for social media platform variants

/**
 * Options for image resizing
 */
export interface ResizeOptions {
  /** How to fit the image: 'cover' crops to fill, 'contain' fits within bounds */
  fit: 'cover' | 'contain';
  /** Background color for 'contain' mode letterboxing (default: transparent) */
  background?: string;
  /** Quality for JPEG/WebP output, 0-1 (default: 0.92) */
  quality?: number;
  /** Output format (default: 'jpeg') */
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Platform preset configuration for image variants
 */
export interface PlatformPreset {
  /** Platform name (e.g., 'instagram', 'twitter') */
  platform: string;
  /** Variant type (e.g., 'post', 'story', 'profile') */
  variant_type: string;
  /** Target width in pixels */
  width: number;
  /** Target height in pixels */
  height: number;
  /** Aspect ratio string (e.g., '1:1', '16:9') */
  aspect_ratio: string;
  /** Human-readable description */
  description: string;
}

/**
 * Result from generating an image variant
 */
export interface VariantResult {
  /** The preset used to generate this variant */
  preset: PlatformPreset;
  /** The resized image as a Blob */
  blob: Blob;
  /** Data URL for preview */
  dataUrl: string;
  /** Final width in pixels */
  width: number;
  /** Final height in pixels */
  height: number;
}

/**
 * Error thrown when image operations fail
 */
export class ImageResizeError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ImageResizeError';
  }
}

/**
 * Default resize options
 */
const DEFAULT_OPTIONS: Required<ResizeOptions> = {
  fit: 'cover',
  background: 'transparent',
  quality: 0.92,
  format: 'jpeg',
};

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageResizeError(`Failed to load image: ${file.name}`));
    };

    img.src = url;
  });
}

/**
 * Get MIME type from format option
 */
function getMimeType(format: 'jpeg' | 'png' | 'webp'): string {
  const mimeTypes = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  return mimeTypes[format];
}

/**
 * Convert canvas to Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new ImageResizeError('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Calculate dimensions for 'cover' fit mode (crop to fill)
 */
function calculateCoverDimensions(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { sx: number; sy: number; sw: number; sh: number } {
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  let sw: number;
  let sh: number;
  let sx: number;
  let sy: number;

  if (srcRatio > targetRatio) {
    // Source is wider - crop horizontally
    sh = srcHeight;
    sw = srcHeight * targetRatio;
    sx = (srcWidth - sw) / 2;
    sy = 0;
  } else {
    // Source is taller - crop vertically
    sw = srcWidth;
    sh = srcWidth / targetRatio;
    sx = 0;
    sy = (srcHeight - sh) / 2;
  }

  return { sx, sy, sw, sh };
}

/**
 * Calculate dimensions for 'contain' fit mode (fit within, may letterbox)
 */
function calculateContainDimensions(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { dw: number; dh: number; dx: number; dy: number } {
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  let dw: number;
  let dh: number;
  let dx: number;
  let dy: number;

  if (srcRatio > targetRatio) {
    // Source is wider - fit to width
    dw = targetWidth;
    dh = targetWidth / srcRatio;
    dx = 0;
    dy = (targetHeight - dh) / 2;
  } else {
    // Source is taller - fit to height
    dh = targetHeight;
    dw = targetHeight * srcRatio;
    dx = (targetWidth - dw) / 2;
    dy = 0;
  }

  return { dw, dh, dx, dy };
}

/**
 * Resize an image to exact dimensions
 *
 * @param file - Source image file
 * @param width - Target width in pixels
 * @param height - Target height in pixels
 * @param options - Resize options (fit mode, quality, format)
 * @returns Resized image as a Blob
 *
 * @example
 * const resized = await resizeImage(file, 1080, 1080, { fit: 'cover' });
 */
export async function resizeImage(
  file: File,
  width: number,
  height: number,
  options?: Partial<ResizeOptions>
): Promise<Blob> {
  if (!file || !file.type.startsWith('image/')) {
    throw new ImageResizeError('Invalid file: must be an image');
  }

  if (width <= 0 || height <= 0) {
    throw new ImageResizeError('Invalid dimensions: width and height must be positive');
  }

  const opts: Required<ResizeOptions> = { ...DEFAULT_OPTIONS, ...options };

  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new ImageResizeError('Failed to get canvas context');
    }

    canvas.width = width;
    canvas.height = height;

    // Fill background for 'contain' mode or if specified
    if (opts.fit === 'contain' && opts.background !== 'transparent') {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, width, height);
    } else if (opts.format === 'jpeg' && opts.background !== 'transparent') {
      // JPEG doesn't support transparency, use white or specified background
      ctx.fillStyle = opts.background === 'transparent' ? '#ffffff' : opts.background;
      ctx.fillRect(0, 0, width, height);
    } else if (opts.format === 'jpeg') {
      // Default white background for JPEG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    if (opts.fit === 'cover') {
      // Crop to fill - center and crop
      const { sx, sy, sw, sh } = calculateCoverDimensions(img.width, img.height, width, height);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
    } else {
      // Contain - fit within bounds with letterboxing
      const { dx, dy, dw, dh } = calculateContainDimensions(img.width, img.height, width, height);
      ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
    }

    const mimeType = getMimeType(opts.format);
    return canvasToBlob(canvas, mimeType, opts.quality);
  } catch (error) {
    if (error instanceof ImageResizeError) {
      throw error;
    }
    throw new ImageResizeError(`Failed to resize image: ${(error as Error).message}`, error);
  }
}

/**
 * Generate multiple image variants from a single source
 *
 * @param file - Source image file
 * @param presets - Array of platform presets to generate
 * @returns Array of variant results (generated in parallel)
 *
 * @example
 * const variants = await generateVariants(file, [
 *   { platform: 'instagram', variant_type: 'post', width: 1080, height: 1080, aspect_ratio: '1:1', description: 'Square post' },
 *   { platform: 'instagram', variant_type: 'story', width: 1080, height: 1920, aspect_ratio: '9:16', description: 'Story' }
 * ]);
 */
export async function generateVariants(
  file: File,
  presets: PlatformPreset[]
): Promise<VariantResult[]> {
  if (!file || !file.type.startsWith('image/')) {
    throw new ImageResizeError('Invalid file: must be an image');
  }

  if (!presets || presets.length === 0) {
    throw new ImageResizeError('No presets provided');
  }

  try {
    // Generate all variants in parallel
    const variantPromises = presets.map(async (preset): Promise<VariantResult> => {
      const blob = await resizeImage(file, preset.width, preset.height, { fit: 'cover' });

      // Create data URL for preview
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new ImageResizeError('Failed to create data URL'));
        reader.readAsDataURL(blob);
      });

      return {
        preset,
        blob,
        dataUrl,
        width: preset.width,
        height: preset.height,
      };
    });

    return Promise.all(variantPromises);
  } catch (error) {
    if (error instanceof ImageResizeError) {
      throw error;
    }
    throw new ImageResizeError(`Failed to generate variants: ${(error as Error).message}`, error);
  }
}

/**
 * Get dimensions of an image file
 *
 * @param file - Image file to measure
 * @returns Object with width and height in pixels
 *
 * @example
 * const { width, height } = await getImageDimensions(file);
 * console.log(`Image is ${width}x${height}`);
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (!file || !file.type.startsWith('image/')) {
    throw new ImageResizeError('Invalid file: must be an image');
  }

  try {
    const img = await loadImage(file);
    return { width: img.width, height: img.height };
  } catch (error) {
    if (error instanceof ImageResizeError) {
      throw error;
    }
    throw new ImageResizeError(`Failed to get image dimensions: ${(error as Error).message}`, error);
  }
}

/**
 * Create a square thumbnail from an image
 *
 * @param file - Source image file
 * @param maxSize - Maximum width/height of the thumbnail (default: 150)
 * @returns Thumbnail as a Blob
 *
 * @example
 * const thumbnail = await createThumbnail(file, 100);
 */
export async function createThumbnail(file: File, maxSize: number = 150): Promise<Blob> {
  if (!file || !file.type.startsWith('image/')) {
    throw new ImageResizeError('Invalid file: must be an image');
  }

  if (maxSize <= 0) {
    throw new ImageResizeError('Invalid size: maxSize must be positive');
  }

  return resizeImage(file, maxSize, maxSize, {
    fit: 'cover',
    format: 'jpeg',
    quality: 0.8,
  });
}

/**
 * Create a data URL from a Blob
 * Utility function for preview purposes
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImageResizeError('Failed to convert blob to data URL'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert a data URL to a Blob
 * Utility function for upload purposes
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  try {
    const response = await fetch(dataUrl);
    return response.blob();
  } catch (error) {
    throw new ImageResizeError(`Failed to convert data URL to blob: ${(error as Error).message}`, error);
  }
}

/**
 * Get a human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if a file is a valid image type
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  return validTypes.includes(file.type);
}

/**
 * Get recommended format based on use case
 */
export function getRecommendedFormat(
  hasTransparency: boolean,
  forWeb: boolean = true
): 'jpeg' | 'png' | 'webp' {
  if (hasTransparency) {
    return forWeb ? 'webp' : 'png';
  }
  return forWeb ? 'webp' : 'jpeg';
}
