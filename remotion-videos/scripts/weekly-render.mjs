#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const ROOT = resolve(import.meta.dirname, "..");
const CURATOR_SCRIPT = resolve(import.meta.dirname, "curate.mjs");
const EVENTS_CURATOR_SCRIPT = resolve(import.meta.dirname, "curate-events.mjs");
const PLATFORM_ENV =
  process.env.BLKOUT_PLATFORM_ENV || "/home/robbe/blkout-platform/.env";

async function loadEnv(envPath) {
  try {
    const text = await readFile(envPath, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^"|"$/g, "");
      }
    }
  } catch {}
}
await loadEnv(PLATFORM_ENV);

const { values: args } = parseArgs({
  options: {
    "week-label": { type: "string" },
    "skip-curator": { type: "boolean", default: false },
    "skip-lipsync": { type: "boolean", default: false },
    "skip-render": { type: "boolean", default: false },
    "no-enhancer": { type: "boolean", default: false },
    aspects: { type: "string", default: "9x16,1x1,16x9" },
    // "events" = the AIvor events digest, "BLKOUT What's On" (spec:
    // ~/blkout/projects/aivor-media/docs/events-digest-spec-2026-10-24.md).
    property: { type: "string", default: "news" },
  },
  strict: true,
});

function isoWeekTag(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function run(cmd, argsArr, opts = {}) {
  return new Promise((res, rej) => {
    console.log(`\n▶ ${cmd} ${argsArr.join(" ")}`);
    const p = spawn(cmd, argsArr, {
      stdio: "inherit",
      cwd: opts.cwd || ROOT,
      env: { ...process.env, ...(opts.env || {}) },
    });
    p.on("close", (code) =>
      code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))
    );
  });
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const EVENTS = args.property === "events";
if (!["news", "events"].includes(args.property)) throw new Error(`Unknown --property ${args.property}`);
const weekTag = args["week-label"] || isoWeekTag();
const stem = EVENTS ? "events" : "weekly";
const avatarStem = EVENTS ? "aivor-events" : "aivor-news";
const propsPath = resolve(ROOT, `props/${stem}-${weekTag}.json`);
const outDir = resolve(ROOT, "out");
const talkingHeadPath = resolve(
  ROOT,
  `public/assets/${avatarStem}-${weekTag}-talking.mp4`
);

const OPENERS = [
  "My dear friends",
  "Brothers",
  "Beloved community",
  "Now then",
];
const CONNECTORS_FIRST = ["First", "To begin"];
const CONNECTORS_SECOND = ["Then", "Next", "Also this week"];
const CONNECTORS_THIRD = ["And finally", "And to close"];
// Beats are picked at random against whatever story lands in that slot, so they
// must read acceptably over a killing or an imprisonment as well as good news.
// "Marvellous." and "Quite extraordinary." were removed after W31 spoke
// "A Black trans teen was shot and killed in Florida. Marvellous."
const SIGNATURE_BEATS = [
  "Worth your attention.",
  "A story I shan't soon forget.",
  "Do read it.",
  "It stayed with me.",
];

function pick(arr, seed) {
  return arr[seed % arr.length];
}

// Spoken aloud, a headline cut mid-clause is worse than a long one. Prefer the
// first complete sentence; only fall back to a word cap if that is still long.
function trimSentence(s, maxWords) {
  const clean = s.replace(/\s+/g, " ").trim();
  const firstSentence = clean.match(/^[^.!?]+[.!?]/)?.[0]?.trim();
  const candidate =
    firstSentence && firstSentence.split(" ").length <= maxWords
      ? firstSentence
      : clean;
  const words = candidate.split(" ");
  if (words.length <= maxWords) return words.join(" ").replace(/[.,;:]+$/, "");
  return words.slice(0, maxWords).join(" ").replace(/[.,;:]+$/, "") + "…";
}

function buildScript(props) {
  const seed = Math.floor(
    Date.parse(new Date().toISOString().slice(0, 10)) / 86400000
  );
  const opener = pick(OPENERS, seed);
  const connectors = [
    pick(CONNECTORS_FIRST, seed),
    pick(CONNECTORS_SECOND, seed + 1),
    pick(CONNECTORS_THIRD, seed + 2),
  ];

  const lines = [
    `${opener}, here's what's moving in our news this week.`,
  ];
  props.teases.forEach((t, i) => {
    const headline = trimSentence(t.title, 16);
    const beat = pick(SIGNATURE_BEATS, seed + i);
    // A headline keeping its own ? or ! must not also collect a full stop.
    const stop = /[?!]$/.test(headline) ? "" : ".";
    lines.push(`${connectors[i]} — ${headline}${stop} ${beat}`);
  });
  lines.push(
    `All three at ${props.cta?.spokenUrl || "news.blkoutuk.com"}, where you're the editor. Tell us which stories matter most to you.`
  );
  return lines.join(" ");
}

// Events digest script: lighter and more playful than the news (Rob, 24 Oct), but only in
// the opener and the close. Each item is said plainly — day, name, where — because a week
// can hold a memorial march as easily as a party, and nothing playful may land on it.
// "Brothers" is left out: the listings are for every Black queer person.
const EVENT_OPENERS = ["My dear friends", "Beloved community", "Now then", "Listen"];
const EVENT_HOOKS = [
  "the weekend has plans for you.",
  "clear a little space in your diary.",
  "here's where we gather this week.",
];

function spokenTitle(title) {
  const t = title.replace(/\.{2,}/g, " ").replace(/\b20\d\d\b/g, "").replace(/\s+/g, " ").trim();
  const head = t.split(/:\s| — | - /)[0].trim();
  return (head.split(" ").length >= 2 ? head : t).replace(/[.,;:]+$/, "");
}

