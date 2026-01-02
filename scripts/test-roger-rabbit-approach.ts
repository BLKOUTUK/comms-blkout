/**
 * Test Roger Rabbit Approach
 * Step 1: Make background HYPER-realistic
 * Step 2: Add cartoon X-Men 97 hero on hyper-real background
 */

import { generateImage, downloadMediaToBuffer } from './services/wan-direct';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const BG_SOURCE = '/home/robbe/blkout-website/public/images/theory-backgrounds-resized/1.png';

async function testRogerRabbit() {
  console.log('🎬 Testing Roger Rabbit Approach\n');
  console.log('Step 1: Generate HYPER-REALISTIC background');
  console.log('Step 2: Add cartoon hero to hyper-real background\n');

  try {
    // STEP 1: Make background hyper-realistic
    console.log('📷 STEP 1: Creating hyper-realistic background...');

    const step1Prompt = `Transform this image into HYPER-REALISTIC photography:

CRITICAL: Make the background PHOTOGRAPHIC quality - not illustrated, not stylized, not cartoon.

Requirements:
- Photorealistic lighting and textures
- Natural skin tones and clothing on all people
- Realistic environment (museum/gallery space)
- Professional photography aesthetic
- High detail, sharp focus
- Cinematic color grading
- NO animation, NO cartoon elements, NO illustration style

Output: Pure photographic realism, as if shot with a professional camera.`;

    const bgBuffer = readFileSync(BG_SOURCE);
    const base64Bg = bgBuffer.toString('base64');

    const hyperRealBg = await generateImage({
      prompt: step1Prompt,
      size: '1080*1350'
    });

    console.log(`✅ Step 1 complete: Hyper-real background created`);

    // Download Step 1 result
    const step1Buffer = await downloadMediaToBuffer(hyperRealBg);
    const step1Path = join(process.cwd(), '../../../blkout-website/public/images/theory-of-change/test-step1-hyperreal-bg.png');
    writeFileSync(step1Path, step1Buffer);
    console.log(`📁 Saved: ${step1Path}\n`);

    // STEP 2: Add cartoon hero to hyper-real background
    console.log('🎨 STEP 2: Adding X-Men 97 cartoon hero to hyper-real background...');

    const step2Prompt = `Add CARTOON X-Men 97 animated character to this PHOTOGRAPHIC background:

CRITICAL INSTRUCTIONS:
- KEEP THE BACKGROUND EXACTLY AS IS (hyper-realistic, photographic, unmodified)
- ADD ONLY the cartoon character - do NOT stylize the background

CHARACTER TO ADD:
Young Black queer man (early 20s), natural afro, purple hoodie, blue jeans
- BOLD BLACK CARTOON OUTLINES (thick, cel-shaded)
- Vibrant cartoon coloring (saturated purple, blue)
- Dramatic cartoon lighting with strong shadows
- X-Men 97 animation aesthetic
- Sitting/standing in foreground, arms crossed, downcast eyes
- PURE CARTOON STYLE - think Who Framed Roger Rabbit

COMPOSITION:
Cartoon character composited INTO photographic scene
Roger Rabbit effect: Stark contrast between cartoon hero and real photograph
Background must remain completely photographic

Do NOT blend styles - maintain sharp distinction between cartoon character and real photo.`;

    const step1Base64 = step1Buffer.toString('base64');
    const step1DataUrl = `data:image/png;base64,${step1Base64}`;

    const finalImage = await generateImage({
      prompt: step2Prompt,
      size: '1080*1350'
    });

    console.log(`✅ Step 2 complete: Cartoon hero on hyper-real background`);

    // Download final result
    const finalBuffer = await downloadMediaToBuffer(finalImage);
    const finalPath = join(process.cwd(), '../../../blkout-website/public/images/theory-of-change/test-roger-rabbit-card01.png');
    writeFileSync(finalPath, finalBuffer);
    console.log(`📁 Saved: ${finalPath}`);
    console.log(`📊 Size: ${(finalBuffer.length / 1024).toFixed(2)} KB\n`);

    console.log('✨ Roger Rabbit test complete!');
    console.log('Review test-roger-rabbit-card01.png to see if this approach achieves the desired contrast.');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

testRogerRabbit()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
