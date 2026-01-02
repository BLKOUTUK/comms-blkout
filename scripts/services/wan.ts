/**
 * Wan 2.6 API Service via fal.ai
 * Unified image and video generation for Theory of Change
 */

import * as fal from "@fal-ai/client";

// Configure fal.ai client
const FAL_KEY = process.env.FAL_KEY || process.env.VITE_FAL_KEY;

if (!FAL_KEY) {
  throw new Error('FAL_KEY not found in environment. Get one from https://fal.ai/dashboard/keys');
}

fal.config({
  credentials: FAL_KEY
});

export interface WanImageGenerationOptions {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  imageSize?: '512x512' | '1024x1024' | '1920x1080';
}

export interface WanVideoGenerationOptions {
  prompt: string;
  imageUrl?: string; // For image-to-video
  duration?: '5' | '10' | '15'; // seconds
  resolution?: '720p' | '1080p';
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

/**
 * Generate image using Wan 2.6 text-to-image
 */
export async function generateImage(options: WanImageGenerationOptions): Promise<string> {
  try {
    console.log('🎨 Generating image with Wan 2.6...');

    const result = await fal.subscribe("wan/v2.6/text-to-image", {
      arguments: {
        prompt: options.prompt,
        aspect_ratio: options.aspectRatio || '16:9',
        image_size: options.imageSize || '1920x1080'
      }
    });

    // Return image URL or base64
    if (result.images && result.images[0]) {
      return result.images[0].url;
    }

    throw new Error('No image generated');
  } catch (error: any) {
    console.error('❌ Wan image generation failed:', error.message);
    throw error;
  }
}

/**
 * Generate video using Wan 2.6 text-to-video or image-to-video
 */
export async function generateVideo(options: WanVideoGenerationOptions): Promise<string> {
  try {
    const endpoint = options.imageUrl
      ? "wan/v2.6/image-to-video"
      : "wan/v2.6/text-to-video";

    console.log(`🎬 Generating video with Wan 2.6 (${endpoint})...`);

    const result = await fal.subscribe(endpoint, {
      arguments: {
        prompt: options.prompt,
        ...(options.imageUrl && { image_url: options.imageUrl }),
        duration: options.duration || '10',
        resolution: options.resolution || '1080p',
        aspect_ratio: options.aspectRatio || '16:9'
      }
    });

    // Return video URL
    if (result.video && result.video.url) {
      return result.video.url;
    }

    throw new Error('No video generated');
  } catch (error: any) {
    console.error('❌ Wan video generation failed:', error.message);
    throw error;
  }
}

/**
 * Download image/video from URL to buffer
 */
export async function downloadMediaToBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