function buildEventsScript(props) {
  const seed = Math.floor(Date.parse(new Date().toISOString().slice(0, 10)) / 86400000);
  const opener = pick(EVENT_OPENERS, seed);
  const real = props.teases.filter((t) => !/\/add\b/.test(t.url));
  const addYours = real.length < props.teases.length;
  const lines = [addYours ? `${opener}, it's a quiet week, and that's where you come in.` : `${opener}, ${pick(EVENT_HOOKS, seed)}`];
  for (const t of real) {
    // The curator writes hooks as "Saturday 5pm. <line>"; the day is the spoken lead.
    const day = t.hook.split(". ")[0];
    const where = (t.where || "").split(",")[0];
    const name = spokenTitle(t.title);
    const at = where ? `${/[!?]$/.test(name) ? "" : ","} at ${where}` : "";
    const line = `${day}: ${name}${at}${/[!?]$/.test(name) && !at ? "" : "."}`;
    lines.push(t.blkout ? `${line} We'll be there. Will you?` : line);
  }
  lines.push(
    addYours
      ? `Running something for Black queer people? Add it at ${props.cta?.spokenUrl}, and we'll help people find it.`
      : `Everything's at ${props.cta?.spokenUrl}. And if your night isn't there, add it.`
  );
  return lines.join(" ");
}

async function curate() {
  if (EVENTS) {
    await run("node", [EVENTS_CURATOR_SCRIPT, "--out", propsPath]);
    return;
  }
  await run("node", [
    CURATOR_SCRIPT,
    "--week-label",
    args["week-label"] || weekTag,
    "--out",
    propsPath,
  ]);
}

async function lipsync() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("REPLICATE_API_TOKEN not set; skipping lipsync stage.");
    return;
  }
  const props = JSON.parse(await readFile(propsPath, "utf8"));
  const script = EVENTS ? buildEventsScript(props) : buildScript(props);
  const wordCount = script.split(/\s+/).length;
  console.log(`\n— Script (${wordCount} words, ~${(wordCount / 2.5).toFixed(0)}s) —`);
  console.log(script);
  console.log(`—`);

  const scriptPath = resolve(ROOT, `out/${stem}-${weekTag}-script.txt`);
  await mkdir(dirname(scriptPath), { recursive: true });
  await writeFile(scriptPath, script, "utf8");

  await run("node", [
    resolve(ROOT, "scripts/lipsync.mjs"),
    "--script",
    `@${scriptPath}`,
    "--image",
    resolve(ROOT, `public/assets/${avatarStem}.jpg`),
    "--out",
    talkingHeadPath,
    ...(args["no-enhancer"] ? ["--enhancer", "false"] : []),
  ]);

  props.avatarVideo = `assets/${avatarStem}-${weekTag}-talking.mp4`;
  if (EVENTS) {
    // The events digest runs as long as AIvor speaks plus a short outro for the CTA card
    // (W44 review: a fixed 35s left 13s of silence after a 22s script).
    const probe = await new Promise((res) => {
      const p = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", talkingHeadPath]);
      let out = "";
      p.stdout.on("data", (d) => (out += d));
      p.on("close", () => res(parseFloat(out)));
    });
    if (Number.isFinite(probe) && probe > 0) {
      props.durationSeconds = Math.min(90, Math.max(15, Math.ceil(probe + 4)));
      console.log(`  props.durationSeconds → ${props.durationSeconds} (voice ${probe.toFixed(1)}s + outro)`);
    } else {
      console.error("  could not read the talking-head length; keeping props.durationSeconds");
    }
  }
  await writeFile(propsPath, JSON.stringify(props, null, 2) + "\n", "utf8");
  console.log(`  patched props.avatarVideo → ${props.avatarVideo}`);
}

async function render() {
  await mkdir(outDir, { recursive: true });
  // Weekly look rotation (src/themes.ts): the composition picks its theme
  // from the ISO week number, so consecutive digests differ at a glance.
  // Stamped here, not in the curator, so --skip-curator runs rotate too.
  const props = JSON.parse(await readFile(propsPath, "utf8"));
  props.weekNumber = Number(weekTag.split("-W")[1]);
  await writeFile(propsPath, JSON.stringify(props, null, 2) + "\n", "utf8");
  console.log(`  props.weekNumber → ${props.weekNumber} (theme rotates on week % 5)`);
  for (const aspect of args.aspects.split(",")) {
    const compId = `IVORMessage${aspect}`;
    const out = resolve(outDir, `${stem}-${weekTag}-${aspect}.mp4`);
    await run("npx", [
      "remotion",
      "render",
      "src/index.ts",
      compId,
      `--output=${out}`,
      "--concurrency=1",
      "--gl=swiftshader",
      `--props=${propsPath}`,
    ]);
  }
}

async function main() {
  console.log(`Weekly render — ${weekTag}`);
  console.log(`Props path: ${propsPath}`);

  if (!args["skip-curator"]) await curate();
  else console.log(`▶ Skipping curator (--skip-curator)`);

  if (!(await exists(propsPath))) {
    throw new Error(`Props missing at ${propsPath}; cannot continue.`);
  }

  if (!args["skip-lipsync"]) await lipsync();
  else console.log(`▶ Skipping lipsync (--skip-lipsync)`);

  if (!args["skip-render"]) await render();
  else console.log(`▶ Skipping render (--skip-render)`);

  console.log(`\n✓ Done. Outputs in ${outDir}`);
}

main().catch((err) => {
  console.error(`\n✗ Pipeline failed: ${err.message}`);
  process.exit(1);
});
