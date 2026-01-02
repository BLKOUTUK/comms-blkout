/**
 * Generate 6 Missing Background Images for Theory of Change
 * Pure background photography (no animated characters)
 */

import { generateImage, downloadMediaToBuffer } from './services/wan-direct';
import { writeFileSync } from 'fs';
import { join } from 'path';

const missingBackgrounds = [
  {
    card: 15,
    filename: 'bg-card-15-phone-messages.png',
    prompt: `Realistic photography - Phone screen showing inactive group chat:

Close-up of smartphone screen displaying WhatsApp or messaging app.
The conversation is visibly inactive - last message from weeks or months ago.
Messages from "The Group" or similar group name.
Screen shows "typing..." that never turned into a message.
Read receipts showing messages were seen but not replied to.
Dim lighting, suggesting nighttime or loneliness.
Phone held in Black person's hand.

Style: Photorealistic, melancholic lighting, digital silence metaphor.
Aspect ratio: 4:5 portrait
High resolution, sharp detail on screen text.`
  },
  {
    card: 24,
    filename: 'bg-card-24-newsroom.png',
    prompt: `Realistic photography - Newsroom/writing workspace:

Desk setup with laptop, notebooks, coffee cup.
Multiple browser tabs open showing articles and research.
Visible: BLKOUT article drafts, community stories.
Warm desk lamp lighting.
Books about Black queer history visible in background.
Notes and post-its on wall.
Creative workspace that feels lived-in and productive.

Style: Photorealistic, warm productive atmosphere, storytelling in action.
Aspect ratio: 4:5 portrait
Modern workspace aesthetic.`
  },
  {
    card: 25,
    filename: 'bg-card-25-construction.png',
    prompt: `Realistic photography - Construction/building in progress:

Building site or renovation in progress.
Scaffolding, tools, materials visible.
Sense of creation and building something new.
Could be community space being renovated.
Warm afternoon light.
Sense of autonomy - building without permission.

Style: Photorealistic, hopeful construction energy, creation in progress.
Aspect ratio: 4:5 portrait
Focus on building/creation metaphor.`
  },
  {
    card: 26,
    filename: 'bg-card-26-uk-transport.png',
    prompt: `Realistic photography - UK transportation network:

Train station platform or railway map showing connections between UK cities.
Visible city names: London, Manchester, Birmingham, Bristol.
Railway lines connecting across the map.
Could be inside train looking out, or departure board, or network map.
Sense of connectivity and travel between cities.

Style: Photorealistic, UK rail aesthetic, connectivity metaphor.
Aspect ratio: 4:5 portrait
British transport system visual.`
  },
  {
    card: 28,
    filename: 'bg-card-28-tech-human.png',
    prompt: `Realistic photography - Technology meeting humanity:

Split or layered composition:
FOREGROUND: Laptop/screens showing digital infrastructure (code, platforms, systems).
BACKGROUND: People gathering, community in soft focus.
Sense of technology serving human connection, not replacing it.
Warm lighting suggesting human warmth.
Modern tech workspace with people visible.

Style: Photorealistic, warm tech aesthetic, human-centered technology.
Aspect ratio: 4:5 portrait
Balance between digital and human elements.`
  },
  {
    card: 37,
    filename: 'bg-card-37-horizon.png',
    prompt: `Realistic photography - Infinite possibility:

Wide open sky at sunrise or sunset.
Horizon line visible, endless expanse.
Warm golden and purple tones in sky.
Sense of openness, future, possibility.
Could include silhouette of person looking toward horizon.
Hopeful, expansive, dreaming energy.

Style: Photorealistic, inspirational landscape, open future metaphor.
Aspect ratio: 4:5 portrait
Cinematic sky composition.`
  }
];

async function generateMissingBackgrounds() {
  console.log('🎨 Generating 6 Missing Backgrounds for Theory of Change\n');
  console.log('Style: Photorealistic backgrounds (4:5 portrait)\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < missingBackgrounds.length; i++) {
    const bg = missingBackgrounds[i];
    console.log(`\n[${i + 1}/6] Card ${bg.card}: ${bg.filename}`);

    try {
      const imageUrl = await generateImage({
        prompt: bg.prompt,
        size: '1080*1350' // 4:5 portrait
      });

      console.log(`✅ Generated: ${imageUrl}`);

      // Download and save
      const buffer = await downloadMediaToBuffer(imageUrl);
      const outputPath = join(process.cwd(), '../../../blkout-website/public/images/theory-backgrounds/', bg.filename);
      writeFileSync(outputPath, buffer);

      console.log(`📁 Saved: ${outputPath} (${(buffer.length / 1024).toFixed(2)} KB)`);
      successCount++;

      // Wait between requests
      if (i < missingBackgrounds.length - 1) {
        console.log('⏳ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error: any) {
      console.error(`❌ Failed: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Success: ${successCount}/6`);
  console.log(`❌ Failed: ${failCount}/6`);
  console.log('='.repeat(60));

  process.exit(failCount > 0 ? 1 : 0);
}

generateMissingBackgrounds();
