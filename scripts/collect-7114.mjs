#!/usr/bin/env node
/**
 * Monthly 7-11-4 snapshot (Rob, 18 Oct 2026: "let's find a way to keep returning to this audit").
 *
 * Daniel Priestley's test: can someone spend 7 hours with BLKOUT, across 11 interactions, on
 * 4 platforms? Measures the month just ended (counts) and the trailing 12 months (hours),
 * writes brand.7114.* rows into metrics.snapshots (via metrics_snapshot_put), and sends Rob a
 * Telegram summary. /impact reads the snapshots to show the trend. Method and baseline:
 * ~/blkout/projects/brand-7-11-4/docs/7-11-4-findings-2026-10-18.md
 *
 * Every figure says how it was got: detail.method = "measured" | "estimated". A source that
 * fails writes status "failed" with the error, never a 0 that reads as a result.
 *
 * Flags: --period YYYY-MM (default: last month)   --dry-run (print, write nothing, no Telegram)
 * Needs: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, META_PAGE_TOKEN, yt-dlp on PATH;
 *        TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID for the summary.
 */
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({ options: { period: { type: "string" }, "dry-run": { type: "boolean", default: false } }, strict: true });
const env = process.env;
const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "META_PAGE_TOKEN"].filter((k) => !env[k]);
if (missing.length) { console.error(`✗ FAILED: missing ${missing.join(", ")}`); process.exit(1); }

const lastMonth = () => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
const period = args.period || lastMonth();
const monthStart = new Date(`${period}-01T00:00:00Z`);
const monthEnd = new Date(monthStart); monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
const yearStart = new Date(monthEnd); yearStart.setUTCFullYear(yearStart.getUTCFullYear() - 1);
const fortnights = (monthEnd - monthStart) / (14 * 86_400_000);
const inMonth = (t) => { const d = new Date(t); return d >= monthStart && d < monthEnd; };
const inYear = (t) => { const d = new Date(t); return d >= yearStart && d < monthEnd; };

const getJson = async (url, init) => {
  const r = await fetch(url, init);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`${url.split("?")[0]}: HTTP ${r.status} ${JSON.stringify(j.error || j).slice(0, 200)}`);
  return j;
};
const sbHeaders = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
const sb = (path) => getJson(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders });

const rows = []; // { measure, value, detail, status }
const put = (measure, value, method, extra = {}) => rows.push({ measure: `brand.7114.${measure}`, value, detail: { method, ...extra }, status: "ok" });
const fail = (measure, err) => { rows.push({ measure: `brand.7114.${measure}`, value: null, detail: { error: String(err.message || err).slice(0, 300) }, status: "failed" }); console.error(`✗ ${measure}: ${err.message || err}`); };

