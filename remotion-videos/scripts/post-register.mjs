#!/usr/bin/env node
// The register poster: replaces Zapier (Rob, 27 Sep plan; cutover Sun 1 Nov 2026).
// Every 15 minutes (.github/workflows/post-register.yml) it posts content_calendar rows whose
// status is 'scheduled' and whose time has come, to Instagram, Facebook and LinkedIn directly.
//
// Safety:
// - Only rows due in the last WINDOW_HOURS are touched. The register holds older 'scheduled'
//   rows that Zapier already posted from its own files and never marked; those are reported, never posted.
// - Each channel is written to metadata.posted.<channel> the moment it posts, so a retry only tries
//   the channels still missing and nothing posts twice. The row becomes 'posted' when all are done.
// - Without --live it is a dry run: it reads, decides and reports to Telegram, and posts nothing.
//
// Usage: node scripts/post-register.mjs [--live] [--window-hours 3] [--id <row uuid>]
import { parseArgs } from "node:util";
import { linkedinToken, linkedinRefreshDaysLeft, postImage, postVideo } from "./lib/linkedin.mjs";

const { values: args } = parseArgs({
  options: { live: { type: "boolean", default: false }, "window-hours": { type: "string", default: "3" }, id: { type: "string" } },
});
const env = process.env;
const LIVE = args.live;
const WINDOW_MS = Number(args["window-hours"]) * 3600_000;
const GRAPH = "https://graph.facebook.com/v21.0";
const IG_ID = "17841403920630280", PAGE_ID = "252227404975585";

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
const say = async (text) => {
  if (!env.TELEGRAM_BOT_TOKEN) return console.log(`[telegram] ${text}`);
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    body: new URLSearchParams({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: "true" }),
  });
  if (!r.ok) console.log(`⚠ Telegram failed: HTTP ${r.status}`);
};

const graph = async (url, init) => {
  const r = await fetch(url, init);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error?.message || `HTTP ${r.status}`);
  return j;
};
const metaForm = (o) => new URLSearchParams({ ...o, access_token: env.META_PAGE_TOKEN });
const isVideo = (u) => /\.(mp4|mov|m4v)(\?|$)/i.test(u);

