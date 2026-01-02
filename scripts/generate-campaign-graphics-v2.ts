/**
 * Holiday 2025 Campaign Graphics Generator v2
 * UPDATED: Fixed app descriptions, added brand guidelines, simplified Liberation Layer 3
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
const OUTPUT_DIR = join(process.cwd(), 'generated-campaign-assets-v2');

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Campaign graphics prompts (CORRECTED)
const graphics = [
  {
    filename: '01-festive-logo.png',
    prompt: `Create a festive holiday greeting graphic for BLKOUT UK, a Black queer community platform.

Design elements:
- Bold text "Merry Christmas from BLKOUT" in elegant serif font
- Text "2025: The Year We Built Liberation Technology" as subheading
- Background: Festive gradient flowing from deep purple (#a855f7) to warm gold (#f59e0b) to vibrant green (#10b981)
- Geometric patterns inspired by African textiles and queer liberation symbols
- Snowflakes and stars subtly integrated
- BLKOUT logo in bottom right corner (or text "BLKOUT" in bold)
- Clear CTA at bottom: "BLKOUTUK.COM"
- Modern, bold, celebratory aesthetic
- Professional brand identity feel
- High contrast for social media readability

Style: Modern graphic design, bold typography, festive but professional, celebratory`,
    aspectRatio: '1:1' as const
  },
  {
    filename: '02-achievements-infographic.png',
    prompt: `Create an infographic showing BLKOUT's 2025 achievements with 4 pillars.

Content to visualize:
1. 🤖 IVOR AI - "Your Black queer companion"
2. 📅 Events Calendar - "10,000+ connections"
3. 📰 News Platform - "Amplifying our voices"
4. 💬 Comms Hub - "AI-powered storytelling"

Design requirements:
- Title: "What We Built in 2025 🚀"
- Four distinct sections/pillars arranged in a grid (2x2) or horizontal layout
- BLKOUT brand colors: purple (#a855f7), gold (#f59e0b), green (#10b981)
- Icons for each achievement (robot, calendar, newspaper, communication)
- Clean, modern infographic style
- Data visualization aesthetic
- Numbers and metrics highlighted prominently
- BLKOUT logo in bottom right corner
- CTA at bottom: "Learn more: BLKOUTUK.COM"
- Professional yet accessible design

Style: Modern infographic, clean data visualization, bold colors, iconography`,
    aspectRatio: '1:1' as const
  },
  {
    filename: '03-liberation-layer-simplified.png',
    prompt: `Create a SIMPLE, clear visual explaining BLKOUT's 75% creator revenue model.

Visual concept (KEEP IT SIMPLE):
- Large, bold "75%" as central focus
- Simple pie chart or bar showing revenue split:
  * 75% to Creators (large portion in gold #f59e0b)
  * 25% to Platform Operations (smaller portion in purple #a855f7)
- Headline: "Creator Revenue - Hardcoded"
- Subtext: "75% goes directly to Black queer creators and community"
- Simple icons: money/coins, creators/people, community
- Avoid complex technical diagrams or jargon
- Keep it visual, simple, and emotionally resonant

Additional text:
- "Not extractive. Community-centered."
- "Economic justice IS liberation 💜"
- BLKOUT logo bottom right
- CTA: "Join us: BLKOUTUK.COM"

Style: Simple infographic, clear data visualization, warm and inviting, accessible to all audiences`,
    aspectRatio: '1:1' as const
  },
  {
    filename: '04-community-governance.png',
    prompt: `Create a visual representation of BLKOUT's Community Benefit Society governance structure.

Content to visualize:
- Title: "Community Benefit Society 🏛️"
- Subtitle: "Democratic. Member-Owned. Transparent."
- Visual representation of democratic governance:
  * Circular diagram with "Members" at the center
  * Arrows showing democratic decision-making flow
  * Icons for voting, ownership, transparency
- Key principles highlighted:
  * "No VCs. No Compromises."
  * "Community ownership."
  * "Building institutions for generations."
- BLKOUT brand colors with gold (#f59e0b) emphasized for wisdom/legacy
- BLKOUT logo bottom right
- CTA: "Become a member: BLKOUTUK.COM"

Style: Organizational diagram, cooperative structure visualization, professional governance aesthetic, warm and inclusive`,
    aspectRatio: '1:1' as const
  },
  {
    filename: '05-app-previews-CORRECTED.png',
    prompt: `Create a dual app preview mockup showing Critical Frequency and Down apps for 2026.

IMPORTANT - CORRECT APP DESCRIPTIONS:

App 1 - Critical Frequency 🧘🏾‍♂️:
- Population health mental wellbeing project
- Mockup of mobile phone screen showing mental health app
- Visual elements: mood tracking, meditation guides, wellness journal, community support
- Color scheme: Calming green (#10b981) and purple (#a855f7)
- Tagline: "Mental health & wellbeing (Q1 2026)"

App 2 - Down 💜:
- Hook-up app for Black queer men
- Mockup of mobile phone screen showing connection/dating app
- Visual elements: profile cards, location-based matching, chat interface
- Color scheme: Warm gold (#f59e0b) and teal (#14b8a6)
- Tagline: "Connection app (Spring 2026)"

Layout:
- Two phone mockups side by side on gradient background
- Title: "Coming in 2026 🌟"
- Subtext: "Newsletter subscribers get first access!"
- BLKOUT logo bottom right
- CTA: "Subscribe: BLKOUTUK.COM/newsletter"

Style: Modern app mockup, UI/UX showcase, product preview, sleek smartphone design, professional app store aesthetic`,
    aspectRatio: '1:1' as const
  },
  {
    filename: '06-joseph-beam-quiz.png',
    prompt: `Create an event invitation graphic for Joseph Beam Day Quiz.

Main content:
- Title: "Joseph Beam Day Quiz 📚"
- Date: "December 28th @ 6PM GMT"
- Subtitle: "Subscriber-exclusive event celebrating 2025's Black queer brilliance"

Visual elements:
- Portrait or silhouette of a Black queer scholar/intellectual (respectful, celebratory)
- Book imagery, quiz elements, knowledge symbols
- Festive but scholarly aesthetic
- BLKOUT brand colors with emphasis on wisdom (purple #a855f7 and gold #f59e0b)

Event details:
- "🏆 Prizes: Journals, memberships, beta access"
- "🎁 First 100 RSVPs: Joseph Beam quote prints"
- BLKOUT logo bottom right
- Clear CTA: "Subscribe for invite: BLKOUTUK.COM/newsletter"

Style: Event poster, celebratory academic aesthetic, literary celebration, elegant typography, community event design`,
    aspectRatio: '1:1' as const
  }
];

async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
  const modelName = 'gemini-3-pro-image-preview';

  try {
    console.log('🎨 Generating image...');

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
  console.log('🎄 BLKOUT Holiday 2025 Campaign Graphics Generator v2\n');
  console.log('✅ UPDATED: Corrected app descriptions, added brand guidelines\n');
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < graphics.length; i++) {
    const graphic = graphics[i];
    console.log(`\n[${i + 1}/${graphics.length}] Generating: ${graphic.filename}`);
    console.log(`Prompt: ${graphic.prompt.substring(0, 100)}...`);

    try {
      const base64Data = await generateImage(graphic.prompt, graphic.aspectRatio);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Data, 'base64');
      const outputPath = join(OUTPUT_DIR, graphic.filename);
      writeFileSync(outputPath, buffer);

      console.log(`✅ Saved: ${outputPath} (${(buffer.length / 1024).toFixed(2)} KB)`);
      successCount++;

      // Wait a bit between requests to avoid rate limiting
      if (i < graphics.length - 1) {
        console.log('⏳ Waiting 2 seconds before next generation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`❌ Failed to generate ${graphic.filename}:`, error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Generation Summary:');
  console.log(`   ✅ Success: ${successCount}/${graphics.length}`);
  console.log(`   ❌ Failed: ${failCount}/${graphics.length}`);
  console.log('='.repeat(60));

  if (successCount > 0) {
    console.log(`\n📁 Generated files saved to: ${OUTPUT_DIR}`);
    console.log('\n✨ Changes in v2:');
    console.log('   - ✅ BLKOUT logo added to all graphics');
    console.log('   - ✅ Clear CTAs with URLs on every graphic');
    console.log('   - ✅ CORRECTED: Critical Frequency = mental wellbeing');
    console.log('   - ✅ CORRECTED: Down = hook-up app');
    console.log('   - ✅ SIMPLIFIED: Liberation Layer 3 (75% revenue split)');
    console.log('\n✨ Next steps:');
    console.log('   1. Review generated graphics');
    console.log('   2. Compare with v1 to see improvements');
    console.log('   3. Use corrected graphics for campaign!');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
