/**
 * Test Wan 2.6 - Animated Character on Real Background
 * Uses real photo as reference, adds X-Men 97 cel-shaded Black queer character
 */

import { downloadMediaToBuffer } from './services/wan-direct';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const WAN_API_KEY = process.env.WAN_API_KEY;
const DASHSCOPE_BASE = 'https://dashscope-intl.aliyuncs.com/api/v1';

// First, upload the real background photo to get a URL
const REAL_BACKGROUND_PATH = '/home/robbe/blkout-website/public/images/collective-png/tumblr_a8ff21cfe9302e86a3d03892c864c5a5_391b148a_1280.png';

const hybridPrompt = `REFERENCE IMAGE EDITING - Add animated character to real photograph:

KEEP THE BACKGROUND PHOTO EXACTLY AS IS (realistic, unmodified).

ADD TO THE SCENE:
- One Black queer man standing/sitting in the foreground
- He should be rendered in X-Men 97 animation style:
  * BOLD BLACK OUTLINES around his entire figure
  * Cel-shaded coloring (vibrant purple jacket, blue shirt)
  * Dramatic lighting with strong contrast
  * Heroic pose (arms crossed, confident stance)
  * Animated comic book aesthetic
  * Natural hair (afro, locs, or fade)
  * Age: 25-35 years old

CRITICAL: The animated character should be composited INTO the real photograph, maintaining the photo's realistic lighting and perspective while the character has bold cartoon styling.

Visual effect: Animated hero existing in a real photographic world.

Do NOT change or stylize the background - keep it photorealistic.`;

async function generateWithRealBackground() {
  try {
    console.log('🧪 Testing Wan 2.6 - Real Background + Animated Character\n');
    console.log(`📷 Using real photo: ${REAL_BACKGROUND_PATH}\n`);

    // Read the background image as base64
    const imageBuffer = readFileSync(REAL_BACKGROUND_PATH);
    const base64Image = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/png;base64,${base64Image}`;

    console.log('🎨 Generating with Wan 2.6 (image reference mode)...');

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
                  text: hybridPrompt
                },
                {
                  image: imageDataUrl
                }
              ]
            }
          ]
        },
        parameters: {
          size: '1280*720',
          n: 1,
          prompt_extend: false, // Don't extend - follow instructions precisely
          watermark: false,
          enable_interleave: false // Image editing mode
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const taskId = data.output?.task_id;

    console.log(`⏳ Task ${taskId} - Polling for completion...`);

    // Poll for result
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const pollResponse = await fetch(`${DASHSCOPE_BASE}/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WAN_API_KEY}`
        }
      });

      const pollData = await pollResponse.json();

      if (pollData.output?.task_status === 'SUCCEEDED') {
        const content = pollData.output?.choices?.[0]?.message?.content || [];
        const images = content.filter((item: any) => item.type === 'image');

        if (images.length === 0) {
          throw new Error('No images in result');
        }

        const imageUrl = images[0].image;
        console.log(`✅ Image generated: ${imageUrl}`);

        // Download and save
        const buffer = await downloadMediaToBuffer(imageUrl);
        const outputPath = join(process.cwd(), '../../../blkout-website/public/images/theory-of-change/hybrid-real-bg-test.png');
        writeFileSync(outputPath, buffer);

        console.log(`\n📁 Saved to: ${outputPath}`);
        console.log(`📊 Size: ${(buffer.length / 1024).toFixed(2)} KB`);
        console.log('\n✨ Hybrid approach test complete!');
        console.log('RESULT: Animated X-Men 97 character composited onto REAL photograph background.');

        return imageUrl;
      } else if (pollData.output?.task_status === 'FAILED') {
        throw new Error(`Task failed: ${pollData.output?.message}`);
      }

      console.log(`⏳ Status: ${pollData.output?.task_status} (${i + 1}/60)`);
    }

    throw new Error('Timeout');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

generateWithRealBackground()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
