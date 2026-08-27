#!/usr/bin/env node
/**
 * Host the weekly digest at stable public URLs so distribution can happen
 * WITHOUT any Meta credential in this repo:
 *
 *   {bucket}/digests/weekly-{week}-{aspect}.mp4   Reel-ready video
 *   {bucket}/digests/weekly-{week}.json           per-week manifest
 *   {bucket}/digests/latest.json                  pointer the Monday routine reads
 *
 * The Monday Instagram routine (Zapier raw-request flow, no token needed)
 * fetches latest.json and publishes from video_url + caption. The routine
 * refuses a manifest older than 8 days, so a Sunday failure here surfaces
 * Monday morning as a NO-REPORT message — never a silently re-posted stale
 * digest. Failures here are LOUD (exit 1): a hosting step that shrugs is how
 * the site panel sat three weeks stale without anyone noticing.
 */
import { readFile, stat, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { isoWeekTag, buildCaption, putObject, uploadToStorage } from "./lib/digest-common.mjs";

const ROOT = resolve(import.meta.dirname, "..");

const { values: args } = parseArgs({
  options: {
    "week-label": { type: "string" },
    aspect: { type: "string", default: "9x16" },
  },
  strict: true,
});

const REQUIRED = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_BUCKET"];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✗ FAILED — missing: ${missing.join(", ")}. Refusing to host.`);
  process.exit(1);
}
const storage = {
  supabaseUrl: process.env.SUPABASE_URL.replace(/\/$/, ""),
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  bucket: process.env.SUPABASE_BUCKET,
};

const weekTag = args["week-label"] || isoWeekTag();
const videoPath = resolve(ROOT, `out/weekly-${weekTag}-${args.aspect}.mp4`);
const propsPath = resolve(ROOT, `props/weekly-${weekTag}.json`);

try {
  await stat(videoPath);
  const props = JSON.parse(await readFile(propsPath, "utf8"));
  const caption = buildCaption(props, weekTag);

  console.log(`→ Hosting digest ${weekTag} for distribution`);
  const videoUrl = await uploadToStorage(videoPath, `digests/weekly-${weekTag}-${args.aspect}.mp4`, storage);

  const manifest = JSON.stringify({
    week_tag: weekTag,
    week_label: props.weekLabel || weekTag,
    aspect: args.aspect,
    video_url: videoUrl,
    caption,
    stories: (props.stories || []).slice(0, 3).map((s) => s.title),
    hosted_at: new Date().toISOString(),
  }, null, 2);

  const jsonOpts = { ...storage, contentType: "application/json" };
  await putObject(manifest, `digests/weekly-${weekTag}.json`, jsonOpts);
  const latestUrl = await putObject(manifest, "digests/latest.json", jsonOpts);

  // Assert identity, not liveness: read latest.json back and confirm it is
  // THIS week's manifest, not whatever a cache or failed upsert left behind.
  const readBack = await (await fetch(`${latestUrl}?t=${Date.now()}`)).json();
  if (readBack.week_tag !== weekTag) {
    throw new Error(`latest.json reads back as ${readBack.week_tag}, expected ${weekTag}`);
  }

  console.log(`✓ Hosted ${weekTag}: video + manifest + latest.json verified`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY,
      `\n**Hosted for distribution:** [video](${videoUrl}) · [manifest](${latestUrl}) (${weekTag})\n`);
  }
} catch (err) {
  console.error(`✗ FAILED — digest ${weekTag} not hosted: ${err.message}`);
  process.exit(1);
}
