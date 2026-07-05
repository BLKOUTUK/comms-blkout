/**
 * Generate QTIPOC CookOut Fire Animation — 4-shot sequence via LTX-2 on fal.ai
 *
 * Shot 1: Single figure walks towards fire (arrival)
 * Shot 2: A couple by the fire (intimacy)
 * Shot 3: A group gathered (community)
 * Shot 4: Overhead — fire encircled by figures (the logo shot)
 *
 * Usage:
 *   cd /home/robbe/blkout-platform/apps/comms-blkout
 *   npx tsx scripts/generate-cookout-fire.ts
 *   npx tsx scripts/generate-cookout-fire.ts --shot 4   # single shot only
 */

import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error("❌ FAL_KEY not found in environment. Add it to .env");
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });

const OUTPUT_DIR = "/home/robbe/qtipoc-cookout/public/videos/generated";

const STYLE_PREFIX = `Animated illustration, flat graphic style like screen print or risograph. Limited colour palette: black, cream, warm amber, burnt sienna, faint blue accents. Not photorealistic. Smooth animation, gentle movement. No text, no watermarks. Camera static.`;

const SHOTS = [
  {
    name: "01-arrival",
    duration: 6 as const,
    prompt: `${STYLE_PREFIX} Wide shot. A single silhouetted figure walks towards a distant bonfire across an open field at night. Seen from behind. The figure carries a covered dish. The fire glows amber and cream in the distance, casting a faint warm circle on the ground. Starry black sky, drifting embers. The figure walks steadily, unhurried. Shooting stars streak faintly above.`,
  },
  {
    name: "02-couple",
    duration: 6 as const,
    prompt: `${STYLE_PREFIX} Low angle, close framing. Two silhouetted figures sitting side by side in front of a large bonfire, one with an arm around the other's shoulder. Seen from behind. Flames dance in cream, amber, and coral-red. Blue-tinted firelight reflects off the edges of the figures. Gold-amber lit ground beneath them. Starry night sky above. Embers drift upward. The couple leans gently into each other.`,
  },
  {
    name: "03-group",
    duration: 6 as const,
    prompt: `${STYLE_PREFIX} Medium wide shot. Seven silhouetted figures of varying heights and builds gathered in a semicircle around a large bonfire. Some sitting on the ground, one in a wheelchair, two standing close together, one gesturing with their hands. All seen from behind. Large dancing flames in cream and amber dominate the centre. Scattered embers and sparks float upward into a starry black sky. The fire illuminates the ground in a warm circle.`,
  },
  {
    name: "04-circle-overhead",
    duration: 6 as const,
    prompt: `${STYLE_PREFIX} Bird's-eye view looking directly down at a bonfire. The fire is a bright amber and cream flame shape at the centre of the frame. Twelve people are arranged in a circle around the fire, seen from above as dark silhouettes. Most are sitting cross-legged on the ground, two are standing, one person sits in a wheelchair. They are different sizes suggesting adults and younger people. The lit ground radiates warmth outward in concentric amber tones fading to black. Embers drift upward toward the camera. The figures are still, the fire flickers.`,
  },
];

async function generateShot(
  shot: (typeof SHOTS)[number],
  index: number
): Promise<string> {
  console.log(
    `\n🔥 Shot ${index + 1}/4: ${shot.name} (${shot.duration}s)...`
  );
  console.log(`   Prompt: ${shot.prompt.substring(0, 100)}...`);

  const result = await fal.subscribe("fal-ai/ltx-2/text-to-video", {
    input: {
      prompt: shot.prompt,
      duration: shot.duration,
      resolution: "1080p" as const,
      aspect_ratio: "16:9" as const,
      fps: 25 as const,
      generate_audio: false,
    },
    logs: true,
    onQueueUpdate: (update: any) => {
      if (update.status === "IN_QUEUE") {
        console.log(`   ⏳ Queued...`);
      }
      if (update.status === "IN_PROGRESS" && update.logs?.length) {
        const latest = update.logs[update.logs.length - 1];
        if (latest?.message) console.log(`   ⏳ ${latest.message}`);
      }
    },
  });

  // Extract video URL from result
  const videoUrl =
    (result as any).data?.video?.url ||
    (result as any).video?.url ||
    (result as any).data?.url;

  if (!videoUrl) {
    console.log("   📦 Full result:", JSON.stringify(result, null, 2));
    throw new Error(`No video URL in result for ${shot.name}`);
  }

  console.log(`   ✅ Generated: ${videoUrl}`);

  // Download
  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  const outPath = path.join(OUTPUT_DIR, `${shot.name}.mp4`);
  fs.writeFileSync(outPath, buffer);
  console.log(`   💾 Saved: ${outPath} (${(buffer.length / 1024).toFixed(0)}KB)`);

  return outPath;
}

async function main() {
  // Parse --shot flag for single shot generation
  const shotArg = process.argv.find((a) => a.startsWith("--shot"));
  const singleShot = shotArg
    ? parseInt(process.argv[process.argv.indexOf(shotArg) + 1] || shotArg.split("=")[1])
    : null;

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("🔥 QTIPOC CookOut Fire Animation — LTX-2 Generation");
  console.log("====================================================");
  console.log(`Output: ${OUTPUT_DIR}`);

  const shotsToGenerate = singleShot
    ? [SHOTS[singleShot - 1]]
    : SHOTS;

  if (singleShot) {
    console.log(`Generating shot ${singleShot} only`);
  } else {
    console.log(`Generating all 4 shots`);
  }

  const estimatedCost = shotsToGenerate.reduce((sum, s) => sum + s.duration * 0.06, 0);
  console.log(`Estimated cost: ~$${estimatedCost.toFixed(2)} (1080p @ $0.06/s)`);

  const results: string[] = [];

  for (let i = 0; i < shotsToGenerate.length; i++) {
    const shot = shotsToGenerate[i];
    try {
      const outPath = await generateShot(shot, singleShot ? singleShot - 1 : i);
      results.push(outPath);
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}`);
      // Continue with remaining shots
    }
  }

  console.log("\n====================================================");
  console.log(`✅ Generated ${results.length}/${shotsToGenerate.length} shots`);
  results.forEach((r) => console.log(`   ${r}`));

  if (results.length === 4) {
    console.log("\n💡 To stitch into a single video:");
    console.log(
      `   ffmpeg -f concat -safe 0 -i <(printf "file '%s'\\n" ${OUTPUT_DIR}/*.mp4) -c copy ${OUTPUT_DIR}/cookout-fire-sequence.mp4`
    );
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
