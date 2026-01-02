/**
 * Theory of Change v2.0 - Hybrid Card Generator
 * Generates X-Men 97 animated Black queer heroes on real photographic backgrounds
 *
 * Production Spec: 4:5 portrait (1080x1350)
 * Style: Animated protagonists + real backgrounds
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const WAN_API_KEY = process.env.WAN_API_KEY;
const DASHSCOPE_BASE = 'https://dashscope-intl.aliyuncs.com/api/v1';

// Card definitions with prompts for diverse X-Men 97 heroes
const cardProductions = [
  {
    card: 1,
    bgFile: '1.png',
    filename: 'card-01-isolation.png',
    heroPrompt: `Add X-Men 97 animated character to this real photograph:

Character: Young Black queer man (early 20s), natural afro, stylish streetwear
- X-Men 97 style: BOLD BLACK OUTLINES, cel-shaded coloring
- Purple hoodie, blue jeans, sneakers
- Sitting alone with arms crossed, looking downcast
- Animated comic book aesthetic contrasts with real photo background
- Position: Foreground, isolated despite the crowd

Keep background photograph COMPLETELY REALISTIC - only the character is animated.`
  },
  {
    card: 2,
    bgFile: '10.png',
    filename: 'card-02-recognition.png',
    heroPrompt: `Add X-Men 97 animated character to this real photograph:

Character: Black queer man (mid-30s), short locs, casual button-up shirt
- X-Men 97 style: BOLD BLACK OUTLINES, cel-shaded dramatic lighting
- Deep purple shirt, gold accent on watch/jewelry
- Expression: Quiet acknowledgment, "I see you" energy
- Seated or standing in contemplative pose
- Animated style contrasts with realistic bedroom setting

Keep background photograph realistic.`
  },
  {
    card: 3,
    bgFile: '3.png',
    filename: 'card-03-wondering.png',
    heroPrompt: `Add X-Men 97 animated character to this real photograph:

Character: Black queer man (late 20s), high-top fade, fitted turtleneck
- X-Men 97 style: BOLD BLACK OUTLINES, cel-shaded
- Violet turtleneck, contemplative expression
- Standing slightly apart from the crowd, observing
- Wondering, searching energy
- Position: Edge of the gathering, looking in

Keep crowd and space realistic - only central character is animated.`
  }
  // Add remaining cards...
];

async function generateHybridCard(card: typeof cardProductions[0]): Promise<void> {
  try {
    console.log(`\n🎨 Card ${card.card}: Generating hybrid card...`);

    // Read background image
    const bgPath = join(process.cwd(), `../../../blkout-website/public/images/theory-backgrounds/${card.bgFile}`);
    const bgBuffer = readFileSync(bgPath);
    const base64Bg = bgBuffer.toString('base64');
    const bgDataUrl = `data:image/png;base64,${base64Bg}`;

    // Generate hybrid composition
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
          messages: [{
            role: 'user',
            content: [
              { text: card.heroPrompt },
              { image: bgDataUrl }
            ]
          }]
        },
        parameters: {
          size: '1080*1350', // 4:5 portrait
          n: 1,
          prompt_extend: false,
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

    if (!taskId) {
      console.log('Response:', JSON.stringify(data, null, 2));
      throw new Error('No task_id in response');
    }

    console.log(`⏳ Task ${taskId} - Polling...`);

    // Poll for result
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const pollResp = await fetch(`${DASHSCOPE_BASE}/tasks/${taskId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${WAN_API_KEY}` }
      });

      const pollData = await pollResp.json();

      if (pollData.output?.task_status === 'SUCCEEDED') {
        const content = pollData.output?.choices?.[0]?.message?.content || [];
        const images = content.filter((item: any) => item.type === 'image');

        const imageUrl = images[0]?.image;

        // Download
        const imgResp = await fetch(imageUrl);
        const imgBuffer = Buffer.from(await imgResp.arrayBuffer());

        const outputPath = join(process.cwd(), '../../../blkout-website/public/images/theory-of-change/', card.filename);
        writeFileSync(outputPath, imgBuffer);

        console.log(`✅ Card ${card.card} complete: ${(imgBuffer.length / 1024).toFixed(2)} KB`);
        return;
      } else if (pollData.output?.task_status === 'FAILED') {
        throw new Error(`Task failed: ${pollData.output?.message}`);
      }

      if (i % 5 === 0) console.log(`⏳ ${pollData.output?.task_status}...`);
    }

    throw new Error('Timeout');
  } catch (error: any) {
    console.error(`❌ Card ${card.card} failed:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🎬 Theory of Change v2.0 - Hybrid Card Production');
  console.log(`📊 Generating ${cardProductions.length} cards\n`);

  for (const card of cardProductions) {
    await generateHybridCard(card);
    console.log('⏳ Waiting 3s before next card...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n✨ Batch complete!');
}

main().catch(console.error);
