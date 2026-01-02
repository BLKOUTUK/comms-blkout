/**
 * Test Wan 2.6 API Connection
 * Verifies Wan API key and generates a sample X-Men 97 style image
 */

import { generateImage } from './services/wan-direct';

const testPrompt = `X-Men 97 animation aesthetic - Bold cel-shaded artwork:

Scene: Two Black queer men standing back-to-back in heroic poses, arms crossed, looking determined.

Style:
- Bold black outlines on all characters
- Cel-shaded coloring with dramatic purple and gold lighting
- Heroic superhero poses
- Vibrant saturated colors
- Strong contrast between light and shadow
- Comic book energy

Background: Purple gradient with radiating energy lines.

Composition: Dynamic dual hero shot, centered, powerful stance.`;

async function testWanAPI() {
  console.log('🧪 Testing Wan 2.6 API Connection\n');
  console.log('Generating test image with X-Men 97 style prompt...\n');

  try {
    const imageUrl = await generateImage({
      prompt: testPrompt,
      aspectRatio: '16:9'
    });

    console.log('✅ Success! Image generated.');
    console.log(`📷 Image URL: ${imageUrl}`);
    console.log('\n✨ Wan 2.6 API is working correctly!');
    console.log('Ready to generate Theory of Change visuals.');

    return imageUrl;
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check FAL_KEY is set in .env file');
    console.error('2. Verify API key is valid at https://fal.ai/dashboard/keys');
    console.error('3. Ensure you have credits available');
    throw error;
  }
}

testWanAPI()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
