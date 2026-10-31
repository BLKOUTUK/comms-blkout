#!/usr/bin/env node
// BLKOUT What's On: getting the weekly AIvor events video out, with Rob's sign-off
// (Rob, 26 Oct 2026: sign-off on Telegram first; not through Zapier).
//
//   upload   Thursday 10:00, after the render: YouTube UNLISTED, a row in aivor_event_digests,
//            and the video to Rob on Telegram with a signed link to approve it.
//            The mp4 also goes to public storage, and the Instagram caption is in the same message,
//            so one yes covers both.
//   publish  Thursday from 18:00, hourly: if Rob has approved, make it public on YouTube, post it
//            to Instagram as a Reel and to the Facebook Page (direct Graph API, as news-wire.mjs
//            does) and the LinkedIn company page (lib/linkedin.mjs, its own caption), and record
//            it in the content register. If not, the 18:00 run reminds him once; nothing goes out.
//
// The approve link is checked by events.blkoutuk.com/api/approve-events-video, which signs with
// the same Supabase service key (same pattern as the news editorial pick).
//
// --kind news (31 Oct 2026, Rob: "full What's On flow for the news digest too"): the Sunday
// AIvor news digest. weekly-news-video.yml uploads it UNLISTED (upload-youtube.mjs) and hosts it
// (host-digest.mjs); `request` then asks Rob on Telegram, and `publish` (publish-news-video.yml,
// hourly Sunday and Monday) does the rest exactly as for What's On, against aivor_digests.
//
// Reply to approve (31 Oct 2026): Rob replies "approved" on Telegram. @Bayard2bot can't carry it
// (Bayard2 reads every message to that bot, and Telegram gives a bot's messages to one reader),
// so sign-off requests go from a separate approvals bot (APPROVALS_BOT_TOKEN) and publish reads
// replies to it with getUpdates. A reply to a request counts for that request; a plain
// "approved" counts for any request still waiting. The signed link stays as the backup.
// Needs: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, YT_CLIENT_ID, YT_CLIENT_SECRET,
// YT_REFRESH_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID; SUPABASE_BUCKET (upload) and
// META_PAGE_TOKEN (publish); LINKEDIN_REFRESH_TOKEN + LINKEDIN_CLIENT_SECRET for LinkedIn, which is
// skipped (Rob told) while they are unset.
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { uploadToStorage } from "./lib/digest-common.mjs";
import { linkedinToken, linkedinRefreshDaysLeft, postVideo } from "./lib/linkedin.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const APPROVE_URL = "https://events.blkoutuk.com/api/approve-events-video";
const GRAPH = "https://graph.facebook.com/v21.0";
const IG_ID = "17841403920630280", PAGE_ID = "252227404975585";

