/**
 * Test Wan 2.6 - Hybrid Style
 * X-Men 97 cel-shaded for Black queer protagonists
 * Realistic backgrounds and secondary characters
 */

import { generateImage, downloadMediaToBuffer } from './services/wan-direct';
import { writeFileSync } from 'fs';
import { join } from 'path';

const hybridStylePrompt = `HYBRID VISUAL STYLE - Mixing realistic and animated elements:

Scene: Black queer man sitting alone in a crowded modern lounge, feeling isolated despite being surrounded by community.

CRITICAL STYLE INSTRUCTIONS:

PRIMARY CHARACTER (Black queer man - central figure):
- X-Men 97 animation aesthetic with BOLD BLACK OUTLINES
- Cel-shaded coloring with dramatic lighting
- Vibrant, saturated purple and blue tones on his clothing
- Strong contrast between light and shadow on his face
- Heroic/expressive character design
- Animated, comic book style rendering

BACKGROUND & SECONDARY CHARACTERS (everyone/everything else):
- REALISTIC photography style
- Natural lighting and colors
- Photographic rendering for the lounge interior
- Other people in background rendered in realistic/semi-realistic style
- Real furniture, real environment textures
- Warm, natural tones (golds, warm browns)

Visual Composition:
- Central figure: Young Black man, natural hair, stylish outfit, sitting with arms crossed, eyes downcast
- He is rendered in X-Men 97 cel-shaded animation style (bold outlines, dramatic purple/blue lighting)
- Background lounge: Realistic modern space with contemporary furniture
- Other Black men socializing in background: Realistic or semi-realistic rendering (faded, slightly out of focus)
- Lighting: Spotlight effect on central animated figure, realistic ambient lighting on environment
- Color palette: Cool cel-shaded purples/blues on protagonist, warm realistic tones in environment

Emotional tone: Loneliness in community, the animated hero isolated in a realistic world.

Aspect ratio: 16:9 widescreen
Resolution: High quality, 1280x720`;

async function testHybridStyle() {
  console.log('🧪 Testing Wan 2.6 - Hybrid Style Approach\n');
  console.log('X-Men 97 cel-shading for protagonists + Realistic backgrounds\n');

  try {
    const imageUrl = await generateImage({
      prompt: hybridStylePrompt,
      size: '1280*720'
    });

    console.log(`✅ Image generated: ${imageUrl}`);

    // Download and save
    const buffer = await downloadMediaToBuffer(imageUrl);
    const outputPath = join(process.cwd(), '../../../blkout-website/public/images/theory-of-change/hybrid-test-card-01.png');
    writeFileSync(outputPath, buffer);

    console.log(`\n📁 Saved to: ${outputPath}`);
    console.log(`📊 Size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log('\n✨ Hybrid style test complete!');
    console.log('Review the image to see if this approach works better.');

    return imageUrl;
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

testHybridStyle()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
