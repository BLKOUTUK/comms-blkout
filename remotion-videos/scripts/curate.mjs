#!/usr/bin/env node
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const DEFAULT_OUT_BASE =
  "/home/robbe/blkout/platform/apps/comms-blkout/remotion-videos/props";
const HOOK_MAX = 175;

const { values: args } = parseArgs({
  options: {
    limit: { type: "string", default: "3" },
    "week-label": { type: "string" },
    out: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
  allowPositionals: false,
});

const limit = Math.max(1, Math.min(4, Number.parseInt(args.limit, 10) || 3));

function isoWeekTag(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return {
    tag: `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`,
    year: d.getUTCFullYear(),
    week: weekNo,
  };
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// A "2026-W40" override must date the edition to that week, not to today.
function weekTagDate(tag) {
  const m = /^(\d{4})-W(\d{2})$/.exec(tag || "");
  if (!m) return new Date();
  const jan4 = new Date(Date.UTC(Number(m[1]), 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (Number(m[2]) - 1) * 7);
  return new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
}

function isoWeekRange(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - dayNum + 1);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { from: monday, to: sunday };
}

function formatRangeShort(from, to) {
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const sameMonth = sameYear && from.getUTCMonth() === to.getUTCMonth();
  const fromOpts = { day: "numeric", month: "short", timeZone: "UTC" };
  const toOpts = { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  if (sameMonth) {
    fromOpts.month = undefined;
    delete fromOpts.month;
  }
  return {
    from: from.toLocaleDateString("en-GB", fromOpts),
    to: to.toLocaleDateString("en-GB", toOpts),
  };
}

function stripHtml(s = "") {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateAtWord(s, max) {
  if (!s) return "";
  if (s.length <= max) return s;
  const slice = s.slice(0, max + 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice.slice(0, max);
  return cut.replace(/[.,;:!?]+$/, "") + "…";
}

function buildStoryUrl(id, weekTag) {
  const params = new URLSearchParams({
    utm_source: "video",
    utm_medium: "reel",
    utm_campaign: `weekly-digest-${weekTag}`,
  });
  // Must be /article/<id> — App.tsx parses on that segment and anything else
  // silently falls through to the homepage.
  return `https://news.blkoutuk.com/article/${encodeURIComponent(id)}?${params}`;
}

function buildCtaUrl(weekTag) {
  const params = new URLSearchParams({
    utm_source: "video",
    utm_medium: "reel",
    utm_campaign: `weekly-digest-${weekTag}`,
  });
  return `https://news.blkoutuk.com?${params}`;
}

// Stories come straight from the database (1 Nov 2026), not the public site: GitHub's runners
// repeatedly couldn't connect to news.blkoutuk.com (23 Aug, 6 Sep, 27 Sep, 25 Oct), and each
// time a whole edition was lost. Rounds are weekly and carry the last 7 days' stories forward,
// so the open round always has stories, and the old previous-round / month / all-time fallbacks
// are gone. Rule: the open round's published stories, most votes first, then the editor's
// Saturday pick, then relevance, then newest.
async function db(path) {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${url}/rest/v1/${path}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) return res.json();
      lastErr = new Error(`Supabase ${res.status}: ${await res.text()}`);
      if (res.status < 500) throw lastErr;
    } catch (err) {
      lastErr = err;
      if (String(err?.message || "").startsWith("Supabase 4")) throw err;
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 10_000));
  }
  throw lastErr;
}

async function fetchTopStories() {
  const [round] = await db("voting_periods?status=eq.active&order=period_number.desc&limit=1&select=id,period_number");
  if (!round) throw new Error("No open voting round: nothing people can vote on.");
  const stories = await db(
    `news_articles?voting_period_id=eq.${round.id}&status=eq.published&select=id,title,excerpt,upvote_count,total_votes` +
      `&order=upvote_count.desc.nullslast,is_featured.desc.nullslast,interest_score.desc.nullslast,published_at.desc&limit=${limit}`
  );
  if (stories.length < limit) {
    throw new Error(`Round ${round.period_number} has ${stories.length} published stories; the video needs ${limit}.`);
  }
  return stories;
}

function buildProps(stories, { weekTag, weekLabel }) {
  const teases = stories.slice(0, limit).map((s, i) => ({
    title: truncateAtWord(s.title || "Untitled", 80),
    // RSS excerpts end "The post <title> appeared first on <site>." — never on screen.
    hook: truncateAtWord(stripHtml(s.excerpt || "").replace(/\s*The post\b[\s\S]*?appeared first on[\s\S]*$/, "").trim(), HOOK_MAX) || s.title,
    url: buildStoryUrl(s.id ?? s.slug ?? i + 1, weekTag),
    rank: i + 1,
    voteCount:
      typeof s.upvote_count === "number"
        ? s.upvote_count
        : typeof s.total_votes === "number"
        ? s.total_votes
        : undefined,
  }));

  const { from, to } = isoWeekRange(weekTagDate(args["week-label"]));
  const range = formatRangeShort(from, to);

  return {
    property: "news-digest",
    title: "Your news of the week",
    intro: "My dear friends, three stories worth your time.",
    teases,
    cta: {
      text: "You're the editor — vote at",
      url: buildCtaUrl(weekTag),
      spokenUrl: "news dot Blackout UK dot com",
      displayUrl: "news.blkoutuk.com",
    },
    avatarVideo: "assets/aivor-news.jpg",
    backdropVideo: "assets/hero-newsroom.mp4",
    bgMusic: false,
    durationSeconds: 35,
    showName: "BLKOUT News",
    weekLabel,
    dateRangeFrom: range.from,
    dateRangeTo: range.to,
    tickerText:
      "Community-owned journalism · You're the editor · Upvote the stories that matter · No login needed · We tally votes every week · Vote at news.blkoutuk.com",
  };
}

function summarise(props) {
  console.log(`\nWeek: ${props.weekLabel} (${props.dateRangeFrom} – ${props.dateRangeTo})`);
  console.log(`Title: ${props.title}\n`);
  for (const t of props.teases) {
    const votes = t.voteCount != null ? `${t.voteCount} votes` : "—";
    console.log(`  #${t.rank}  [${votes}]  ${t.title}`);
    console.log(`        ${t.hook}\n`);
  }
}

async function main() {
  const week = isoWeekTag();
  const weekLabel = args["week-label"] || `Week ${week.week}`;
  const outPath =
    args.out || resolve(DEFAULT_OUT_BASE, `weekly-${week.tag}.json`);

  console.log(`→ Fetching the open round's top ${limit} stories from the database`);
  const stories = await fetchTopStories();
  const props = buildProps(stories, { weekTag: week.tag, weekLabel });

  summarise(props);

  if (args["dry-run"]) {
    console.log("--dry-run: not writing file.");
    return;
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(props, null, 2) + "\n", "utf8");

  console.log(`✓ Wrote ${outPath}`);
  console.log(`\nNext: cd <remotion-videos>/.. && ./render.sh ${outPath}`);
}

main().catch((err) => {
  console.error(`✗ Curator failed: ${err.message}`);
  process.exit(1);
});
