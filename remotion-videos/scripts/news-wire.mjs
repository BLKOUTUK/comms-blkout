#!/usr/bin/env node
/**
 * The Wire — news-voting Reels, posted on the fortnight's rhythm (Rob, 18 Oct 2026).
 *
 * Runs daily. Works out which moment (if any) is due today from live news data, renders the
 * NewsWire Reel, uploads it, publishes it to Instagram (Reel) and the Facebook Page (video)
 * through the direct Graph route, records it in content_calendar, and tells Rob on Telegram.
 *
 *   results  — the Sunday a fortnight closes, ONLY if votes or an editor decided it.
 *              No results Reel when nobody voted (Rob, 18 Oct).
 *   lastcall — the Friday before the fortnight closes (Saturday midnight).
 *   open     — the first day the new fortnight has stories that can take votes.
 *   voted    — the middle Sunday ("have you voted?").
 * At most one post a day; each (fortnight, moment) posts once, keyed in content_calendar.
 *
 * Flags: --dry-run (render + upload, no post, no register)   --moment <m> (force a moment)
 * Needs: META_PAGE_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET,
 *        TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (Telegram optional on --dry-run)
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { parseArgs } from "node:util";
import { uploadToStorage } from "./lib/digest-common.mjs";

const { values: args } = parseArgs({
  options: { "dry-run": { type: "boolean", default: false }, moment: { type: "string" } },
  strict: true,
});
const DRY = args["dry-run"];
const NEWS = "https://news.blkoutuk.com";
const GRAPH = "https://graph.facebook.com/v21.0";
const PAGE_ID = "252227404975585", IG_ID = "17841403920630280";
const env = process.env;
const need = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_BUCKET", ...(DRY ? [] : ["META_PAGE_TOKEN"])];
const missing = need.filter((k) => !env[k]);
if (missing.length) { console.error(`✗ FAILED: missing ${missing.join(", ")}`); process.exit(1); }

const getJson = async (url, init) => {
  const r = await fetch(url, init);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`${url.split("?")[0]}: HTTP ${r.status} ${JSON.stringify(j.error || j).slice(0, 300)}`);
  return j;
};
const sb = (path, init = {}) => getJson(`${env.SUPABASE_URL}/rest/v1/${path}`, {
  ...init,
  headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
});
const telegram = async (text) => {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) { console.log("(no Telegram secrets — not sent)"); return; }
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  });
};

// ---- what's due today --------------------------------------------------------------
const ymd = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => ymd(new Date(new Date(s + "T12:00:00Z").getTime() + n * 86_400_000));
const longDate = (s) => new Date(s + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" }); // YYYY-MM-DD, UK date

const period = (await getJson(`${NEWS}/api/voting-period`)).data;
if (!period) { console.error("✗ FAILED: no active voting period"); process.exit(1); }
const start = period.startDate.slice(0, 10), end = period.endDate.slice(0, 10);
const news = (await getJson(`${NEWS}/api/news?limit=100`)).data;
const openStories = news.articles.filter((a) => a.votingOpen !== false).length;
const posted = await sb(`content_calendar?select=metadata&metadata->>campaign=eq.news-wire&metadata->>period_id=eq.${period.id}`);
const done = new Set(posted.map((r) => r.metadata.moment));

let moment = args.moment || null, pickedBy, topStories = [], periodForPost = period.id;
if (!moment && today === start) {
  // Closing Sunday: report the fortnight that just closed, if someone actually decided it.
  const closed = (await getJson(`${NEWS}/api/winners?limit=1`)).data.periods[0];
  const already = await sb(`content_calendar?select=id&metadata->>campaign=eq.news-wire&metadata->>period_id=eq.${closed?.id}&metadata->>moment=eq.results`);
  if (closed && ["votes", "editor"].includes(closed.pickedBy) && !already.length) {
    moment = "results"; pickedBy = closed.pickedBy; topStories = closed.winners.map((w) => w.title); periodForPost = closed.id;
  }
}
if (!moment && today === addDays(end, -1) && openStories > 0 && !done.has("lastcall")) moment = "lastcall";
if (!moment && openStories > 0 && !done.has("open") && today < addDays(end, -1)) moment = "open";
if (!moment && today === addDays(start, 7) && openStories > 0 && !done.has("voted")) moment = "voted";
if (moment === "results" && !pickedBy) {
  const closed = (await getJson(`${NEWS}/api/winners?limit=1`)).data.periods[0];
  pickedBy = closed.pickedBy === "editor" ? "editor" : "votes"; topStories = closed.winners.map((w) => w.title); periodForPost = closed.id;
}
if (!moment) { console.log(`Nothing due today (${today}): fortnight ${start}→${end}, ${openStories} open stories, posted: ${[...done].join(", ") || "none"}.`); process.exit(0); }

const closesOn = moment === "lastcall" ? `midnight, ${longDate(end)}` : longDate(end);
const scale = moment === "voted" || moment === "lastcall" ? "street" : "global";
const props = { scale, moment, closesOn, ...(moment === "open" ? { storyCount: openStories } : {}), ...(pickedBy ? { pickedBy } : {}) };
console.log(`Due today (${today}): ${moment} · ${JSON.stringify(props)}`);

// ---- caption -----------------------------------------------------------------------
const SIGN = "News for us. Curated by you.\nBLKOUT\nAre you in?\n\nVote at news.blkoutuk.com (link in bio). No login.\n\n#BLKOUT #BlackQueer #BlackQueerMen #QueerUK";
const caption = {
  open: `Haven't you heard?\n\n${openStories} stories are in, and you decide which three lead our news digest. Vote before ${longDate(end)}. One tap, no login.\n\n${SIGN}`,
  voted: `Have you voted?\n\nThe stories that matter to you lead the digest, but only if you say so. Vote before ${longDate(end)}.\n\n${SIGN}`,
  lastcall: `Last call. Voting closes at midnight, ${longDate(end)}.\n\nThe three stories with the most votes lead this week's digest. Yours could be one.\n\n${SIGN}`,
  results: `The results are in.\n\n${pickedBy === "editor" ? "No clear winner, so an editor picked this fortnight's top three:" : "You chose the top three:"}\n${topStories.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nThey lead this week's digest.\n\n${SIGN}`,
}[moment];
if (caption.length > 2200) { console.error(`✗ FAILED: caption ${caption.length}/2200`); process.exit(1); }

// ---- render + upload ---------------------------------------------------------------
mkdirSync("out", { recursive: true });
const file = `out/news-wire-${periodForPost.slice(0, 8)}-${moment}.mp4`;
execFileSync("npx", ["remotion", "render", "NewsWire", file, `--props=${JSON.stringify(props)}`, "--crf=20", "--concurrency=2"], { stdio: "inherit" });
const videoUrl = await uploadToStorage(file, `news-wire/${periodForPost}/${moment}.mp4`, {
  supabaseUrl: env.SUPABASE_URL, serviceKey: env.SUPABASE_SERVICE_ROLE_KEY, bucket: env.SUPABASE_BUCKET,
});
if (DRY) {
  console.log(`DRY RUN: rendered and hosted at ${videoUrl}. Nothing posted.\n--- caption ---\n${caption}`);
  process.exit(0);
}

// ---- publish -----------------------------------------------------------------------
const token = env.META_PAGE_TOKEN;
const results = {};
try {
  const form = (o) => new URLSearchParams({ ...o, access_token: token });
  const { id: container } = await getJson(`${GRAPH}/${IG_ID}/media`, { method: "POST", body: form({ media_type: "REELS", video_url: videoUrl, caption }) });
  let status = "";
  for (let i = 0; i < 24 && status !== "FINISHED"; i++) {
    await new Promise((r) => setTimeout(r, 10_000));
    ({ status_code: status } = await getJson(`${GRAPH}/${container}?fields=status_code&access_token=${token}`));
    if (status === "ERROR") throw new Error(`IG container ${container} ERROR`);
  }
  if (status !== "FINISHED") throw new Error(`IG container ${container} not ready after 4 min`);
  const { id: media } = await getJson(`${GRAPH}/${IG_ID}/media_publish`, { method: "POST", body: form({ creation_id: container }) });
  results.instagram = (await getJson(`${GRAPH}/${media}?fields=permalink&access_token=${token}`)).permalink;
} catch (e) { results.instagram = `FAILED: ${e.message}`; }
try {
  const { id } = await getJson(`${GRAPH}/${PAGE_ID}/videos`, { method: "POST", body: new URLSearchParams({ file_url: videoUrl, description: caption, access_token: token }) });
  results.facebook = `https://www.facebook.com/${PAGE_ID}/videos/${id}`;
} catch (e) { results.facebook = `FAILED: ${e.message}`; }

// ---- record + tell Rob -------------------------------------------------------------
const ok = Object.values(results).some((v) => !v.startsWith("FAILED"));
if (ok) {
  await sb("content_calendar", {
    method: "POST", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      title: `The Wire — ${moment} (${longDate(start)}–${longDate(end)})`,
      content_type: "video", status: "posted", published_at: new Date().toISOString(),
      primary_content: caption, media_urls: [videoUrl], generated_by_agent: "news-wire",
      metadata: { campaign: "news-wire", period_id: periodForPost, moment, props, posted: results, source: `routine:news-wire#${periodForPost}:${moment}` },
    }),
  });
}
const report = `The Wire · ${moment}\nInstagram: ${results.instagram}\nFacebook: ${results.facebook}${ok ? "" : "\nNOT recorded: nothing posted."}`;
console.log(report);
await telegram(report);
if (!ok || Object.values(results).some((v) => v.startsWith("FAILED"))) process.exit(1);
