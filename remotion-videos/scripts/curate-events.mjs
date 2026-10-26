#!/usr/bin/env node
// AIvor events digest curator, "BLKOUT What's On" (spec:
// ~/blkout/projects/aivor-media/docs/events-digest-spec-2026-10-24.md).
//
// Reads gatherings_live (approved, complete, upcoming; never `events` directly) for the
// window Friday → the following Thursday, picks up to three by the spec's rules (section 4)
// and writes props/events-YYYY-Wnn.json for the existing AIvor render chain.
// Zero or one item → the "add yours" edition, never a skipped week. Never pads.
// Also reports whether a BLKOUT-hosted gathering 8–14 days out is due a special edition (5a).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const ROOT = resolve(import.meta.dirname, "..");
const NEVER_LIST_URL =
  "https://raw.githubusercontent.com/BLKOUTUK/black-qtipoc-events-calendar/main/scripts/places/never-list.json";
const EVENTS_SITE = "https://events.blkoutuk.com";
const PLATFORM_ENV = process.env.BLKOUT_PLATFORM_ENV || "/home/robbe/blkout/platform/.env";

async function loadEnv(envPath) {
  try {
    const text = await readFile(envPath, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {}
}
await loadEnv(PLATFORM_ENV);

const { values: args } = parseArgs({
  options: {
    "run-date": { type: "string" }, // YYYY-MM-DD, the Thursday it runs; default today
    out: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
});

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Read-only use: the anon key when present (local), else the CI service key.
const KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !KEY) {
  console.error("FAILED: SUPABASE_URL and a key are required");
  process.exit(1);
}

// ---- dates (UK calendar days; times compared as strings) ----
const ymd = (d) => d.toISOString().slice(0, 10);
const addDays = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
};
const weekday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 Sun … 6 Sat
const runDate = args["run-date"] || new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
// The coming Friday (the run date itself if it is a Friday) → the Thursday after.
const from = addDays(runDate, (5 - weekday(runDate) + 7) % 7);
const to = addDays(from, 6);
const isWeekend = (date) => [5, 6, 0].includes(weekday(date));

function isoWeekTag(date) {
  const d = new Date(`${date}T00:00:00Z`);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { tag: `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`, week };
}
const { tag: weekTag, week } = isoWeekTag(from);
const short = (date, opts) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

// ---- data ----
async function rest(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(`gatherings_live read ${r.status} ${await r.text()}`);
  return r.json();
}
const cols = "id,title,description,date,start_time,end_date,location,virtual_link,organizer,cost,url,image_url,tags";
const inWindow = await rest(`gatherings_live?select=${cols}&date=gte.${from}&date=lte.${to}&order=date.asc,start_time.asc.nullslast`);

let never = [];
try {
  const r = await fetch(NEVER_LIST_URL);
  if (r.ok) never = (await r.json()).never || [];
  else throw new Error(String(r.status));
} catch (e) {
  console.error(`FAILED: never-list unavailable (${e.message}); refusing to curate without it`);
  process.exit(1);
}
const banned = (g) => never.some((n) => `${g.title} ${g.organizer} ${g.location}`.toLowerCase().includes(String(n.match).toLowerCase()));

const isTest = (g) => /^test$/i.test(String(g.organizer).trim()) || /health check/i.test(g.title) || /(^|\.)example\.com/i.test(g.url || "");
const isBlkout = (g) => /\bblkout\b/i.test(g.organizer || "");
const online = (g) => Boolean(g.virtual_link) || /^(zoom|online|virtual)\b/i.test(String(g.location).trim());
const pool = inWindow.filter((g) => !banned(g) && !isTest(g)).filter((g) => !online(g) || g.virtual_link);

// ---- section 4: weekend first, then date and time; spread across places; BLKOUT leads ----
const ordered = [...pool].sort((a, b) =>
  (isWeekend(b.date) - isWeekend(a.date)) || a.date.localeCompare(b.date) || String(a.start_time || "99").localeCompare(String(b.start_time || "99")));
const placeKey = (g) => String(online(g) ? `online:${g.organizer}` : g.location).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").slice(0, 3).join(" ");
const picked = [];
const lead = ordered.find(isBlkout);
if (lead) picked.push(lead);
for (const g of ordered) {
  if (picked.length >= 3) break;
  if (picked.includes(g)) continue;
  const clash = picked.some((p) => placeKey(p) === placeKey(g) || p.organizer === g.organizer);
  const others = ordered.filter((o) => !picked.includes(o) && o !== g && !picked.some((p) => placeKey(p) === placeKey(o) || p.organizer === o.organizer));
  if (clash && others.length) continue; // a third option exists from somewhere else
  picked.push(g);
}

// ---- props ----
const slug = (t) => t.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "");
const utm = (campaign) => new URLSearchParams({ utm_source: "video", utm_medium: "reel", utm_campaign: campaign }).toString();
const campaign = `events-digest-${weekTag}`;
const pageUrl = (g) => `${EVENTS_SITE}/e/${g.id}/${slug(g.title)}?${utm(campaign)}`;
const clean = (s) => String(s || "").replace(/<[^>]*>/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, "&").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

