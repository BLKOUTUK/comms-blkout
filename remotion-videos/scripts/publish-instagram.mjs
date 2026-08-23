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
import { readFile } from "node:fs/promises";
import { stat, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const ROOT = resolve(import.meta.dirname, "..");
const GRAPH = "https://graph.facebook.com/v21.0";

const { values: args } = parseArgs({
  options: {
    "week-label": { type: "string" },
    aspect: { type: "string", default: "9x16" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
});

const REQUIRED = ["IG_USER_ID", "IG_ACCESS_TOKEN", "SUPABASE_URL",
                  "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_BUCKET"];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✗ Missing: ${missing.join(", ")}. Refusing to publish.`);
  process.exit(1);
}
const { IG_USER_ID, IG_ACCESS_TOKEN, SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET } = process.env;

function isoWeekTag(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil(((d - yearStart) / 86400000 + 1) / 7)).padStart(2, "0")}`;
}

const weekTag = args["week-label"] || isoWeekTag();
const videoPath = resolve(ROOT, `out/weekly-${weekTag}-${args.aspect}.mp4`);
const propsPath = resolve(ROOT, `props/weekly-${weekTag}.json`);

// ---- caption -------------------------------------------------------------
// 2,200 characters is Instagram's hard limit. Count, never assume.
function buildCaption(props) {
  const lines = [`BLKOUT News — ${props.weekLabel || weekTag}`, ""];
  for (const s of (props.stories || []).slice(0, 3)) lines.push(`• ${s.title}`);
  lines.push("", "You're the editor. Vote on the stories that matter to you:",
             props?.cta?.displayUrl || "news.blkoutuk.com", "",
             "#BlackQueer #BLKOUT #MakingSpaceForUs #BlackQueerMen #QueerUK");
  let caption = lines.join("\n");
  if (caption.length > 2200) caption = caption.slice(0, 2197) + "...";
  console.log(`  caption: ${caption.length}/2200 chars`);
  return caption;
}

// ---- 1. host the mp4 publicly -------------------------------------------
async function uploadToStorage(filePath, key) {
  const buf = await readFile(filePath);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "video/mp4",
      "x-upsert": "true",
    },
    body: buf,
  });
  if (!res.ok) throw new Error(`Supabase upload failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${key}`;

  // Instagram fetches this URL itself. If it is not publicly readable the
  // container fails with an opaque error, so prove reachability here instead.
  const head = await fetch(publicUrl, { method: "HEAD" });
  if (!head.ok) throw new Error(`Uploaded but not publicly reachable: HTTP ${head.status} — check bucket is public`);
  console.log(`  public: ${publicUrl} (${head.headers.get("content-length")} bytes)`);
  return publicUrl;
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
try {
  await stat(videoPath);
} catch {
  console.error(`✗ No video at ${videoPath}`);
  process.exit(1);
}
const props = JSON.parse(await readFile(propsPath, "utf8"));
const caption = buildCaption(props);

if (args["dry-run"]) {
  console.log(`▶ DRY RUN — would publish ${videoPath}\n---\n${caption}\n---`);
  process.exit(0);
}

console.log(`→ Publishing ${weekTag} to Instagram as a Reel`);
const publicUrl = await uploadToStorage(videoPath, `digests/weekly-${weekTag}-${args.aspect}.mp4`);
const containerId = await createContainer(publicUrl, caption);
await waitForContainer(containerId);
const postId = await publish(containerId);

const permalink = `https://www.instagram.com/reel/${postId}`;
console.log(`✓ Published: ${permalink}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `\n**Instagram:** [Reel ${postId}](${permalink}) · container \`${containerId}\`\n`);
}
