/**
 * Test Gemini Veo 3.1 Video Generation
 * Animate one keyframe to verify I2V works
 */

import { generateVideoFromImage } from './services/gemini-veo';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function testVeo() {
  console.log('🧪 Testing Gemini Veo 3.1 I2V\n');

  try {
    // Load first keyframe
    const keyframePath = join(process.cwd(), '../../../blkout-website/public/images/video-keyframes/video1-scene1-isolated-figures.png');
    const imageBuffer = readFileSync(keyframePath);
    const base64Image = imageBuffer.toString('base64');

    const prompt = `Cinematic documentary footage:

Black queer man alone on night bus in London at night. He's looking out the window pensively, isolated despite being in a public space.

Camera: Slow push in toward his face
Mood: Melancholic, contemplative, urban isolation
Lighting: Natural night bus lighting with window reflections
Duration: 8 seconds
Style: Documentary realism, authentic moment

Generate smooth cinematic video from this still image.`;

    console.log('🎬 Generating 8-second video clip...\n');

    const videoUrl = await generateVideoFromImage(base64Image, prompt);

    console.log(`\n✅ Video generated: ${videoUrl}`);
    console.log('\n✨ Gemini Veo I2V working!');
    console.log('Ready to generate all 8 clips.');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check GEMINI_API_KEY is set');
    console.error('2. Verify Veo 3.1 access on your API key');
    console.error('3. Check quota/credits available');
    throw error;
  }
}

testVeo()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
