#!/usr/bin/env node
// BLKOUT What's On: getting the weekly AIvor events video out, with Rob's sign-off
// (Rob, 26 Oct 2026: sign-off on Telegram first; not through Zapier).
//
//   upload   Thursday 10:00, after the render: YouTube UNLISTED, a row in aivor_event_digests,
//            and the video to Rob on Telegram with a signed link to approve it.
//   publish  Thursday from 18:00, hourly: if Rob has approved, make it public and record it in
//            the content register. If not, the 18:00 run reminds him once; nothing goes out.
//
// The approve link is checked by events.blkoutuk.com/api/approve-events-video, which signs with
// the same Supabase service key (same pattern as the news editorial pick).
// Needs: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, YT_CLIENT_ID, YT_CLIENT_SECRET,
// YT_REFRESH_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const ROOT = resolve(import.meta.dirname, "..");
const APPROVE_URL = "https://events.blkoutuk.com/api/approve-events-video";

const { values: args, positionals } = parseArgs({
  options: {
    "week-label": { type: "string" },
    remind: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
  allowPositionals: true,
  strict: true,
});
const command = positionals[0];
if (!["upload", "publish"].includes(command)) {
  console.error("Usage: events-video.mjs upload|publish [--week-label 2026-W44] [--remind] [--dry-run]");
  process.exit(1);
}

const env = process.env;
for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", ...(args["dry-run"] ? [] : ["YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"])]) {
  if (!env[k]) {
    console.error(`✗ FAILED: ${k} not set.`);
    process.exit(1);
  }
}

// Same week rule as weekly-render.mjs: the ISO week of the coming Friday.
function isoWeekTag(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
const weekTag = args["week-label"] || isoWeekTag();

const db = (path, init = {}) =>
  fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

async function telegram(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, { method: "POST", body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(`Telegram ${method} failed: HTTP ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
}
const say = (text) =>
  telegram("sendMessage", new URLSearchParams({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: "true" }));

async function youtubeToken() {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.YT_CLIENT_ID,
      client_secret: env.YT_CLIENT_SECRET,
      refresh_token: env.YT_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error(`YouTube token refresh failed: ${r.status} ${await r.text()}`);
  return (await r.json()).access_token;
}

// The link is valid to the end of Friday, so a late yes still publishes on the next hourly run.
function approveLink() {
  const exp = Math.floor(Date.now() / 1000) + 2 * 86400;
  const sig = createHmac("sha256", env.SUPABASE_SERVICE_ROLE_KEY).update(`events-video:${weekTag}:${exp}`).digest("hex");
  return `${APPROVE_URL}?week=${weekTag}&exp=${exp}&sig=${sig}`;
}

async function upload() {
  const props = JSON.parse(await readFile(resolve(ROOT, `props/events-${weekTag}.json`), "utf8"));
  const videoPath = resolve(ROOT, `out/events-${weekTag}-9x16.mp4`);
  const size = (await stat(videoPath)).size;
  const range = props.dateRangeFrom && props.dateRangeTo ? `${props.dateRangeFrom}–${props.dateRangeTo}` : weekTag;
  const items = (props.teases || []).filter((t) => !/\/add\b/.test(t.url));
  const title = `BLKOUT What's On · ${props.weekLabel || weekTag} · ${range}`;
  const description = [
    "AIvor's pick of the gatherings worth your time this week, for Black queer people across the UK.",
    "",
    ...items.flatMap((t, i) => [`${i + 1}. ${t.title}${t.kind ? ` (${t.kind})` : ""}`, t.url, ""]),
    "Everything's at https://events.blkoutuk.com. Running something for Black queer people? Add it there: it's free.",
    "",
    "BLKOUT — community-owned media for and by Black queer men in the UK.",
    "",
    "#BLKOUT #BlackQueer #UKBlackQueer #WhatsOn #QTIPOC",
  ].join("\n");
  const summary = items.map((t) => t.title).join(" · ");

  if (args["dry-run"]) {
    console.log(`DRY RUN: would upload ${videoPath} (${(size / 1048576).toFixed(1)} MB) unlisted as "${title}"`);
    console.log(description);
    const check = await fetch(approveLink());
    console.log(check.ok ? `✓ events server accepts the signed link (HTTP ${check.status})` : `✗ FAILED: events server refused the signed link (HTTP ${check.status})`);
    if (!check.ok) process.exit(1);
    return;
  }

  const token = await youtubeToken();
  const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": "video/mp4",
      "X-Upload-Content-Length": String(size),
    },
    body: JSON.stringify({
      snippet: { title: title.slice(0, 100), description: description.slice(0, 5000), tags: ["BLKOUT", "Black Queer", "UK", "Events", "What's On", "Shorts"], categoryId: "25", defaultLanguage: "en" },
      status: { privacyStatus: "unlisted", selfDeclaredMadeForKids: false, embeddable: true },
    }),
  });
  if (!init.ok) throw new Error(`YouTube upload init failed: ${init.status} ${await init.text()}`);
  const put = await fetch(init.headers.get("location"), {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(size) },
    body: createReadStream(videoPath),
    duplex: "half",
  });
  if (!put.ok) throw new Error(`YouTube upload failed: ${put.status} ${await put.text()}`);
  const video = await put.json();
  const url = `https://www.youtube.com/watch?v=${video.id}`;
  console.log(`✓ Uploaded unlisted: ${url}`);

  // A re-run of the week replaces the row and needs a fresh yes.
  const row = await db("aivor_event_digests?on_conflict=week_tag", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ week_tag: weekTag, week_label: props.weekLabel || weekTag, video_id: video.id, video_url: url, summary, privacy: "unlisted", uploaded_at: new Date().toISOString(), approved_at: null, published_at: null }),
  });
  if (!row.ok) throw new Error(`aivor_event_digests write failed: ${row.status} ${await row.text()}`);

  const caption = [
    `BLKOUT What's On, ${props.weekLabel || weekTag} (${range}) is ready.`,
    "",
    ...items.map((t, i) => `${i + 1}. ${t.title}`),
    "",
    `Unlisted on YouTube: ${url}`,
    "",
    `Happy with it? Approve here and it goes public from 18:00: ${approveLink()}`,
    "No approval, no post.",
  ].join("\n");
  const form = new FormData();
  form.append("chat_id", env.TELEGRAM_CHAT_ID);
  form.append("supports_streaming", "true");
  form.append("video", new Blob([await readFile(videoPath)], { type: "video/mp4" }), `whats-on-${weekTag}.mp4`);
  try {
    await telegram("sendVideo", form);
    await say(caption);
  } catch (err) {
    // The video can be too big for the bot; the link alone still lets Rob watch and approve.
    console.log(`  video send failed (${err.message}); sending the links only`);
    await say(caption);
  }
  console.log("✓ Sent to Rob on Telegram for sign-off (signed link withheld from the log).");
}

