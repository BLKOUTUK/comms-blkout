/**
 * Test Full Hyper-Real Approach
 * Both background AND character are photorealistic
 * Uses real AI-generated people on real backgrounds
 */

import { generateImage, downloadMediaToBuffer } from './services/wan-direct';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const BG_SOURCE = '/home/robbe/blkout-website/public/images/theory-backgrounds-resized/1.png';

async function testFullHyperReal() {
  console.log('📷 Testing Full Hyper-Real Approach\n');
  console.log('Both background AND character are photorealistic\n');

  try {
    const bgBuffer = readFileSync(BG_SOURCE);
    const base64Bg = bgBuffer.toString('base64');
    const bgDataUrl = `data:image/png;base64,${base64Bg}`;

    const fullRealPrompt = `Add photorealistic Black queer man to this photographic scene:

CRITICAL: EVERYTHING must be PHOTOREALISTIC - no cartoon, no animation, no illustration.

CHARACTER TO ADD:
Young Black queer man (early 20s), natural afro hairstyle, purple hoodie, blue jeans
- PHOTOREALISTIC portrait quality
- Natural skin tones, realistic hair texture
- Real fabric on clothing (hoodie, jeans)
- Natural lighting matching the scene
- Professional photography aesthetic
- Sitting or standing in foreground with arms crossed, looking downcast/contemplative
- Expression: Isolated despite being in a crowded space

COMPOSITION:
Photorealistic Black man composited into photographic museum/gallery scene
Natural integration - lighting, shadows, perspective all realistic
Professional portrait photography merged with documentary photography

Style: Pure photographic realism - like a professional photo composite, not AI art.
Think: Real person photographed and placed into real environment.`;

    console.log('🎨 Generating full hyper-realistic composite...');

    const imageUrl = await generateImage({
      prompt: fullRealPrompt,
      size: '1080*1350'
    });

    console.log(`✅ Generated: ${imageUrl}`);

    // Download
    const buffer = await downloadMediaToBuffer(imageUrl);
    const outputPath = join(process.cwd(), '../../../blkout-website/public/images/theory-of-change/test-full-hyperreal-card01.png');
    writeFileSync(outputPath, buffer);

    console.log(`📁 Saved: ${outputPath}`);
    console.log(`📊 Size: ${(buffer.length / 1024).toFixed(2)} KB\n`);

    console.log('✨ Full hyper-real test complete!');
    console.log('\nNOTE: This approach would require disclaimer:');
    console.log('"Images created with AI - representing diverse Black queer experiences"');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

testFullHyperReal()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
