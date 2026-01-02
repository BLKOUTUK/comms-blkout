/**
 * Joseph Beam Quiz Event Graphic Creator
 * Overlays event details on the real Joseph Beam photograph
 */

import sharp from 'sharp';
import { join } from 'path';
import { stat } from 'fs/promises';

const INPUT_PHOTO = join(process.cwd(), 'generated-campaign-assets-v2', 'JosephBeam2023.png');
const OUTPUT_FILE = join(process.cwd(), 'generated-campaign-assets-v2', '06-joseph-beam-quiz-FINAL.png');

// BLKOUT brand colors
const COLORS = {
  purple: '#a855f7',
  gold: '#f59e0b',
  green: '#10b981',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)'
};

async function createEventGraphic() {
  console.log('📸 Creating Joseph Beam Day Quiz graphic...\n');
  console.log(`📁 Input: ${INPUT_PHOTO}`);
  console.log(`📁 Output: ${OUTPUT_FILE}\n`);

  try {
    // Load the original photo
    const image = sharp(INPUT_PHOTO);
    const metadata = await image.metadata();
    const width = metadata.width || 1080;
    const height = metadata.height || 1080;

    console.log(`📐 Original dimensions: ${width}x${height}`);

    // Create SVG overlay with event details
    const svgOverlay = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="gradientOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(0,0,0,0.1);stop-opacity:1" />
            <stop offset="50%" style="stop-color:rgba(0,0,0,0.4);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(0,0,0,0.85);stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Semi-transparent gradient overlay for text legibility -->
        <rect width="${width}" height="${height}" fill="url(#gradientOverlay)" />

        <!-- Top Section: Event Title -->
        <text
          x="${width / 2}"
          y="120"
          font-family="Arial, sans-serif"
          font-size="72"
          font-weight="bold"
          fill="${COLORS.gold}"
          text-anchor="middle"
        >Joseph Beam Day Quiz</text>

        <text
          x="${width / 2}"
          y="180"
          font-family="Arial, sans-serif"
          font-size="48"
          font-weight="normal"
          fill="${COLORS.white}"
          text-anchor="middle"
        >📚</text>

        <!-- Bottom Section: Event Details -->
        <!-- Date & Time -->
        <rect x="${width / 2 - 300}" y="${height - 420}" width="600" height="80" fill="${COLORS.purple}" rx="10" />
        <text
          x="${width / 2}"
          y="${height - 360}"
          font-family="Arial, sans-serif"
          font-size="44"
          font-weight="bold"
          fill="${COLORS.white}"
          text-anchor="middle"
        >December 28th @ 6PM GMT</text>

        <!-- Subtitle -->
        <text
          x="${width / 2}"
          y="${height - 300}"
          font-family="Arial, sans-serif"
          font-size="28"
          font-weight="normal"
          fill="${COLORS.white}"
          text-anchor="middle"
        >Subscriber-exclusive event celebrating</text>

        <text
          x="${width / 2}"
          y="${height - 265}"
          font-family="Arial, sans-serif"
          font-size="28"
          font-weight="normal"
          fill="${COLORS.white}"
          text-anchor="middle"
        >2025's Black queer brilliance</text>

        <!-- Prizes -->
        <text
          x="${width / 2}"
          y="${height - 210}"
          font-family="Arial, sans-serif"
          font-size="24"
          font-weight="bold"
          fill="${COLORS.gold}"
          text-anchor="middle"
        >🏆 Prizes: Journals · Memberships · Beta Access</text>

        <!-- First 100 -->
        <text
          x="${width / 2}"
          y="${height - 175}"
          font-family="Arial, sans-serif"
          font-size="22"
          font-weight="normal"
          fill="${COLORS.white}"
          text-anchor="middle"
        >🎁 First 100 RSVPs: Joseph Beam quote prints</text>

        <!-- CTA Box -->
        <rect x="${width / 2 - 280}" y="${height - 135}" width="560" height="65" fill="${COLORS.gold}" rx="10" />
        <text
          x="${width / 2}"
          y="${height - 90}"
          font-family="Arial, sans-serif"
          font-size="32"
          font-weight="bold"
          fill="${COLORS.black}"
          text-anchor="middle"
        >Subscribe for invite: BLKOUTUK.COM/newsletter</text>

        <!-- BLKOUT Logo/Branding (bottom right) -->
        <text
          x="${width - 40}"
          y="${height - 30}"
          font-family="Arial, sans-serif"
          font-size="28"
          font-weight="bold"
          fill="${COLORS.white}"
          text-anchor="end"
        >BLKOUT</text>
      </svg>
    `;

    // Composite the overlay onto the original image
    await image
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0
        }
      ])
      .toFile(OUTPUT_FILE);

    console.log('✅ Event graphic created successfully!');
    console.log(`📁 Saved to: ${OUTPUT_FILE}\n`);

    const stats = await sharp(OUTPUT_FILE).metadata();
    console.log(`📊 Final dimensions: ${stats.width}x${stats.height}`);
    const fileStats = await stat(OUTPUT_FILE);
    console.log(`📦 File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB\n`);

    console.log('✨ Next steps:');
    console.log('   1. Review the graphic');
    console.log('   2. Replace slide 6 in your Instagram carousel');
    console.log('   3. Deploy the campaign!\n');

  } catch (error: any) {
    console.error('❌ Error creating graphic:', error.message);
    throw error;
  }
}

// Run the script
createEventGraphic().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
