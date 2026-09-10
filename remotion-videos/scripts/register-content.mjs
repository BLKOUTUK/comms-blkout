#!/usr/bin/env node
/**
 * Record the week's AIvor news digest as a `posted` row in the content
 * register (content_calendar). Rob, 10 Sep 2026: the digest is content and
 * belongs on the calendar, not just the aivor_digests side-table.
 *
 * Reads the digest already written by upload-youtube.mjs (aivor_digests,
 * keyed by week_tag) and upserts one content_calendar row keyed on
 * metadata->>'source' = routine:weekly-news-video#<week_tag>, so a re-run
 * of the same week PATCHes the existing row instead of stacking a second one.
 */
import { parseArgs } from "node:util";
import { isoWeekTag, weekEndingLabel } from "./lib/digest-common.mjs";

const { values: args } = parseArgs({
  options: {
    "week-label": { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
});

const weekTag = args["week-label"] || isoWeekTag();
const source = `routine:weekly-news-video#${weekTag}`;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("REGISTER NOT WRITTEN — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

const baseUrl = SUPABASE_URL.replace(/\/$/, "");
const headers = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

function buildUrl(path, params) {
  const qs = new URLSearchParams(params).toString();
  return `${baseUrl}${path}${qs ? `?${qs}` : ""}`;
}

async function fetchDigest(weekTag) {
  const res = await fetch(
    buildUrl("/rest/v1/aivor_digests", { week_tag: `eq.${weekTag}`, select: "*" }),
    { headers }
  );
  if (!res.ok) {
    throw new Error(`aivor_digests fetch failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  const rows = await res.json();
  if (!rows.length) {
    throw new Error(`no aivor_digests row for week_tag=${weekTag} — has upload-youtube.mjs run for this week?`);
  }
  return rows[0];
}

function buildRow(digest) {
  const weekLabel = digest.week_label || weekEndingLabel(weekTag);
  return {
    title: `AIvor news digest — ${weekLabel}`,
    content_type: "video",
    status: "posted",
    published_at: digest.published_at,
    primary_content: digest.summary,
    media_urls: [digest.video_url],
    generated_by_agent: "aivor",
    metadata: {
      campaign: "news-digest",
      channels: ["youtube", "instagram"],
      source,
      posted: {
        youtube: {
          id: digest.video_id,
          url: digest.video_url,
          at: digest.published_at,
        },
        instagram: {
          via: "monday distribution routine (Zapier)",
          recorded: false,
        },
      },
      week_tag: weekTag,
      week_label: weekLabel,
    },
  };
}

async function findExisting() {
  const res = await fetch(
    buildUrl("/rest/v1/content_calendar", { select: "id", "metadata->>source": `eq.${source}` }),
    { headers }
  );
  if (!res.ok) {
    throw new Error(`content_calendar lookup failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  const rows = await res.json();
  return rows[0]?.id || null;
}

async function upsert(row, existingId) {
  const url = existingId
    ? buildUrl("/rest/v1/content_calendar", { id: `eq.${existingId}` })
    : buildUrl("/rest/v1/content_calendar", {});
  const res = await fetch(url, {
    method: existingId ? "PATCH" : "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    throw new Error(`${existingId ? "PATCH" : "POST"} failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  const rows = await res.json();
  return rows[0];
}

try {
  const digest = await fetchDigest(weekTag);
  const row = buildRow(digest);

  if (args["dry-run"]) {
    console.log(`DRY RUN — would upsert content_calendar (source=${source}):`);
    console.log(JSON.stringify(row, null, 2));
    process.exit(0);
  }

  const existingId = await findExisting();
  const written = await upsert(row, existingId);

  console.log(
    `${existingId ? "PATCHED" : "CREATED"} content_calendar row: id=${written.id} status=${written.status} source=${source}`
  );
} catch (err) {
  console.error(`REGISTER NOT WRITTEN — ${err.message}`);
  process.exit(1);
}