// What each row says about itself. Older rows keep their detail under metadata.legacy.item_metadata.
function readRow(row) {
  const m = row.metadata || {};
  const item = m.legacy?.item_metadata || {};
  const channels = (m.channels || item.platforms || []).map((c) => String(c).toLowerCase())
    .filter((c) => ["instagram", "facebook", "linkedin"].includes(c));
  const tags = (row.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
  const caption = [row.primary_content, tags].filter(Boolean).join("\n\n").trim();
  const liCaption = (m.content_linkedin || item.content_linkedin || item.linkedin || row.primary_content || "").trim();
  const fbCaption = (m.content_facebook || caption).trim();
  const media = (row.media_urls || []).filter((u) => /^https:\/\//.test(u));
  return { channels, caption, fbCaption, liCaption, media, gate: m.live_gate || [], posted: m.posted || {} };
}

// Instagram: one image, a carousel, or a Reel. Poll the container, publish, read back the permalink.
async function waitFinished(container) {
  let status = "";
  for (let i = 0; i < 30 && status !== "FINISHED"; i++) {
    await new Promise((r) => setTimeout(r, i ? 10_000 : 3_000));
    ({ status_code: status } = await graph(`${GRAPH}/${container}?fields=status_code&access_token=${env.META_PAGE_TOKEN}`));
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`container ${container} ${status}`);
  }
  if (status !== "FINISHED") throw new Error(`container ${container} not ready after 5 min`);
}
async function instagram({ caption, media }) {
  let container;
  if (media.length === 1 && isVideo(media[0])) {
    ({ id: container } = await graph(`${GRAPH}/${IG_ID}/media`, { method: "POST", body: metaForm({ media_type: "REELS", video_url: media[0], caption, share_to_feed: "true" }) }));
  } else if (media.length === 1) {
    ({ id: container } = await graph(`${GRAPH}/${IG_ID}/media`, { method: "POST", body: metaForm({ image_url: media[0], caption }) }));
  } else {
    const children = [];
    for (const u of media.slice(0, 10)) {
      const { id } = await graph(`${GRAPH}/${IG_ID}/media`, {
        method: "POST", body: metaForm(isVideo(u) ? { media_type: "VIDEO", video_url: u, is_carousel_item: "true" } : { image_url: u, is_carousel_item: "true" }),
      });
      await waitFinished(id);
      children.push(id);
    }
    ({ id: container } = await graph(`${GRAPH}/${IG_ID}/media`, { method: "POST", body: metaForm({ media_type: "CAROUSEL", children: children.join(","), caption }) }));
  }
  await waitFinished(container);
  const { id } = await graph(`${GRAPH}/${IG_ID}/media_publish`, { method: "POST", body: metaForm({ creation_id: container }) });
  const { permalink } = await graph(`${GRAPH}/${id}?fields=permalink&access_token=${env.META_PAGE_TOKEN}`);
  if (!permalink) throw new Error(`published ${id} but returned no permalink`);
  return { id, url: permalink };
}

// Facebook Page: a video, one photo, or several photos attached to one post.
async function facebook({ fbCaption: caption, media }) {
  if (isVideo(media[0])) {
    const { id } = await graph(`${GRAPH}/${PAGE_ID}/videos`, { method: "POST", body: metaForm({ file_url: media[0], description: caption }) });
    return { id, url: `https://www.facebook.com/${PAGE_ID}/videos/${id}` };
  }
  let postId;
  if (media.length === 1) {
    const r = await graph(`${GRAPH}/${PAGE_ID}/photos`, { method: "POST", body: metaForm({ url: media[0], message: caption }) });
    postId = r.post_id || r.id;
  } else {
    const ids = [];
    for (const u of media.slice(0, 10)) {
      const { id } = await graph(`${GRAPH}/${PAGE_ID}/photos`, { method: "POST", body: metaForm({ url: u, published: "false" }) });
      ids.push(id);
    }
    const body = metaForm({ message: caption });
    ids.forEach((id, i) => body.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
    ({ id: postId } = await graph(`${GRAPH}/${PAGE_ID}/feed`, { method: "POST", body }));
  }
  const { permalink_url } = await graph(`${GRAPH}/${postId}?fields=permalink_url&access_token=${env.META_PAGE_TOKEN}`);
  return { id: postId, url: permalink_url || `https://www.facebook.com/${postId}` };
}

// LinkedIn company page: its own caption; a video, or the first image.
async function linkedin({ liCaption, media, title }) {
  const token = await linkedinToken();
  const days = linkedinRefreshDaysLeft();
  if (days !== null && days < 30) await say(`LinkedIn login runs out in ${days} days. Re-run node ~/blkout/platform/scripts/linkedin-auth.mjs and update the LINKEDIN_REFRESH_TOKEN secret.`);
  return isVideo(media[0])
    ? postVideo(token, { url: media[0], commentary: liCaption, title })
    : postImage(token, { url: media[0], commentary: liCaption, altText: title });
}

const LANES = {
  instagram: { name: "Instagram", post: instagram, ready: () => !!env.META_PAGE_TOKEN },
  facebook: { name: "Facebook", post: facebook, ready: () => !!env.META_PAGE_TOKEN },
  linkedin: { name: "LinkedIn", post: linkedin, ready: () => !!(env.LINKEDIN_REFRESH_TOKEN && env.LINKEDIN_CLIENT_SECRET) },
};

async function main() {
  for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) if (!env[k]) throw new Error(`FAILED: ${k} not set`);
  const now = Date.now();
  const since = new Date(now - WINDOW_MS).toISOString();
  const filter = args.id
    ? `id=eq.${args.id}`
    : `status=eq.scheduled&deleted_at=is.null&scheduled_for=lte.${new Date(now).toISOString()}&scheduled_for=gte.${since}`;
  const r = await db(`content_calendar?select=id,title,status,scheduled_for,primary_content,hashtags,media_urls,metadata&${filter}&order=scheduled_for`);
  if (!r.ok) throw new Error(`FAILED: register read HTTP ${r.status}`);
  const rows = await r.json();
  console.log(`${LIVE ? "LIVE" : "DRY RUN"}: ${rows.length} row(s) due since ${since}`);

  const failures = [];
  for (const row of rows) {
    const info = readRow(row);
    info.title = row.title;
    const label = `"${row.title}" (${row.scheduled_for.slice(0, 16).replace("T", " ")} UTC)`;
    if (!info.channels.length) { failures.push(`${label}: no channels in metadata.channels`); continue; }
    if (!info.media.length) { failures.push(`${label}: no https media to post`); continue; }
    if (!info.caption) { failures.push(`${label}: empty caption`); continue; }

    const todo = info.channels.filter((c) => !info.posted[c]);
    // Live gate: every URL in metadata.live_gate must answer 200 itself (an unpublished Voices
    // article 302s to the homepage). If not, post nothing now; the next run inside the window retries.
    const closed = [];
    for (const u of info.gate) {
      const g = await fetch(u, { method: "GET", redirect: "manual" }).catch(() => null);
      if (!g || g.status !== 200) closed.push(`${u} → ${g ? g.status : "no answer"}`);
    }
    if (closed.length && todo.length) {
      console.log(`${label}: live gate closed (${closed.join("; ")}); will retry next run`);
      if (now - Date.parse(row.scheduled_for) <= 15 * 60_000) await say(`Poster: ${label} not posted yet, its live gate is closed (${closed.join("; ")}). It retries every 15 minutes for 3 hours.`);
      continue;
    }
    if (!LIVE) {
      const plan = todo.map((c) => `${LANES[c].name}${LANES[c].ready() ? "" : " (NOT READY: missing secret)"}`).join(", ") || "nothing left";
      console.log(`would post ${label} → ${plan}; ${info.media.length} media`);
      // Tell Rob once, on the first run after it falls due, not on every 15-minute run.
      if (now - Date.parse(row.scheduled_for) <= 15 * 60_000 || args.id) await say(`Poster DRY RUN: would post ${label} to ${plan}.`);
      continue;
    }
    let posted = { ...info.posted };
    for (const c of todo) {
      const lane = LANES[c];
      if (!lane.ready()) { failures.push(`${label} ${lane.name}: missing secret, not posted`); continue; }
      let done;
      try { done = await lane.post(info); } catch (e) { failures.push(`${label} ${lane.name}: ${e.message}`); continue; }
      posted = { ...posted, [c]: { id: done.id, url: done.url, at: new Date().toISOString() } };
      const w = await db(`content_calendar?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ metadata: { ...row.metadata, posted } }) });
      if (!w.ok) console.log(`⚠ ${row.id} ${c} not saved (HTTP ${w.status}): a retry could post twice. ${done.url}`);
      row.metadata = { ...row.metadata, posted };
      await say(`Posted ${label} on ${lane.name}: ${done.url}`);
      console.log(`✓ ${lane.name}: ${done.url}`);
    }
    if (info.channels.every((c) => posted[c])) {
      await db(`content_calendar?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ status: "posted", published_at: new Date().toISOString() }) });
    }
  }
  if (failures.length) {
    await say(`Poster: ${failures.length} problem(s)\n` + failures.map((f) => `• ${f}`).join("\n"));
    console.log("FAILED:\n" + failures.join("\n"));
    process.exit(1);
  }
}

main().catch(async (e) => { console.error(e.message); await say(`Poster FAILED: ${e.message}`); process.exit(1); });
