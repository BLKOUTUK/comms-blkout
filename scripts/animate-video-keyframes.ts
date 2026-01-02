/**
 * Animate Video Keyframes with Wan 2.6 I2V
 * Converts 8 key frames into animated video clips
 */

import { generateVideo, downloadMediaToBuffer } from './services/wan-direct';
import { writeFileSync } from 'fs';
import { join } from 'path';

const KEYFRAME_DIR = '../../../blkout-website/public/images/video-keyframes';
const OUTPUT_DIR = '../../../blkout-website/public/videos/theory-clips';

const keyframes = [
  { file: 'video1-scene1-isolated-figures.png', output: 'video1-scene1.mp4', prompt: 'Cinematic documentary: Black queer man alone on night bus, looking out window pensively. Camera slow push in. Melancholic mood.' },
  { file: 'video1-scene2-invisible-walls.png', output: 'video1-scene2.mp4', prompt: 'Close-up documentary: Hands holding phone, scrolling through unanswered messages. Subtle camera movement, intimate framing.' },
  { file: 'video1-scene3-possibility.png', output: 'video1-scene3.mp4', prompt: 'Documentary: Two Black queer men making eye contact across space, moment of recognition. Camera alternates between their faces, hopeful energy.' },
  { file: 'video1-scene4-yet.png', output: 'video1-scene4.mp4', prompt: 'Documentary: Black queer men gathering in community circle, slow camera reveal of the forming circle. Warm inviting atmosphere building.' },
  { file: 'video2-scene1-team-assembles.png', output: 'video2-scene1.mp4', prompt: 'X-Men 97 animation: Hero team lineup, dynamic camera pan across heroes, each striking heroic pose. Comic book energy, bold colors flashing.' },
  { file: 'video2-scene2-what-we-built.png', output: 'video2-scene2.mp4', prompt: 'X-Men 97 animation: BLKOUT activities montage, quick cuts between events/articles/hub glowing. Energy building, ongoing mission visible.' },
  { file: 'video2-scene3-invitation.png', output: 'video2-scene3.mp4', prompt: 'X-Men 97 animation: Heroes turning to camera breaking fourth wall, warm welcoming gestures. Empty silhouette glowing with invitation.' },
  { file: 'video2-scene4-threshold.png', output: 'video2-scene4.mp4', prompt: 'X-Men 97 animation: Camera push through open doorway into golden light, team visible inside. Hero silhouette pulsing with possibility.' }
];

async function main() {
  console.log('🎬 Animating Video Keyframes with Wan 2.6 I2V\n');
  console.log(`📊 Total: ${keyframes.length} clips to generate\n`);

  let success = 0;

  for (const kf of keyframes) {
    console.log(`\n🎨 Animating: ${kf.file} → ${kf.output}`);

    try {
      // Keyframe URL (local file converted to URL for Wan API)
      const keyframePath = join(process.cwd(), KEYFRAME_DIR, kf.file);
      const keyframeUrl = `file://${keyframePath}`; // Local file URL

      // Note: Wan I2V requires publicly accessible URL
      // Will need to upload keyframes to temporary hosting or use base64
      console.log('⚠️  Note: Wan I2V requires public URL for keyframe');
      console.log('    For now, saving keyframe info for manual I2V generation');

      // Document the clip for manual generation
      const clipInfo = {
        keyframe: kf.file,
        output: kf.output,
        prompt: kf.prompt,
        note: 'Use Wan I2V via dashboard or upload keyframe to generate video'
      };

      console.log(JSON.stringify(clipInfo, null, 2));
      success++;

    } catch (error: any) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }

  console.log(`\n✅ Documented ${success}/${keyframes.length} clips for I2V generation`);
  console.log('\n📝 To generate videos:');
  console.log('1. Upload keyframes from /public/images/video-keyframes/ to image host');
  console.log('2. Use Wan 2.6 I2V API with each keyframe URL + prompt');
  console.log('3. Download resulting videos to /public/videos/theory-clips/');
  console.log('\nOR: Use Alibaba DashScope dashboard for I2V generation');
}

main();