async function publish() {
  const r = await db(`aivor_event_digests?week_tag=eq.${weekTag}&select=*`);
  if (!r.ok) throw new Error(`aivor_event_digests read failed: ${r.status} ${await r.text()}`);
  const [row] = await r.json();
  if (!row) {
    console.log(`No events video uploaded for ${weekTag}; nothing to publish.`);
    if (args.remind) await say(`BLKOUT What's On ${weekTag}: no video was uploaded this week, so nothing is going out. Check the Thursday 10:00 run.`);
    return;
  }
  if (row.published_at) {
    console.log(`${weekTag} already public (${row.published_at}).`);
    return;
  }
  if (!row.approved_at) {
    console.log(`${weekTag} not approved yet; staying unlisted.`);
    if (args.remind) await say(`BLKOUT What's On ${weekTag} is waiting for your yes: it stays unlisted until you approve. Use the link in this morning's message; it works until the end of Friday, and it goes public within the hour after you approve. ${row.video_url}`);
    return;
  }
  if (args["dry-run"]) {
    console.log(`DRY RUN: would make ${row.video_url} public.`);
    return;
  }

  const token = await youtubeToken();
  const upd = await fetch("https://www.googleapis.com/youtube/v3/videos?part=status", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: row.video_id, status: { privacyStatus: "public", selfDeclaredMadeForKids: false, embeddable: true } }),
  });
  if (!upd.ok) throw new Error(`YouTube privacy change failed: ${upd.status} ${await upd.text()}`);
  const confirmed = (await upd.json()).status?.privacyStatus;
  if (confirmed !== "public") throw new Error(`YouTube reports privacy '${confirmed}', not public`);
  const now = new Date().toISOString();
  const mark = await db(`aivor_event_digests?week_tag=eq.${weekTag}`, { method: "PATCH", body: JSON.stringify({ privacy: "public", published_at: now }) });
  if (!mark.ok) throw new Error(`aivor_event_digests update failed: ${mark.status} ${await mark.text()}`);

  // The content register, as the news digest does (register-content.mjs), keyed so a re-run
  // updates rather than stacks.
  const source = `routine:weekly-events-video#${weekTag}`;
  const entry = {
    title: `AIvor What's On — ${row.week_label}`,
    content_type: "video",
    status: "posted",
    published_at: now,
    primary_content: row.summary,
    media_urls: [row.video_url],
    generated_by_agent: "aivor",
    metadata: { campaign: "events-digest", channels: ["youtube"], source, posted: { youtube: { id: row.video_id, url: row.video_url, at: now } }, week_tag: weekTag, approved_at: row.approved_at },
  };
  const existing = await db(`content_calendar?select=id&metadata->>source=eq.${encodeURIComponent(source)}`);
  const id = existing.ok ? (await existing.json())[0]?.id : null;
  const reg = await db(id ? `content_calendar?id=eq.${id}` : "content_calendar", { method: id ? "PATCH" : "POST", body: JSON.stringify(entry) });
  if (!reg.ok) console.log(`⚠ content register write failed: ${reg.status} ${await reg.text()}`);

  await say(`BLKOUT What's On ${weekTag} is public: ${row.video_url}`);
  console.log(`✓ ${weekTag} public: ${row.video_url}`);
}

try {
  await (command === "upload" ? upload() : publish());
} catch (err) {
  console.error(`✗ FAILED: ${err.message}`);
  process.exit(1);
}
