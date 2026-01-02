/**
 * Holiday 2025 Campaign Graphics Generator
 * Generates all 6 carousel graphics using Google Gemini API
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
const OUTPUT_DIR = join(process.cwd(), 'generated-campaign-assets');

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Campaign graphics prompts
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
- Four distinct sections/pillars arranged in a grid or circular pattern
- BLKOUT brand colors: purple (#a855f7), gold (#f59e0b), green (#10b981)
- Icons for each achievement (robot, calendar, newspaper, communication)
- Clean, modern infographic style
- Data visualization aesthetic
- Numbers and metrics highlighted prominently
- Professional yet accessible design

Style: Modern infographic, clean data visualization, bold colors, iconography`,
    aspectRatio: '1:1' as const
  },
  {
    filename: '03-liberation-layer-diagram.png',
    prompt: `Create a technical diagram explaining "Liberation Layer 3" - an AI system that ensures 75% creator revenue.

Visual concept:
- Central focus: Large "75%" in bold typography
- Tagline: "Creator Revenue - HARDCODED"
- Visual representation of data flow/architecture
- Geometric shapes showing system layers
- Lock/security icons to emphasize "hardcoded" concept
- Code snippets or terminal aesthetic elements
- BLKOUT brand colors with emphasis on trust (purple) and wisdom (green)

Additional text elements:
- "Not extractive. Not surveillance."
- "Just community-centered tech."
- "🔐 Data Sovereignty"
- "💜 Black Queer Agency"

Style: Technical diagram, cyberpunk aesthetic, modern UI/UX design, architectural blueprint feel, high-tech liberation`,
    aspectRatio: '1:1' as const
  },
  {
    filename: '04-community-governance.png',
    prompt: `Create a visual representation of BLKOUT's Community Benefit Society governance structure.

Content to visualize:
- Title: "Community Benefit Society 🏛️"
- Subtitle: "Democratic. Member-Owned. Transparent."
- Visual representation of democratic governance (could be circular diagram showing members at center)
- Key principles highlighted:
  * "No VCs. No Compromises."
  * "Just community ownership."
  * "Building institutions for generations."
- Icons representing: democracy, ownership, transparency, longevity
- Interconnected nodes or organizational chart showing member-led structure
- BLKOUT brand colors with gold (#f59e0b) emphasized for wisdom/legacy

Style: Organizational diagram, cooperative structure visualization, institutional design, professional governance aesthetic`,
    aspectRatio: '1:1' as const
  },
  {
    filename: '05-app-previews.png',
    prompt: `Create a dual app preview mockup showing Critical Frequency and Down apps for 2026.

App 1 - Critical Frequency 🎵:
- Social discovery platform for Black queer men
- Mockup of mobile phone screen showing a modern social app
- Visual elements: music visualization, profile cards, vibe matching
- Tagline: "Social discovery platform (Q1 2026)"
- Purple and teal color scheme

App 2 - Down 🧘🏾:
- Wellness companion app
- Mockup of mobile phone screen showing meditation/wellness interface
- Visual elements: breathing exercises, journals, mood tracking
- Tagline: "Wellness companion app (Spring 2026)"
- Green and calm blue color scheme

Layout: Two phone mockups side by side on gradient background
Text: "Coming in 2026 🌟"
Subtext: "Newsletter subscribers get first access!"

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
- BLKOUT brand colors with emphasis on wisdom (purple and gold)

Additional details:
- "🏆 Prizes: Journals, memberships, beta access"
- "🎁 First 100 RSVPs: Joseph Beam quote prints"
- "Subscribe → Get your invite"
- "Link in bio 💛"

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
  console.log('🎄 BLKOUT Holiday 2025 Campaign Graphics Generator\n');
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
    console.log('\n✨ Next steps:');
    console.log('   1. Review generated graphics');
    console.log('   2. Upload to Instagram carousel');
    console.log('   3. Use in campaign deployment!');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
