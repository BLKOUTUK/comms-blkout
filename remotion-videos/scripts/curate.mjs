#!/usr/bin/env node
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const DEFAULT_API = "https://news.blkoutuk.cloud";
const DEFAULT_OUT_BASE =
  "/home/robbe/blkout-platform/apps/comms-blkout/.claude/worktrees/epic-blackburn-534916/remotion-videos/props";
const HOOK_MAX = 175;

const { values: args } = parseArgs({
  options: {
    limit: { type: "string", default: "3" },
    "week-label": { type: "string" },
    out: { type: "string" },
    api: { type: "string", default: DEFAULT_API },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
  allowPositionals: false,
});

const limit = Math.max(1, Math.min(4, Number.parseInt(args.limit, 10) || 3));
const apiBase = args.api.replace(/\/+$/, "");

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
  return `https://news.blkoutuk.com/${encodeURIComponent(id)}?${params}`;
}

function buildCtaUrl(weekTag) {
  const params = new URLSearchParams({
    utm_source: "video",
    utm_medium: "reel",
    utm_campaign: `weekly-digest-${weekTag}`,
  });
  return `https://news.blkoutuk.com?${params}`;
}

async function fetchTopStories() {
  const url = `${apiBase}/api/top-stories?period=week&limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(
      `GET ${url} → HTTP ${res.status} ${res.statusText}. Falling back: use props/sample-news-digest.json.`
    );
  }
  const json = await res.json();
  const stories =
    json?.data?.topStories || json?.topStories || json?.data || [];
  if (!Array.isArray(stories) || stories.length < limit) {
    throw new Error(
      `Endpoint returned ${stories.length} stories (need ${limit}). The active voting period may not have enough votes yet.`
    );
  }
  return stories;
}

function buildProps(stories, { weekTag, weekLabel }) {
  const teases = stories.slice(0, limit).map((s, i) => ({
    title: (s.title || "Untitled").slice(0, 80),
    hook: truncateAtWord(stripHtml(s.excerpt || ""), HOOK_MAX) || s.title,
    url: buildStoryUrl(s.id ?? s.slug ?? i + 1, weekTag),
    rank: i + 1,
    voteCount:
      typeof s.upvote_count === "number"
        ? s.upvote_count
        : typeof s.total_votes === "number"
        ? s.total_votes
        : undefined,
  }));

  const { from, to } = isoWeekRange();
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
    avatarVideo: "assets/aivor-presenter.jpg",
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

  console.log(`→ Fetching top ${limit} stories from ${apiBase}/api/top-stories`);
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
