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
    .filter((c) => ["instagram", "facebook", "linkedin", "hub"].includes(c));
  const tags = (row.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
  const caption = [row.primary_content, tags].filter(Boolean).join("\n\n").trim();
  const liCaption = (m.content_linkedin || item.content_linkedin || item.linkedin || row.primary_content || "").trim();
  const fbCaption = (m.content_facebook || caption).trim();
  const hubCaption = (m.content_hub || fbCaption).trim();
  const media = (row.media_urls || []).filter((u) => /^https:\/\//.test(u));
  return { channels, caption, fbCaption, hubCaption, liCaption, media, gate: m.live_gate || [], posted: m.posted || {} };
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

// BLKOUTHUB (Heartbeat): a thread in the forum channel, posted as Hub Editor (an admin) and signed
// Rob. The API has no image attach, so images go in as links. The news channel emails every member,
// so the poster never posts there (Rob's per-post choice only).
const HUB_API = "https://api.heartbeat.chat/v0";
const HUB_FORUM = "e73dcfdf-1a84-4500-b9a4-6b4a0bd72483";
const HUB_NEWS = "d19644dc-192f-402d-bb38-66981ffba131";
const HUB_EDITOR_EMAIL = "blkoutuk@gmail.com";
async function hubCall(method, path, body) {
  const r = await fetch(`${HUB_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${env.HEARTBEAT_API_KEY}`, accept: "application/json", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}
const hubList = (x) => (Array.isArray(x) ? x : x?.data || x?.items || x?.threads || []);
const escHtml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hubHtml = (caption, media) =>
  escHtml(caption).split(/\n{2,}/).map((para) => `<p>${para.replace(/\n/g, "<br>").replace(/(https:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}</p>`).join("")
  + (media.length ? `<p>${media.map((u, i) => `<a href="${u}">${media.length > 1 ? `Image ${i + 1}` : "See the image"}</a>`).join(" · ")}</p>` : "")
  + "<p>Rob</p>";
async function hub({ hubCaption, media }, channelID = HUB_FORUM) {
  if (channelID === HUB_NEWS) throw new Error("refusing the news channel: it emails every member");
  const found = await hubCall("GET", `/find/users?email=${encodeURIComponent(HUB_EDITOR_EMAIL)}`);
  const editor = hubList(found)[0] || (found.id ? found : null);
  if (!editor?.id) throw new Error("Hub Editor account not found");
  const text = hubHtml(hubCaption, media);
  const made = await hubCall("PUT", "/threads", { text, channelID, userID: editor.id });
  // Read back from the channel: the thread must exist, and the channel's own record gives its url.
  const madeId = made.id || made.thread?.id || made.data?.id;
  const threads = hubList(await hubCall("GET", `/channels/${channelID}/threads`));
  const probe = escHtml(hubCaption.slice(0, 40));
  const t = threads.find((x) => (madeId && x.id === madeId) || String(x.content || x.text || "").includes(probe));
  if (!t) throw new Error("thread created but not found on read-back");
  return { id: t.id, url: t.url || `https://blkouthub.com (thread ${t.id})` };
}

const LANES = {
  instagram: { name: "Instagram", post: instagram, ready: () => !!env.META_PAGE_TOKEN },
  facebook: { name: "Facebook", post: facebook, ready: () => !!env.META_PAGE_TOKEN },
  linkedin: { name: "LinkedIn", post: linkedin, ready: () => !!(env.LINKEDIN_REFRESH_TOKEN && env.LINKEDIN_CLIENT_SECRET) },
  hub: { name: "BLKOUTHUB", post: hub, ready: () => !!env.HEARTBEAT_API_KEY },
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
    // A caption still carrying a {{PLACEHOLDER}} (e.g. a link not yet known) never posts.
    if (/\{\{[A-Z_]+\}\}/.test([info.caption, info.fbCaption, info.liCaption].join(" "))) { failures.push(`${label}: caption still has a {{PLACEHOLDER}}, not posted`); continue; }

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
