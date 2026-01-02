/**
 * Wan 2.6 API Service via Alibaba DashScope
 * Unified image and video generation for Theory of Change
 */

const WAN_API_KEY = process.env.WAN_API_KEY;
// Use international endpoint for global access
const DASHSCOPE_BASE = 'https://dashscope-intl.aliyuncs.com/api/v1';

if (!WAN_API_KEY) {
  throw new Error('WAN_API_KEY not found in environment');
}

export interface WanImageOptions {
  prompt: string;
  size?: '1024*1024' | '720*1280' | '1280*720';
  n?: number; // number of images
}

export interface WanVideoOptions {
  prompt: string;
  imageUrl: string; // Required for I2V
  duration?: number;
}

/**
 * Generate image using Wan 2.6 via DashScope
 */
export async function generateImage(options: WanImageOptions): Promise<string> {
  try {
    console.log('🎨 Generating image with Wan 2.6 (DashScope)...');

    const response = await fetch(`${DASHSCOPE_BASE}/services/aigc/image-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAN_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: 'wan2.6-image',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                {
                  text: options.prompt
                }
              ]
            }
          ]
        },
        parameters: {
          size: options.size || '1280*720',
          n: options.n || 1,
          prompt_extend: true,
          watermark: false,
          enable_interleave: true // Enable text-to-image generation
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DashScope API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const taskId = data.output?.task_id;

    if (!taskId) {
      throw new Error('No task_id returned from DashScope');
    }

    console.log(`⏳ Task ${taskId} - Polling for completion...`);
    const result = await pollTaskResult(taskId);

    return result;
  } catch (error: any) {
    console.error('❌ Wan image generation failed:', error.message);
    throw error;
  }
}

/**
 * Generate video using Wan 2.6 image-to-video via DashScope
 */
export async function generateVideo(options: WanVideoOptions): Promise<string> {
  try {
    console.log('🎬 Generating video with Wan 2.6 I2V (DashScope)...');

    const response = await fetch(`${DASHSCOPE_BASE}/services/aigc/video-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAN_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model: 'wan-2.6-i2v',
        input: {
          image_url: options.imageUrl,
          text: options.prompt
        },
        parameters: {
          duration: options.duration || 10
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DashScope API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const taskId = data.output?.task_id;

    if (!taskId) {
      throw new Error('No task_id returned');
    }

    console.log(`⏳ Task ${taskId} - Polling for video completion...`);
    const result = await pollTaskResult(taskId);

    return result;
  } catch (error: any) {
    console.error('❌ Wan video generation failed:', error.message);
    throw error;
  }
}

/**
 * Poll DashScope task result
 */
async function pollTaskResult(taskId: string, maxAttempts = 60): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s

    const response = await fetch(`${DASHSCOPE_BASE}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WAN_API_KEY}`
      }
    });

    const data = await response.json();

    if (data.output?.task_status === 'SUCCEEDED') {
      // Extract image URLs from DashScope response
      const content = data.output?.choices?.[0]?.message?.content || [];
      const images = content.filter((item: any) => item.type === 'image');

      if (images.length === 0) {
        console.log('Full response:', JSON.stringify(data, null, 2));
        throw new Error('No images found in completed task result');
      }

      // Return first image URL (or all URLs if needed)
      return images[0].image;
    } else if (data.output?.task_status === 'FAILED') {
      throw new Error(`Task failed: ${data.output?.message || 'Unknown error'}`);
    }

    console.log(`⏳ Status: ${data.output?.task_status} (${i + 1}/${maxAttempts})`);
  }

  throw new Error('Task timeout - max polling attempts reached');
}

/**
 * Download media from URL to buffer
 */
export async function downloadMediaToBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