const { values: args, positionals } = parseArgs({
  options: {
    "week-label": { type: "string" },
    kind: { type: "string", default: "events" },
    remind: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
  allowPositionals: true,
  strict: true,
});
const command = positionals[0];
const KINDS = {
  events: {
    name: "BLKOUT What's On", table: "aivor_event_digests", source: "routine:weekly-events-video",
    campaign: "events-digest", register: "AIvor What's On", sig: "events-video", commands: ["upload", "publish"],
    when: "from 18:00 Thursday (or within the hour, if later)",
  },
  news: {
    name: "BLKOUT News", table: "aivor_digests", source: "routine:weekly-news-video",
    campaign: "news-digest", register: "AIvor News Digest", sig: "news-video", commands: ["request", "publish"],
    when: "within the hour",
  },
};
const K = KINDS[args.kind];
if (!K || !K.commands.includes(command)) {
  console.error("Usage: events-video.mjs upload|publish [--kind events] | request|publish --kind news  [--week-label 2026-W44] [--remind] [--dry-run]");
  process.exit(1);
}

const env = process.env;
const live = args["dry-run"] ? [] : command === "request" ? ["SUPABASE_BUCKET"] : ["YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN", ...(command === "upload" ? ["SUPABASE_BUCKET"] : ["META_PAGE_TOKEN"])];
for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", ...live]) {
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
// The news digest goes out on Sunday, the last day of its ISO week, and is published on Sunday or
// Monday: yesterday's week is the right one on both days.
const weekTag = args["week-label"] || isoWeekTag(args.kind === "news" ? new Date(Date.now() - 86400000) : new Date());
const TAG = `${K.name} ${weekTag}`; // every sign-off message carries this, so a reply can be matched to it

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

// Everything goes from the approvals bot once it exists, so Rob can reply to any of it.
const BOT = env.APPROVALS_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
async function telegram(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${BOT}/${method}`, { method: "POST", body });
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

// The link is valid for 48 hours from when it is sent.
function approveLink() {
  const exp = Math.floor(Date.now() / 1000) + 2 * 86400;
  const sig = createHmac("sha256", env.SUPABASE_SERVICE_ROLE_KEY).update(`${K.sig}:${weekTag}:${exp}`).digest("hex");
  return `${APPROVE_URL}?week=${weekTag}&exp=${exp}&sig=${sig}${args.kind === "events" ? "" : `&kind=${args.kind}`}`;
}

// How Rob says yes, written into every request.
function howToApprove() {
  return env.APPROVALS_BOT_TOKEN
    ? `Happy with it? Reply "approved" to this message and it goes public ${K.when} on YouTube, Instagram (as a Reel), the Facebook Page and LinkedIn. Or use this link (valid 48 hours): ${approveLink()}`
    : `Happy with it? Open this link and tap "Yes, publish it" (valid 48 hours); it goes public ${K.when} on YouTube, Instagram (as a Reel), the Facebook Page and LinkedIn: ${approveLink()}`;
}

// Rob's "approved" on Telegram, if he has sent one since this week's request. getUpdates without
// an offset reads without consuming, so the hourly runs of both kinds can all look; Telegram keeps
// unread messages for 24 hours, which the hourly runs cover.
async function replyApproval(row) {
  if (!env.APPROVALS_BOT_TOKEN || !row.uploaded_at) return null;
  const r = await fetch(`https://api.telegram.org/bot${env.APPROVALS_BOT_TOKEN}/getUpdates?timeout=0&allowed_updates=${encodeURIComponent('["message"]')}`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) {
    console.log(`⚠ could not read Telegram replies: HTTP ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
    return null;
  }
  const since = Date.parse(row.uploaded_at) / 1000;
  for (const { message: m } of j.result || []) {
    if (!m || String(m.chat?.id) !== String(env.TELEGRAM_CHAT_ID) || m.date < since) continue;
    if (!/^\s*(approved?|yes|publish)\b/i.test(m.text || "")) continue;
    const to = m.reply_to_message ? m.reply_to_message.text || m.reply_to_message.caption || "" : null;
    if (to !== null && !to.includes(TAG)) continue; // a reply to a different request
    return new Date(m.date * 1000).toISOString();
  }
  return null;
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
  const igCaption = [
    `BLKOUT What's On, ${range}. AIvor's pick of the gatherings worth your time this week, for Black queer people across the UK.`,
    "",
    ...items.map((t) => {
      const where = t.where ? `, ${t.where.split(",")[0]}` : "";
      const kind = t.kind ? `: ${t.kind}` : "";
      return `${t.hook.split(". ")[0]} · ${t.title.replace(/\.{2,}/g, " ")}${kind}${where}`;
    }),
    "",
    "Details for each at events.blkoutuk.com (link in bio).",
    "",
    "Running something for Black queer people? Put it on the list. It's free, and we'll help your people find you.",
    "",
    "#BLKOUT #BlackQueer #BlackQueerMen #QueerUK #WhatsOn #BlackQueerJoy",
  ].join("\n");
  if (igCaption.length > 2200) throw new Error(`Instagram caption ${igCaption.length}/2200 characters`);
  // LinkedIn gets its own copy: organisers first, a professional audience (Rob, 2 Aug 2026:
  // personal stakes, not listings). The events are the evidence, not the headline.
  const liCaption = [
    "Every gathering in this week's BLKOUT What's On exists because someone booked the room, found the money and told people. Often on top of a day job.",
    "",
    "This week AIvor, our AI presenter, picks out:",
    ...items.map((t) => `• ${t.hook.split(". ")[0]} · ${t.title.replace(/\.{2,}/g, " ")}${t.where ? `, ${t.where.split(",")[0]}` : ""}`),
    "",
    "If you organise for Black queer people in the UK, or host, fund or employ people who do, list it at events.blkoutuk.com. It's free, and we'll help your people find you.",
  ].join("\n");
  if (liCaption.length > 3000) throw new Error(`LinkedIn caption ${liCaption.length}/3000 characters`);

  if (args["dry-run"]) {
    console.log(`DRY RUN: would upload ${videoPath} (${(size / 1048576).toFixed(1)} MB) unlisted as "${title}"`);
    console.log(description);
    console.log(`--- Instagram caption (${igCaption.length}/2200) ---\n${igCaption}\n---`);
    console.log(`--- LinkedIn caption (${liCaption.length}/3000) ---\n${liCaption}\n---`);
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

  // Instagram fetches the Reel from a public URL, so host the same file now; publish posts it.
  const mediaUrl = await uploadToStorage(videoPath, `events-digest/${weekTag}.mp4`, {
    supabaseUrl: env.SUPABASE_URL, serviceKey: env.SUPABASE_SERVICE_ROLE_KEY, bucket: env.SUPABASE_BUCKET,
  });
  console.log(`✓ Hosted for Instagram: ${mediaUrl}`);

  // A re-run of the week replaces the row and needs a fresh yes.
  const row = await db(`${K.table}?on_conflict=week_tag`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ week_tag: weekTag, week_label: props.weekLabel || weekTag, video_id: video.id, video_url: url, summary, privacy: "unlisted", uploaded_at: new Date().toISOString(), approved_at: null, published_at: null, media_url: mediaUrl, ig_caption: igCaption, li_caption: liCaption, instagram_url: null, facebook_url: null, linkedin_url: null }),
  });
  if (!row.ok) throw new Error(`${K.table} write failed: ${row.status} ${await row.text()}`);

  const caption = [
    `${TAG} (${range}) is ready.`,
    "",
    ...items.map((t, i) => `${i + 1}. ${t.title}`),
    "",
    `Unlisted on YouTube: ${url}`,
    "",
    howToApprove(),
    "No approval, no post.",
  ].join("\n");
  const igPreview = `Instagram and Facebook caption for ${TAG}:\n\n${igCaption}`;
  const form = new FormData();
  form.append("chat_id", env.TELEGRAM_CHAT_ID);
  form.append("supports_streaming", "true");
  form.append("video", new Blob([await readFile(videoPath)], { type: "video/mp4" }), `whats-on-${weekTag}.mp4`);
  try {
    await telegram("sendVideo", form);
  } catch (err) {
    // The video can be too big for the bot; the link alone still lets Rob watch and approve.
    console.log(`  video send failed (${err.message}); sending the links only`);
  }
  await say(caption);
  await say(igPreview);
  await say(`LinkedIn caption (company page) for ${TAG}:\n\n${liCaption}`);
  console.log("✓ Sent to Rob on Telegram for sign-off (signed link withheld from the log).");
}

// News digest: already uploaded unlisted and hosted by weekly-news-video.yml. Record what the
// publish run needs on the aivor_digests row and ask Rob. A re-run of the week needs a fresh yes.
async function request() {
  const r = await db(`${K.table}?week_tag=eq.${weekTag}&select=*`);
  if (!r.ok) throw new Error(`${K.table} read failed: ${r.status} ${await r.text()}`);
  const [row] = await r.json();
  if (!row) throw new Error(`no ${K.table} row for ${weekTag}: the YouTube upload step did not record one`);
  const base = `${env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${env.SUPABASE_BUCKET}`;
  const mr = await fetch(`${base}/digests/weekly-${weekTag}.json?t=${Date.now()}`);
  if (!mr.ok) throw new Error(`hosted manifest digests/weekly-${weekTag}.json: HTTP ${mr.status}`);
  const manifest = await mr.json();
  if (manifest.week_tag && manifest.week_tag !== weekTag) throw new Error(`manifest is for ${manifest.week_tag}, expected ${weekTag}`);
  const igCaption = manifest.caption;
  if (!manifest.video_url || !igCaption) throw new Error("manifest has no video_url or caption");
  const stories = igCaption.split("\n").filter((l) => l.startsWith("• "));
  const liCaption = [
    "This week's BLKOUT News, presented by AIvor, our AI presenter: the stories that matter to Black queer men in the UK, chosen by the community that reads them.",
    "",
    ...stories,
    "",
    "Read them, and vote on what makes next week's edition, at news.blkoutuk.com.",
  ].join("\n");

  if (args["dry-run"]) {
    console.log(`DRY RUN: would ask Rob to approve ${row.video_url} (${row.privacy}), hosted ${manifest.video_url}`);
    console.log(`--- Instagram caption (${igCaption.length}/2200) ---\n${igCaption}\n---\n--- LinkedIn caption ---\n${liCaption}\n---`);
    return;
  }
  const upd = await db(`${K.table}?week_tag=eq.${weekTag}`, {
    method: "PATCH",
    body: JSON.stringify({ uploaded_at: new Date().toISOString(), approved_at: null, published_at: null, media_url: manifest.video_url, ig_caption: igCaption, li_caption: liCaption, instagram_url: null, facebook_url: null, linkedin_url: null }),
  });
  if (!upd.ok) throw new Error(`${K.table} update failed: ${upd.status} ${await upd.text()}`);

  try {
    await telegram("sendVideo", new URLSearchParams({ chat_id: env.TELEGRAM_CHAT_ID, video: manifest.video_url, supports_streaming: "true", caption: TAG }));
  } catch (err) {
    console.log(`  video send failed (${err.message}); sending the links only`);
  }
  await say([`${TAG} is ready.`, "", ...stories, "", `${row.privacy === "public" ? "Already public" : "Unlisted"} on YouTube: ${row.video_url}`, "", howToApprove(), "No approval, no post."].join("\n"));
  await say(`Instagram and Facebook caption for ${TAG}:\n\n${igCaption}`);
  await say(`LinkedIn caption (company page) for ${TAG}:\n\n${liCaption}`);
  console.log("✓ Sent to Rob on Telegram for sign-off (signed link withheld from the log).");
}

async function publish() {
  const r = await db(`${K.table}?week_tag=eq.${weekTag}&select=*`);
  if (!r.ok) throw new Error(`${K.table} read failed: ${r.status} ${await r.text()}`);
  const [row] = await r.json();
  if (!row) {
    console.log(`No ${K.name} video uploaded for ${weekTag}; nothing to publish.`);
    if (args.remind) await say(`${TAG}: no video was uploaded this week, so nothing is going out. Check this week's render run.`);
    return;
  }
  if (row.published_at) {
    const left = row.media_url ? SOCIAL.filter((c) => !row[c.column]) : [];
    if (!left.length) {
      console.log(`${weekTag} already public (${row.published_at}).`);
      return;
    }
    // YouTube went public on an earlier run but a channel failed: retry just those.
    if (args["dry-run"]) return console.log(`DRY RUN: would retry ${left.map((c) => c.name).join(", ")} for ${weekTag}.`);
    await postSocial(row);
    return;
  }
  if (!row.approved_at) {
    const replied = await replyApproval(row);
    if (replied) {
      const ok = await db(`${K.table}?week_tag=eq.${weekTag}&approved_at=is.null`, { method: "PATCH", body: JSON.stringify({ approved_at: replied }) });
      if (!ok.ok) throw new Error(`approval not saved: ${ok.status} ${await ok.text()}`);
      row.approved_at = replied;
      console.log(`✓ ${weekTag} approved by Telegram reply (${replied})`);
      if (!args["dry-run"]) await say(`Got your "approved" for ${TAG}. Publishing now.`);
    }
  }
  if (!row.approved_at) {
    console.log(`${weekTag} not approved yet; staying unlisted.`);
    if (args.remind) await say(`${TAG} is waiting for your yes: it stays unlisted until you approve. ${env.APPROVALS_BOT_TOKEN ? 'Reply "approved" here, or use' : "Use"} the link in the earlier message (valid 48 hours from when it was sent); it goes public within the hour after you approve. ${row.video_url}`);
    return;
  }
  if (args["dry-run"]) {
    console.log(`DRY RUN: would make ${row.video_url} public${row.media_url ? ` and post ${row.media_url} to ${SOCIAL.map((c) => c.name).join(" and ")}` : ""}.`);
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
  const mark = await db(`${K.table}?week_tag=eq.${weekTag}`, { method: "PATCH", body: JSON.stringify({ privacy: "public", published_at: now }) });
  if (!mark.ok) throw new Error(`${K.table} update failed: ${mark.status} ${await mark.text()}`);

  // The content register, as the news digest does (register-content.mjs), keyed so a re-run
  // updates rather than stacks.
  const source = `${K.source}#${weekTag}`;
  const entry = {
    title: `${K.register} — ${row.week_label}`,
    content_type: "video",
    status: "posted",
    published_at: now,
    primary_content: row.summary,
    media_urls: [row.video_url],
    generated_by_agent: "aivor",
    metadata: { campaign: K.campaign, channels: ["youtube"], source, posted: { youtube: { id: row.video_id, url: row.video_url, at: now } }, week_tag: weekTag, approved_at: row.approved_at },
  };
  const existing = await db(`content_calendar?select=id&metadata->>source=eq.${encodeURIComponent(source)}`);
  const id = existing.ok ? (await existing.json())[0]?.id : null;
  const reg = await db(id ? `content_calendar?id=eq.${id}` : "content_calendar", { method: id ? "PATCH" : "POST", body: JSON.stringify(entry) });
  if (!reg.ok) console.log(`⚠ content register write failed: ${reg.status} ${await reg.text()}`);

  await say(`${TAG} is public: ${row.video_url}`);
  console.log(`✓ ${weekTag} public: ${row.video_url}`);
  if (row.media_url) await postSocial(row);
  else await say(`${TAG}: no hosted copy for this week, so it was not posted to Instagram, Facebook or LinkedIn.`);
}

const graph = async (url, init) => {
  const r = await fetch(url, init);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
};
const metaForm = (o) => new URLSearchParams({ ...o, access_token: env.META_PAGE_TOKEN });

// Instagram Reel: create container, poll until FINISHED, publish, read back the permalink.
async function instagramReel(row) {
  const token = env.META_PAGE_TOKEN;
  const { id: container } = await graph(`${GRAPH}/${IG_ID}/media`, {
    method: "POST",
    body: metaForm({ media_type: "REELS", video_url: row.media_url, caption: row.ig_caption || row.summary, share_to_feed: "true" }),
  });
  let status = "";
  for (let i = 0; i < 30 && status !== "FINISHED"; i++) {
    await new Promise((r) => setTimeout(r, 10_000));
    ({ status_code: status } = await graph(`${GRAPH}/${container}?fields=status_code&access_token=${token}`));
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`container ${container} ${status}`);
  }
  if (status !== "FINISHED") throw new Error(`container ${container} not ready after 5 min`);
  const { id } = await graph(`${GRAPH}/${IG_ID}/media_publish`, { method: "POST", body: metaForm({ creation_id: container }) });
  const { permalink } = await graph(`${GRAPH}/${id}?fields=permalink&access_token=${token}`);
  if (!permalink) throw new Error(`published ${id} but returned no permalink`);
  return { id, url: permalink };
}

// Facebook Page video: one call, Facebook fetches the file itself (as news-wire.mjs does).
async function facebookVideo(row) {
  const { id } = await graph(`${GRAPH}/${PAGE_ID}/videos`, {
    method: "POST",
    body: metaForm({ file_url: row.media_url, title: `${K.name} · ${row.week_label}`, description: row.ig_caption || row.summary }),
  });
  return { id, url: `https://www.facebook.com/${PAGE_ID}/videos/${id}` };
}

// Instagram and Facebook share a caption; LinkedIn has its own. Rob approves all of them in the
// Telegram sign-off.
// LinkedIn company page: its own caption, approved in the same sign-off.
async function linkedinVideo(row) {
  const token = await linkedinToken();
  const days = linkedinRefreshDaysLeft();
  if (days !== null && days < 30) await say(`LinkedIn login runs out in ${days} days. Re-run node ~/blkout/platform/scripts/linkedin-auth.mjs and update the LINKEDIN_REFRESH_TOKEN secret.`);
  return postVideo(token, { url: row.media_url, commentary: row.li_caption || row.summary, title: `${K.name} · ${row.week_label}` });
}

const SOCIAL = [
  { key: "instagram", name: "Instagram", column: "instagram_url", post: instagramReel },
  { key: "facebook", name: "Facebook", column: "facebook_url", post: facebookVideo },
  ...(env.LINKEDIN_REFRESH_TOKEN && env.LINKEDIN_CLIENT_SECRET
    ? [{ key: "linkedin", name: "LinkedIn", column: "linkedin_url", post: linkedinVideo }]
    : []),
];

// Each channel independently. Its URL is written straight after it posts, so a retry (the next
// hourly run) only tries the channels still missing and nothing posts twice. Any failure throws
// after the rest have been tried, so the workflow alerts Rob.
async function postSocial(row) {
  const source = `${K.source}#${weekTag}`;
  const failed = [];
  if (!SOCIAL.some((c) => c.key === "linkedin")) await say(`${TAG}: not posted to LinkedIn, because the LINKEDIN_REFRESH_TOKEN / LINKEDIN_CLIENT_SECRET secrets aren't set.`);
  for (const c of SOCIAL.filter((c) => !row[c.column])) {
    let done;
    try {
      done = await c.post(row);
    } catch (err) {
      failed.push(`${c.name}: ${err.message}`);
      continue;
    }
    const mark = await db(`${K.table}?week_tag=eq.${weekTag}`, { method: "PATCH", body: JSON.stringify({ [c.column]: done.url }) });
    if (!mark.ok) console.log(`⚠ ${c.column} not saved (${mark.status}): a retry could post twice. Set it by hand: ${done.url}`);
    const existing = await db(`content_calendar?select=id,metadata,media_urls&metadata->>source=eq.${encodeURIComponent(source)}`);
    const [reg] = existing.ok ? await existing.json() : [];
    if (reg) {
      const metadata = { ...reg.metadata, channels: [...new Set([...(reg.metadata.channels || []), c.key])], posted: { ...reg.metadata.posted, [c.key]: { id: done.id, url: done.url, at: new Date().toISOString() } } };
      await db(`content_calendar?id=eq.${reg.id}`, { method: "PATCH", body: JSON.stringify({ metadata, media_urls: [...new Set([...(reg.media_urls || []), done.url])] }) });
    }
    await say(`${TAG} is on ${c.name}: ${done.url}`);
    console.log(`✓ ${c.name}: ${done.url}`);
  }
  if (failed.length) throw new Error(`${failed.join("; ")} (the next hourly run retries)`);
}

try {
  await (command === "upload" ? upload() : command === "request" ? request() : publish());
} catch (err) {
  console.error(`✗ FAILED: ${err.message}`);
  process.exit(1);
}