function hookFor(g) {
  // One hook line from the listing's own words: its first sentence, never the full blurb,
  // and no price unless it's free. Falls back to the plain facts.
  const first = clean(g.description).split(/(?<=[.!?])\s+/)[0] || "";
  let hook = first.length >= 20 && first.length <= 120 ? first : first.length > 120 ? first.slice(0, 117).replace(/\s+\S*$/, "") + "…" : "";
  if (!hook) hook = `${g.organizer}${online(g) ? ", online" : `, ${String(g.location).split(",")[0]}`}.`;
  if (/^free\b/i.test(String(g.cost || "").trim()) && !/free/i.test(hook)) hook = /[…!?]$/.test(hook) ? `${hook} Free.` : `${hook.replace(/\.$/, "")}. Free.`;
  return hook.slice(0, 180);
}
// A word or two on what the gathering offers (Rob, 26 Oct: the script named events without
// saying what they were). Read from the listing's own title and description; first match wins,
// and no match means nothing is said rather than a guess.
const KINDS = [
  [/\b(march|rally|vigil|protest)\b/i, "a march"],
  [/\b(hiv|sti|sexual health|condoms)\b/i, "sexual health testing and advice"],
  [/narcotics anonymous|\bpeer support\b|support group|recovery/i, "a peer support meeting"],
  [/\bconference\b/i, "a conference"],
  [/\b(destination|getaway|weekend away|holiday)\b/i, "a weekend away"],
  [/\b(screening|film|documentary|cinema)\b/i, "a screening"],
  [/\b(workshop|craft|crafty|clay|stitch\w*|painting|making)\b/i, "a craft session"],
  [/\b(writers?|writing|poetry|book club)\b/i, "a writing group"],
  [/\b(somatic|yoga|movement|meditation)\b/i, "a rest and movement session"],
  [/\b(club night|dance|dj|djs|party|bash|amapiano|dancehall|house music|rave)\b/i, "a night out"],
  [/\bcelebrat/i, "a celebration"],
  [/\b(talk|panel|discussion|town hall)\b/i, "a conversation"],
  [/\b(performance|theatre|cabaret|drag|gig|concert)\b/i, "a performance"],
  [/\bexhibition\b/i, "an exhibition"],
];
function kindFor(g) {
  const text = `${clean(g.title)} ${clean(g.description)}`;
  const adults = (g.tags || []).some((t) => /^(18\+|adults only|over 18)$/i.test(t));
  const hit = adults ? [null, "an adults-only night"] : KINDS.find(([re]) => re.test(text));
  if (!hit) return null;
  let kind = hit[1];
  if (/^free\b/i.test(String(g.cost || "").trim())) kind = kind.replace(/^(a|an) /, "a free ").replace(/^(?!a free )/, "free ");
  // Who it's for, when the listing says so plainly ("for LGBT Africans, asylum seekers…").
  const forWhom = clean(g.description).split(/(?<=[.!?])\s+/)[0].match(/\bfor ((?:[A-Z][\w+-]*|LGBT\w*|queer|trans|black|gay|bi)[^,.;:!?]{0,40})/);
  // Kept to a few words, cut at the first clause that runs on ("aged 16+ to connect…").
  const who = forWhom && forWhom[1].split(/\s(?:to|aged|at|on|who|from|in|across|with)\s/)[0].split(" ").slice(0, 5).join(" ");
  if (who && /lgbt|queer|trans|black|gay|bi\b|men|women|people|african|caribbean/i.test(who)) kind += ` for ${who.trim()}`;
  return kind;
}

