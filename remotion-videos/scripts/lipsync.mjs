#!/usr/bin/env node
import { writeFile, readFile, mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { Agent, setGlobalDispatcher } from "undici";

setGlobalDispatcher(
  new Agent({
    headersTimeout: 15 * 60 * 1000,
    bodyTimeout: 15 * 60 * 1000,
    connectTimeout: 30 * 1000,
  })
);

async function loadEnv(envPath) {
  try {
    const text = await readFile(envPath, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^"|"$/g, "");
      }
    }
  } catch {}
}
await loadEnv("/home/robbe/blkout-platform/.env");

const SADTALKER_VERSION =
  "a519cc0cfebaaeade068b23899165a11ec76aaa1d2b313d40d214f204ec957a3";
const CHATTERBOX_URL =
  process.env.CHATTERBOX_URL || "https://chatterbox.blkoutuk.cloud";
let VOICE_REFERENCE =
  process.env.AIVOR_VOICE_REFERENCE ||
  "/home/robbe/blkout-platform/apps/ivor-core/public/gielgud4AIvor.mp3";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "aivor-pipeline";

const { values: args } = parseArgs({
  options: {
    script: { type: "string" },
    audio: { type: "string" },
    image: { type: "string" },
    "image-url": { type: "string" },
    out: { type: "string" },
    enhancer: { type: "boolean", default: true },
  },
  strict: true,
});

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_TOKEN) {
  console.error(
    "REPLICATE_API_TOKEN not set. Export it before running this script."
  );
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required (loaded from /home/robbe/blkout-platform/.env)."
  );
  process.exit(1);
}
if ((!args.script && !args.audio) || !args.out || (!args.image && !args["image-url"])) {
  console.error(
    "Usage: lipsync.mjs (--script <text or @file> | --audio <wav>) --image <path> | --image-url <url> --out <mp4>"
  );
  process.exit(1);
}

async function fetchScriptText(spec) {
  if (spec.startsWith("@")) {
    return (await readFile(spec.slice(1), "utf8")).trim();
  }
  return spec;
}

function guessContentType(filePath) {
  const ext = filePath.toLowerCase().split(".").pop();
  return (
    {
      wav: "audio/wav",
      mp3: "audio/mpeg",
      m4a: "audio/mp4",
      ogg: "audio/ogg",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      mp4: "video/mp4",
    }[ext] || "application/octet-stream"
  );
}

async function uploadFile(filePath, key) {
  const buf = await readFile(filePath);
  const url = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": guessContentType(filePath),
      "x-upsert": "true",
    },
    body: buf,
  });
  if (!res.ok) {
    throw new Error(
      `Supabase upload failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`
    );
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`;
}

async function tts(text, outPath) {
  console.log(`→ TTS via Chatterbox (${text.length} chars)`);
  const form = new FormData();
  form.append("input", text);
  const voiceBuf = await readFile(VOICE_REFERENCE);
  form.append(
    "voice_file",
    new Blob([voiceBuf]),
    VOICE_REFERENCE.split("/").pop()
  );
  const controller = new AbortController();
  const ttsTimeoutMs = 15 * 60 * 1000;
  const t = setTimeout(() => controller.abort(), ttsTimeoutMs);
  let res;
  try {
    res = await fetch(`${CHATTERBOX_URL}/v1/audio/speech/upload`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
  if (!res.ok) {
    throw new Error(
      `Chatterbox TTS failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`
    );
  }
  const wav = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, wav);
  console.log(`  wrote ${outPath} (${wav.length} bytes)`);
  return outPath;
}

async function sadtalker({ imageUrl, audioUrl, useEnhancer }) {
  console.log(`→ SadTalker via Replicate (enhancer=${useEnhancer})`);
  const submit = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: SADTALKER_VERSION,
      input: {
        source_image: imageUrl,
        driven_audio: audioUrl,
        preprocess: "full",
        still_mode: true,
        use_enhancer: useEnhancer,
        use_eyeblink: true,
        expression_scale: 1.1,
        size_of_image: 512,
      },
    }),
  });
  const submitJson = await submit.json();
  const id = submitJson.id;
  if (!id) {
    throw new Error(
      `Replicate submit failed: ${JSON.stringify(submitJson).slice(0, 400)}`
    );
  }
  console.log(`  prediction id: ${id}`);

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 10000));
    const poll = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      { headers: { Authorization: `Token ${REPLICATE_TOKEN}` } }
    );
    const pollJson = await poll.json();
    process.stdout.write(`  ${pollJson.status} `);
    if (pollJson.status === "succeeded") {
      console.log(
        `(${pollJson.metrics?.predict_time?.toFixed(1)}s)`
      );
      return pollJson.output;
    }
    if (pollJson.status === "failed" || pollJson.status === "canceled") {
      throw new Error(`Replicate ${pollJson.status}: ${pollJson.error}`);
    }
  }
  throw new Error("Replicate poll timed out after 10 min");
}

async function downloadFile(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, buf);
  console.log(`  wrote ${outPath} (${buf.length} bytes)`);
}

async function resolveVoiceReference() {
  if (!/^https?:\/\//i.test(VOICE_REFERENCE)) return;
  const url = VOICE_REFERENCE;
  const filename = (url.split("/").pop() || "voice-ref.mp3").split("?")[0];
  const tmpDir = "/tmp/aivor-lipsync";
  await mkdir(tmpDir, { recursive: true });
  const tmpPath = resolve(tmpDir, filename);
  console.log(`→ Fetching voice reference: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Voice reference fetch failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(tmpPath, buf);
  VOICE_REFERENCE = tmpPath;
  console.log(`  cached to ${tmpPath} (${buf.length} bytes)`);
}

async function main() {
  const outVideo = resolve(args.out);
  const outDir = dirname(outVideo);
  const audioPath = resolve(outDir, "voice.wav");
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (args.audio) {
    console.log(`→ Using existing audio: ${args.audio}`);
    await mkdir(dirname(audioPath), { recursive: true });
    await copyFile(resolve(args.audio), audioPath);
  } else {
    await resolveVoiceReference();
    const scriptText = await fetchScriptText(args.script);
    await tts(scriptText, audioPath);
  }
  console.log("→ Uploading audio to Supabase storage");
  const audioUrl = await uploadFile(audioPath, `runs/${stamp}/voice.wav`);
  console.log(`  audio_url: ${audioUrl}`);

  let imageUrl = args["image-url"];
  if (!imageUrl) {
    console.log("→ Uploading source image to Supabase storage");
    const imgPath = resolve(args.image);
    const ext = imgPath.split(".").pop();
    imageUrl = await uploadFile(imgPath, `runs/${stamp}/source.${ext}`);
    console.log(`  image_url: ${imageUrl}`);
  }

  const resultUrl = await sadtalker({
    imageUrl,
    audioUrl,
    useEnhancer: args.enhancer,
  });
  console.log(`→ Downloading talking-head mp4`);
  await downloadFile(resultUrl, outVideo);
  console.log(`✓ Lipsync complete: ${outVideo}`);
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
