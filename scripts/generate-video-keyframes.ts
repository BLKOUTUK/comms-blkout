/**
 * Generate Key Frames for Videos 1 & 2
 * Creates still images that will be animated with Wan I2V
 */

import { generateImage, downloadMediaToBuffer } from './services/wan-direct';
import { writeFileSync } from 'fs';
import { join } from 'path';

const VIDEO_KEYFRAMES = [
  // VIDEO 1: "We Don't Know Each Other (Yet)"
  {
    video: 1,
    scene: 1,
    filename: 'video1-scene1-isolated-figures.png',
    prompt: `Photorealistic cinematic still, documentary style, 16:9 widescreen:

Black queer man alone on night bus in London.
Wide shot showing empty bus interior, man sitting alone by window.
Natural night bus lighting, reflections in window.
Man: 30s, casual clothing, looking out window pensively.
Urban UK night photography, melancholic mood.
Professional cinematography.

Pure photographic realism - documentary film still.`
  },
  {
    video: 1,
    scene: 2,
    filename: 'video1-scene2-invisible-walls.png',
    prompt: `Photorealistic cinematic still, 16:9:

Close-up of Black queer man's hands holding phone.
Phone screen shows messaging app with unanswered group chat.
Messages from weeks ago, "typing..." that never came.
Man: early 30s, visible partial face showing disappointment.
Dim screen glow lighting, intimate close-up.
Documentary photography.

Photorealistic - film still quality.`
  },
  {
    video: 1,
    scene: 3,
    filename: 'video1-scene3-possibility.png',
    prompt: `Photorealistic cinematic still, 16:9:

Two Black queer men making eye contact across community space.
Medium shot, both visible, moment of recognition.
First: late 20s, casual; Second: mid-30s, professional.
Warm interior lighting, hopeful mood.
UK community center or cafe setting.
Documentary cinematography.

Photorealistic - authentic human connection moment.`
  },
  {
    video: 1,
    scene: 4,
    filename: 'video1-scene4-yet.png',
    prompt: `Photorealistic cinematic still, 16:9:

Wide shot of diverse Black queer men beginning to gather in circle.
5-6 people entering warm community space, circle forming.
Various ages (20s-40s), different styles, authentic.
Warm inviting lighting, hopeful atmosphere.
UK community space, welcoming environment.
Documentary photography.

Photorealistic - community emerging from isolation.`
  },

  // VIDEO 2: "Heroes" (X-Men 97 Animation Style)
  {
    video: 2,
    scene: 1,
    filename: 'video2-scene1-team-assembles.png',
    prompt: `X-Men 97 animation style, 16:9 cinematic frame:

Team lineup of 6 diverse Black queer heroes in heroic poses.
Each distinct: different ages, hair, styles, powers.
Bold black outlines, cel-shaded coloring.
Dramatic lighting, vibrant purple/gold/pink colors.
Title sequence energy - dynamic angles.
Comic book aesthetic, heroic composition.

Pure X-Men 97 animation style - team shot.`
  },
  {
    video: 2,
    scene: 2,
    filename: 'video2-scene2-what-we-built.png',
    prompt: `X-Men 97 animation style, 16:9:

Montage composition showing BLKOUT activities:
- Events happening (people gathering)
- Articles being written (words as light)
- Hub glowing with activity (digital command center)
- New members joining (walking through door)
Bold outlines, cel-shaded, dramatic lighting.
Ongoing mission energy, action in progress.

X-Men 97 animation - active community montage.`
  },
  {
    video: 2,
    scene: 3,
    filename: 'video2-scene3-invitation.png',
    prompt: `X-Men 97 animation style, 16:9:

Multiple heroes turning to camera, breaking fourth wall.
4-5 heroes in lineup, all turning to face viewer.
Warm welcoming expressions, invitational poses.
Empty space in lineup - glowing silhouette for viewer.
Bold outlines, warm gold lighting, inclusive energy.

X-Men 97 animation - direct address to viewer.`
  },
  {
    video: 2,
    scene: 4,
    filename: 'video2-scene4-threshold.png',
    prompt: `X-Men 97 animation style, 16:9:

Open doorway with golden light streaming out.
View from outside looking into warm glowing space.
Team visible inside, active and alive.
Empty hero silhouette in foreground (viewer's place).
Bold outlines, dramatic lighting contrast.
Inviting, threshold energy.

X-Men 97 animation - doorway to community.`
  }
];

async function main() {
  console.log('🎬 Generating Video Key Frames\n');
  console.log(`📊 Total: ${VIDEO_KEYFRAMES.length} key frames (4 per video)\n`);

  let success = 0;

  for (const frame of VIDEO_KEYFRAMES) {
    console.log(`\n🎨 Video ${frame.video} Scene ${frame.scene}: ${frame.filename}`);

    try {
      const imageUrl = await generateImage({
        prompt: frame.prompt,
        size: '1280*720' // 16:9 landscape (within pixel limits)
      });

      const buffer = await downloadMediaToBuffer(imageUrl);
      const outputPath = join(process.cwd(), '../../../blkout-website/public/images/video-keyframes/', frame.filename);
      writeFileSync(outputPath, buffer);

      console.log(`✅ Saved: ${(buffer.length / 1024).toFixed(2)} KB`);
      success++;

      if (success < VIDEO_KEYFRAMES.length) {
        console.log('⏳ Waiting 3s...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error: any) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }

  console.log(`\n✅ Key frames complete: ${success}/${VIDEO_KEYFRAMES.length}`);
  console.log('\nNext: Use Wan I2V to animate each frame into 15-20s clips.');
}

main();
