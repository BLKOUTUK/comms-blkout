#!/usr/bin/env node
import { readFile, stat, appendFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const ROOT = resolve(import.meta.dirname, "..");

const { values: args } = parseArgs({
  options: {
    "week-label": { type: "string" },
    aspect: { type: "string", default: "9x16" },
    privacy: { type: "string", default: process.env.YT_PRIVACY || "unlisted" },
  },
  strict: true,
});

const REQUIRED = ["YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"];
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.error(`${k} not set. Refusing to upload.`);
    process.exit(1);
  }
}

function isoWeekTag(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const weekTag = args["week-label"] || isoWeekTag();
const propsPath = resolve(ROOT, `props/weekly-${weekTag}.json`);
const videoPath = resolve(ROOT, `out/weekly-${weekTag}-${args.aspect}.mp4`);

const props = JSON.parse(await readFile(propsPath, "utf8"));
const fileStat = await stat(videoPath);

const dateRange =
  props.dateRangeFrom && props.dateRangeTo
    ? `${props.dateRangeFrom}–${props.dateRangeTo}`
    : weekTag;

const title = `BLKOUT News · ${props.weekLabel || weekTag} · ${dateRange}`;

const storyLines = (props.teases || [])
  .map((t, i) => `${i + 1}. ${t.title}\n${t.url || ""}`)
  .join("\n\n");

const description = [
  props.intro || "AIvor's weekly round-up of the stories that matter.",
  "",
  "This week's stories:",
  storyLines,
  "",
  `Vote on what matters at ${props.cta?.displayUrl || "news.blkoutuk.com"}.`,
  "",
  "BLKOUT — community-owned media for and by Black queer men in the UK.",
  "https://blkoutuk.com",
  "",
  "#BLKOUT #BlackQueerMen #UKBlackQueer #LGBTQNews #CommunityJournalism",
].join("\n");

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.YT_CLIENT_ID,
    client_secret: process.env.YT_CLIENT_SECRET,
    refresh_token: process.env.YT_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function initResumableUpload(accessToken) {
  const metadata = {
    snippet: {
      title: title.slice(0, 100),
      description: description.slice(0, 5000),
      tags: ["BLKOUT", "Black Queer", "UK", "News", "LGBTQ", "Shorts"],
      categoryId: "25",
      defaultLanguage: "en",
    },
    status: {
      privacyStatus: args.privacy,
      selfDeclaredMadeForKids: false,
      embeddable: true,
    },
  };
  const url =
    "https://www.googleapis.com/upload/youtube/v3/videos" +
    "?uploadType=resumable&part=snippet,status";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
      "X-Upload-Content-Length": String(fileStat.size),
    },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) {
    throw new Error(`Init upload failed: ${res.status} ${await res.text()}`);
  }
  const location = res.headers.get("location");
  if (!location) throw new Error("No Location header from YouTube init");
  return location;
}

async function uploadBytes(uploadUrl) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(fileStat.size),
    },
    body: createReadStream(videoPath),
    duplex: "half",
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

console.log(`Uploading to YouTube: ${videoPath}`);
console.log(`  size: ${(fileStat.size / 1024 / 1024).toFixed(1)} MB`);
console.log(`  title: ${title}`);
console.log(`  privacy: ${args.privacy}`);

const accessToken = await getAccessToken();
const uploadUrl = await initResumableUpload(accessToken);
const result = await uploadBytes(uploadUrl);

console.log(`✓ Uploaded.`);
console.log(`  video id: ${result.id}`);
console.log(`  https://www.youtube.com/watch?v=${result.id}`);

// --- Publish ---------------------------------------------------------------
// The digest row goes straight to Supabase and the news site panel reads the
// newest one at runtime. No commit, no redeploy, no human step. The paste-ready
// block below is kept only as a manual fallback if the write fails.

const watchUrl = `https://www.youtube.com/watch?v=${result.id}`;
const digestWeekLabel = props.dateRangeTo
  ? `Week ending ${props.dateRangeTo}`
  : props.weekLabel || weekTag;
const teaseTitles = (props.teases || []).map((t) => t.title).filter(Boolean);
const digestSummary = teaseTitles.length
  ? `${teaseTitles.length} stories the community voted up — ${teaseTitles.join(", ")}.`
  : props.intro || "AIvor's weekly round-up of the stories that matter.";

const digestBlock = [
  "export const latestDigest: AIvorDigest = {",
  `  weekLabel: ${JSON.stringify(digestWeekLabel)},`,
  `  videoUrl: ${JSON.stringify(watchUrl)},`,
  `  format: 'short',`,
  `  summary:`,
  `    ${JSON.stringify(digestSummary)},`,
  `  youtubeChannelUrl: 'https://www.youtube.com/channel/UC7g_Es50958bYJauxym0n1A',`,
  "};",
].join("\n");

// Push the digest to Supabase so the news site panel picks it up on next load.
// Upsert on week_tag so a re-run of the same week replaces rather than stacks.
async function publishToSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { ok: false, detail: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set" };
  }
  const res = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/aivor_digests?on_conflict=week_tag`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        week_tag: weekTag,
        week_label: digestWeekLabel,
        video_url: watchUrl,
        video_id: result.id,
        format: "short",
        summary: digestSummary,
        privacy: args.privacy,
        published_at: new Date().toISOString(),
      }),
    }
  );
  if (!res.ok) {
    return { ok: false, detail: `HTTP ${res.status} ${await res.text()}` };
  }
  return { ok: true };
}

let published = { ok: false, detail: "not attempted" };
try {
  published = await publishToSupabase();
} catch (err) {
  published = { ok: false, detail: err.message };
}

// A failed write must not fail the run — the video is already up, and the
// fallback block below still lets a human publish by hand.
if (published.ok) {
  console.log(`✓ Digest row written to Supabase (week ${weekTag}).`);
} else {
  console.log(`⚠ Supabase digest write failed: ${published.detail}`);
}

const publishSummary = published.ok
  ? [
      "## 📺 Weekly digest — published",
      "",
      `**Video:** [${title}](${watchUrl}) · privacy: \`${args.privacy}\``,
      "",
      `Digest row written to Supabase for week \`${weekTag}\`. The news site panel`,
      "reads the newest row at load — nothing further to do.",
      "",
    ].join("\n")
  : [
      "## ⚠ Weekly digest — uploaded, but the site panel did NOT update",
      "",
      `**Video:** [${title}](${watchUrl}) · privacy: \`${args.privacy}\``,
      "",
      `Supabase write failed: \`${published.detail}\``,
      "",
      "Fallback — replace the `latestDigest` export in",
      "`news-blkout/src/config/aivorDigest.ts` with the block below and commit it.",
      "",
      "```ts",
      digestBlock,
      "```",
      "",
    ].join("\n");

console.log("\n" + publishSummary);
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, publishSummary + "\n");
}
