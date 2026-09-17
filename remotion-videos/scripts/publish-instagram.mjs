#!/usr/bin/env node
/**
 * Publish the weekly digest to Instagram as a Reel.
 *
 * Instagram video CANNOT be published in one call. The container must finish
 * processing server-side first, and publishing early fails. That is why
 * Zapier's publish_video "times out and posts nothing", and why
 * src/services/socialsync/platforms/instagram.ts (create -> publish, no poll,
 * no media_type) cannot ship video either.
 *
 *   1. upload the mp4 somewhere publicly reachable   (Supabase public storage)
 *   2. POST /{ig-user-id}/media   media_type=REELS, video_url, caption
 *   3. GET  /{container-id}?fields=status_code       POLL until FINISHED
 *   4. POST /{ig-user-id}/media_publish  creation_id
 *
 * Step 3 is the one everything else omits.
 */
import { appendFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { isoWeekTag } from "./lib/digest-common.mjs";

const GRAPH = "https://graph.facebook.com/v21.0";

const { values: args } = parseArgs({
  options: {
    "week-label": { type: "string" },
    aspect: { type: "string", default: "9x16" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
});

const REQUIRED = ["IG_USER_ID", "IG_ACCESS_TOKEN", "SUPABASE_URL", "SUPABASE_BUCKET"];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✗ Missing: ${missing.join(", ")}. Refusing to publish.`);
  process.exit(1);
}
const { IG_USER_ID, IG_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_BUCKET } = process.env;

const weekTag = args["week-label"] || isoWeekTag();

// Runs as a separate, environment-gated job from the render/host job, so it
// has no local render artifacts to work from — it reads the ALREADY-HOSTED
// manifest host-digest.mjs produced (same source the Monday distribution
// routine reads) rather than re-deriving caption/video from local files and
// re-uploading a second time. One hosted artifact, two publish paths.
async function loadHostedManifest() {
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${SUPABASE_BUCKET}/digests/weekly-${weekTag}.json`;
  const res = await fetch(`${url}?t=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`Hosted manifest not found at ${url} (HTTP ${res.status}) — run host-digest.mjs first`);
  }
  const manifest = await res.json();
  if (manifest.week_tag !== weekTag) {
    throw new Error(`Hosted manifest is for ${manifest.week_tag}, expected ${weekTag}`);
  }
  return manifest;
}

// ---- 2. create container -------------------------------------------------
async function createContainer(videoUrl, caption) {
  const body = new URLSearchParams({
    media_type: "REELS",          // required for 9:16 video; omitting it fails
    video_url: videoUrl,
    caption,
    share_to_feed: "true",
    access_token: IG_ACCESS_TOKEN,
  });
  const res = await fetch(`${GRAPH}/${IG_USER_ID}/media`, { method: "POST", body });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(`Container create failed: HTTP ${res.status} ${JSON.stringify(data).slice(0, 400)}`);
  }
  console.log(`  container: ${data.id}`);
  return data.id;
}

// ---- 3. THE POLL — the step everything else omits -------------------------
async function waitForContainer(containerId, { timeoutMs = 10 * 60 * 1000, intervalMs = 10_000 } = {}) {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < timeoutMs) {
    const res = await fetch(
      `${GRAPH}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(IG_ACCESS_TOKEN)}`
    );
    const data = await res.json();
    const code = data.status_code;
    if (code !== last) {
      console.log(`  status: ${code}${data.status ? ` — ${data.status}` : ""} (${Math.round((Date.now() - started) / 1000)}s)`);
      last = code;
    }
    if (code === "FINISHED") return true;
    if (code === "ERROR" || code === "EXPIRED") {
      throw new Error(`Container ${code}: ${data.status || "no detail given"}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Container still ${last || "unknown"} after ${timeoutMs / 1000}s — not publishing a container that never finished`);
}

// ---- 4. publish ----------------------------------------------------------
async function publish(containerId) {
  const body = new URLSearchParams({ creation_id: containerId, access_token: IG_ACCESS_TOKEN });
  const res = await fetch(`${GRAPH}/${IG_USER_ID}/media_publish`, { method: "POST", body });
  const data = await res.json();
  // Never report success on a response we have not checked — the existing
  // socialsync service returns success:true unconditionally, which is how a
  // failed publish looks identical to a successful one.
  if (!res.ok || !data.id) {
    throw new Error(`Publish failed: HTTP ${res.status} ${JSON.stringify(data).slice(0, 400)}`);
  }
  return data.id;
}

// ---- run -----------------------------------------------------------------
const manifest = await loadHostedManifest();
const publicUrl = manifest.video_url;
const caption = manifest.caption;

if (args["dry-run"]) {
  console.log(`▶ DRY RUN — would publish ${publicUrl}\n---\n${caption}\n---`);
  process.exit(0);
}

console.log(`→ Publishing ${weekTag} to Instagram as a Reel (from hosted manifest)`);
const containerId = await createContainer(publicUrl, caption);
await waitForContainer(containerId);
const postId = await publish(containerId);

const permalink = `https://www.instagram.com/reel/${postId}`;
console.log(`✓ Published: ${permalink}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `\n**Instagram:** [Reel ${postId}](${permalink}) · container \`${containerId}\`\n`);
}
