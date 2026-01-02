/**
 * Theory of Change v2.0 - X-Men 97 Style Visual Generator
 * Generates animated concept art for cards with visualStyle: 'animated'
 * Uses GeminiAI Imagen 3 for X-Men 97 aesthetic
 */

import { GoogleGenAI } from "@google/genai";
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Get API key from environment
const GEMINI_API_KEY = process.env.VITE_GEMINI_API || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY not found in environment');
  console.error('Please set VITE_GEMINI_API or GEMINI_API_KEY environment variable');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Output directory
const OUTPUT_DIR = join(process.cwd(), '../../../blkout-website/public/images/theory-of-change');

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// X-Men 97 Style Guide
const XMEN_STYLE = `X-Men 97 animation aesthetic:
- Bold black outlines on all characters and objects
- Cel-shaded coloring with dramatic lighting
- Heroic poses and dynamic compositions
- Vibrant, saturated colors
- Strong contrast between light and shadow
- Dramatic camera angles
- Emotional intensity in expressions
- Comic book panel energy`;

// Card visuals to generate (only animated cards, not real photography)
const cardVisuals = [
  {
    card: 1,
    filename: 'card-01-isolation.png',
    prompt: `${XMEN_STYLE}

Scene: Black queer man sitting alone in a crowded room full of other Black queer men, but feeling isolated.

Visual description:
- Central figure: Black man with natural hair, stylish outfit, sitting with arms crossed, eyes downcast
- Background: Other Black queer men socializing, laughing, connecting - but rendered slightly faded/ghosted
- Color palette: Cool purples and blues for isolation, warm golds in background for the community he can't reach
- Lighting: Spotlight effect on central figure, surrounded by shadows
- Emotional tone: Loneliness in community, relatable vulnerability
- Setting: Modern lounge or community space with contemporary furniture

Composition: Wide shot, central figure in sharp focus, background figures soft focus, dramatic lighting from above creating isolation effect.`,
    aspectRatio: '16:9' as const
  },
  {
    card: 2,
    filename: 'card-02-same.png',
    prompt: `${XMEN_STYLE}

Scene: Close-up of two Black queer men making eye contact and silently acknowledging shared experience.

Visual description:
- Two faces in profile, eyes meeting in the center of frame
- Expressions: Recognition, understanding, "I see you"
- One with locs, one with fade, both with subtle facial hair
- Purple and gold lighting creating warm connection between them
- Background: Soft purple gradient, slightly blurred
- Energy: Quiet moment of recognition and solidarity

Composition: Symmetric profile shots meeting in center, dramatic lighting highlighting eyes and expressions.`,
    aspectRatio: '16:9' as const
  },
  {
    card: 9,
    filename: 'card-09-inversion.png',
    prompt: `${XMEN_STYLE}

Scene: Visual metaphor of "the inversion" - arrow reversing direction showing transformation from individual to collective knowing.

Visual description:
- Split screen composition
- LEFT SIDE: Single Black queer man looking in mirror, seeing only himself (cooler purple tones)
- RIGHT SIDE: Same man surrounded by community, seeing himself reflected in others' eyes (warm gold tones)
- Center: Bold arrow reversing/inverting direction
- Text overlay: "Know ourselves → Know each other → Love becomes possible" in bold cel-shaded text
- Energy: Revelation, transformation, breakthrough moment

Composition: Dynamic split screen with central arrow/symbol, bold typography integrated into scene.`,
    aspectRatio: '16:9' as const
  },
  {
    card: 11,
    filename: 'card-11-geography.png',
    prompt: `${XMEN_STYLE}

Scene: Map of UK with Black queer men scattered across cities, visually isolated from each other.

Visual description:
- Stylized UK map in purple gradient
- Multiple Black queer men figures positioned in different cities (London, Manchester, Birmingham, Bristol, etc.)
- Each figure isolated in their own "bubble" or light circle
- Dotted lines showing potential connections that don't exist yet
- Color palette: Deep purple map, gold highlights for cities, teal for potential connection lines
- Emotional tone: Geographic isolation, longing for connection
- Modern, graphic design approach with cel-shaded character illustrations

Composition: Overhead view of UK, figures distributed across map, visual emphasis on distance and isolation.`,
    aspectRatio: '16:9' as const
  }
];

// Generate single image with Gemini Imagen
async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
  const modelName = 'gemini-3-pro-image-preview';

  try {
    console.log('🎨 Generating with Gemini Imagen 3...');

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "2K"
        }
      }
    });

    // Extract base64 image data
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error("No image data found in response");
  } catch (error: any) {
    console.error('❌ Generation failed:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🎬 Theory of Change v2.0 - X-Men 97 Visual Generator\n');
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);
  console.log(`🎨 Style: X-Men 97 animation aesthetic`);
  console.log(`📊 Visuals to generate: ${cardVisuals.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < cardVisuals.length; i++) {
    const visual = cardVisuals[i];
    console.log(`\n[${i + 1}/${cardVisuals.length}] Card ${visual.card}: ${visual.filename}`);
    console.log(`Prompt preview: ${visual.prompt.substring(0, 150)}...`);

    try {
      const base64Data = await generateImage(visual.prompt, visual.aspectRatio);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Data, 'base64');
      const outputPath = join(OUTPUT_DIR, visual.filename);
      writeFileSync(outputPath, buffer);

      console.log(`✅ Saved: ${outputPath} (${(buffer.length / 1024).toFixed(2)} KB)`);
      successCount++;

      // Wait between requests to avoid rate limiting
      if (i < cardVisuals.length - 1) {
        console.log('⏳ Waiting 3 seconds before next generation...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error: any) {
      console.error(`❌ Failed to generate ${visual.filename}:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Generation Summary:');
  console.log(`   ✅ Success: ${successCount}/${cardVisuals.length}`);
  console.log(`   ❌ Failed: ${failCount}/${cardVisuals.length}`);
  console.log('='.repeat(60));

  if (successCount > 0) {
    console.log(`\n📁 Generated files saved to: ${OUTPUT_DIR}`);
    console.log('\n✨ Next steps:');
    console.log('   1. Review X-Men 97 style visuals');
    console.log('   2. Add more card visuals as needed');
    console.log('   3. Update TheoryOfChange component to use generated images');
    console.log('   4. Deploy to Coolify');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