// ---- YouTube (yt-dlp, public metadata) ---------------------------------------------
let ytMinutes12 = null;
try {
  const vids = [];
  for (const tab of ["videos", "shorts"]) {
    const out = execFileSync("yt-dlp", ["--playlist-end", "60", "--ignore-errors", "--print", "%(upload_date)s|%(duration)s",
      `https://www.youtube.com/@BLKOUTUK/${tab}`], { encoding: "utf8", maxBuffer: 1 << 24, stdio: ["ignore", "pipe", "ignore"] });
    for (const line of out.trim().split("\n")) {
      const [d, s] = line.split("|");
      if (/^\d{8}$/.test(d) && /^\d+(\.\d+)?$/.test(s)) vids.push({ at: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}T12:00:00Z`, secs: Number(s) });
    }
  }
  if (!vids.length) throw new Error("yt-dlp returned no dated videos");
  ytMinutes12 = vids.filter((v) => inYear(v.at)).reduce((a, v) => a + v.secs, 0) / 60;
  put("youtube.uploads", vids.filter((v) => inMonth(v.at)).length, "measured");
  put("youtube.minutes_12m", Math.round(ytMinutes12 * 10) / 10, "measured");
} catch (e) { fail("youtube.uploads", e); }

// ---- Instagram + Facebook (Graph, our own accounts) --------------------------------
const GRAPH = "https://graph.facebook.com/v21.0", T = env.META_PAGE_TOKEN;
let igMonth = [], reels12 = null;
try {
  const media = [];
  let url = `${GRAPH}/17841403920630280/media?fields=media_type,media_product_type,timestamp,like_count,comments_count&limit=100&access_token=${T}`;
  while (url) {
    const page = await getJson(url);
    media.push(...page.data);
    url = page.data.length && inYear(page.data[page.data.length - 1].timestamp) ? page.paging?.next : null;
  }
  igMonth = media.filter((m) => inMonth(m.timestamp));
  reels12 = media.filter((m) => inYear(m.timestamp) && m.media_type === "VIDEO").length;
  const avg = (k) => (igMonth.length ? Math.round((igMonth.reduce((a, m) => a + (m[k] || 0), 0) / igMonth.length) * 100) / 100 : 0);
  put("instagram.posts", igMonth.length, "measured");
  put("instagram.reels", igMonth.filter((m) => m.media_type === "VIDEO").length, "measured");
  put("instagram.avg_likes", avg("like_count"), "measured");
  put("instagram.avg_comments", avg("comments_count"), "measured");
} catch (e) { fail("instagram.posts", e); }
try {
  const posts = [];
  let url = `${GRAPH}/252227404975585/posts?fields=created_time&limit=100&access_token=${T}`;
  while (url) {
    const page = await getJson(url);
    posts.push(...page.data);
    url = page.data.length && inYear(page.data[page.data.length - 1].created_time) ? page.paging?.next : null;
  }
  put("facebook.posts", posts.filter((p) => inMonth(p.created_time)).length, "measured", { note: "largely cross-posted from Instagram; don't add the two" });
} catch (e) { fail("facebook.posts", e); }

// ---- Owned channels (Supabase) -----------------------------------------------------
let voicesMinutes12 = null, voicesMonth = 0, newsMonth = 0, digestMonth = 0, newsletterMonth = 0;
try {
  const v = await sb(`voices_articles?select=published_at,content&published=eq.true&published_at=gte.${yearStart.toISOString()}&published_at=lt.${monthEnd.toISOString()}`);
  voicesMinutes12 = v.reduce((a, r) => a + (r.content || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length, 0) / 230;
  voicesMonth = v.filter((r) => inMonth(r.published_at)).length;
  put("voices.essays", voicesMonth, "measured");
  put("voices.minutes_12m", Math.round(voicesMinutes12), "estimated", { basis: "words / 230 per minute" });
} catch (e) { fail("voices.essays", e); }
try {
  newsMonth = (await sb(`news_articles?select=id&published=eq.true&published_at=gte.${monthStart.toISOString()}&published_at=lt.${monthEnd.toISOString()}`)).length;
  put("news.published", newsMonth, "measured");
} catch (e) { fail("news.published", e); }
try {
  digestMonth = (await sb(`aivor_digests?select=id&published_at=gte.${monthStart.toISOString()}&published_at=lt.${monthEnd.toISOString()}`)).length;
  put("digest.editions", digestMonth, "measured");
} catch (e) { fail("digest.editions", e); }
try {
  newsletterMonth = (await sb(`newsletter_editions?select=id&sent_at=gte.${monthStart.toISOString()}&sent_at=lt.${monthEnd.toISOString()}&recipients_count=gte.100`)).length;
  put("newsletter.sends", newsletterMonth, "measured", { basis: "sent editions with >= 100 recipients (excludes test/backfill rows)" });
} catch (e) { fail("newsletter.sends", e); }

// ---- The three tests ---------------------------------------------------------------
const REEL_MIN = 0.75; // a Reel is ~30-60s; the API gives no duration
const hoursParts = { youtube: ytMinutes12, voices: voicesMinutes12, reels: reels12 == null ? null : reels12 * REEL_MIN };
const hours = Object.values(hoursParts).every((v) => v != null) ? Object.values(hoursParts).reduce((a, v) => a + v, 0) / 60 : null;
if (hours != null) put("hours_12m", Math.round(hours * 10) / 10, "estimated", { minutes: hoursParts, basis: `YouTube measured; Voices words/230; Reels x ${REEL_MIN} min` });
else fail("hours_12m", new Error("a component source failed; see its row"));
const touches = (igMonth.length + newsMonth + voicesMonth + digestMonth + newsletterMonth +
  (rows.find((r) => r.measure === "brand.7114.youtube.uploads")?.value || 0)) / fortnights;
put("touches_per_fortnight", Math.round(touches * 10) / 10, "measured", { basis: "IG + YouTube + news + Voices + digest + newsletter in the month, per fortnight (FB excluded as cross-posted)" });
const active = { instagram: igMonth.length, youtube: rows.find((r) => r.measure === "brand.7114.youtube.uploads")?.value || 0, news: newsMonth, voices: voicesMonth, digest: digestMonth, newsletter: newsletterMonth };
put("platforms_active", Object.values(active).filter((n) => n > 0).length, "measured", { channels: active });

// ---- write + tell Rob --------------------------------------------------------------
const verdict = (ok) => (ok ? "met" : "NOT met");
const summary = [
  `7-11-4 · ${period}`,
  `7 hours: ${hours == null ? "FAILED" : `${hours.toFixed(1)} h in the last 12 months`} (${hours != null ? verdict(hours >= 7) : "?"})`,
  `11 interactions: ${touches.toFixed(1)} touches per fortnight (${verdict(touches >= 11)})`,
  `4 platforms: ${active && Object.values(active).filter((n) => n > 0).length} active this month (${verdict(Object.values(active).filter((n) => n > 0).length >= 4)})`,
  `Instagram: ${igMonth.length} posts, avg ${rows.find((r) => r.measure === "brand.7114.instagram.avg_comments")?.value ?? "?"} comments`,
  ...rows.filter((r) => r.status === "failed").map((r) => `FAILED ${r.measure}: ${r.detail.error}`),
].join("\n");
console.log(summary);
if (args["dry-run"]) { console.log(`DRY RUN: ${rows.length} rows not written.`); process.exit(0); }

for (const r of rows) {
  await getJson(`${env.SUPABASE_URL}/rest/v1/rpc/metrics_snapshot_put`, {
    method: "POST", headers: sbHeaders,
    body: JSON.stringify({ p_period: period, p_measure: r.measure, p_value: r.value, p_detail: r.detail, p_source: "github:collect-7114", p_status: r.status }),
  });
}
console.log(`Wrote ${rows.length} snapshot rows for ${period}.`);
if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: summary, disable_web_page_preview: true }),
  });
}
if (rows.some((r) => r.status === "failed")) process.exit(1);