const dayLabel = (g) => `${short(g.date, { weekday: "long" })}${g.start_time ? ` ${(() => { let [h, m] = g.start_time.split(":").map(Number); const p = h >= 12 ? "pm" : "am"; h = h % 12 || 12; return m ? `${h}.${String(m).padStart(2, "0")}${p}` : `${h}${p}`; })()}` : ""}`;

const addYours = picked.length <= 1;
const teases = picked.map((g, i) => ({
  title: clean(g.title).slice(0, 80),
  hook: `${dayLabel(g)}. ${hookFor(g)}`.slice(0, 180),
  url: pageUrl(g),
  ...(g.image_url ? { thumbnail: g.image_url } : {}),
  rank: i + 1,
  // For the spoken script (weekly-render.mjs); not part of the on-screen schema.
  where: online(g) ? "online" : String(g.location),
  ...(kindFor(g) ? { kind: kindFor(g) } : {}),
  blkout: isBlkout(g),
}));
if (addYours) {
  teases.push({
    title: "Your night, here",
    hook: "Running something for Black queer people? Add it, and we'll help people find it.",
    url: `${EVENTS_SITE}/add?${utm(campaign)}`,
    rank: teases.length + 1,
  });
}

const props = {
  property: "ivor-events",
  title: addYours ? "Add yours" : "What's on",
  intro: addYours ? "My dear friends, the week is quiet, and that's where you come in." : "My dear friends, the weekend has plans for you.",
  teases,
  cta: {
    text: addYours ? "Add your night at" : "Everything's at",
    url: `${EVENTS_SITE}/${addYours ? "add" : "gatherings"}?${utm(campaign)}`,
    spokenUrl: "events dot blkoutuk dot com",
    displayUrl: "events.blkoutuk.com",
  },
  avatarVideo: "assets/ivor-avatar.mp4",
  bgMusic: false,
  durationSeconds: addYours ? 25 : 28,
  showName: "BLKOUT What's On",
  weekLabel: `Week ${week}`,
  dateRangeFrom: short(from, { day: "numeric", month: "long" }),
  dateRangeTo: short(to, { day: "numeric", month: "long", year: "numeric" }),
  tickerText: "Gatherings chosen from our community listings · Add yours at events.blkoutuk.com",
  weekNumber: week,
};

// ---- special edition (5a): a BLKOUT gathering 8–14 days after the run date ----
const special = (await rest(`gatherings_live?select=id,title,date,url&date=gte.${addDays(runDate, 8)}&date=lte.${addDays(runDate, 14)}`))
  .filter(isBlkout)
  .map((g) => ({ ...g, renders: !/^https?:\/\/(www\.)?events\.blkoutuk\.com\/?(\?.*)?$/.test(g.url || ""), page: pageUrl(g) }));

const out = resolve(ROOT, args.out || `props/events-${weekTag}.json`);
console.log(`Window ${from} → ${to} (${weekTag}): ${inWindow.length} in gatherings_live, ${pool.length} eligible, ${picked.length} picked${addYours ? " → ADD-YOURS edition" : ""}`);
for (const t of teases) console.log(`  ${t.rank}. ${t.title} — ${t.hook}`);
for (const s of special) console.log(`  SPECIAL EDITION due: ${s.title} (${s.date})${s.renders ? "" : " — FAILED: its link is the events homepage; Rob needs to give the real page"}`);
if (args["dry-run"]) {
  console.log(JSON.stringify(props, null, 2));
} else {
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(props, null, 2) + "\n");
  console.log(`props: ${out}`);
}
