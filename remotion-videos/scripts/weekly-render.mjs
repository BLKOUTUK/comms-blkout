#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

const ROOT = resolve(import.meta.dirname, "..");
const CURATOR_SCRIPT =
  "/home/robbe/.claude/skills/news-curator/scripts/curate.mjs";
const PLATFORM_ENV = "/home/robbe/blkout-platform/.env";

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

const weekTag = isoWeekTag();
const propsPath = resolve(ROOT, `props/weekly-${weekTag}.json`);
const outDir = resolve(ROOT, "out");
const talkingHeadPath = resolve(
  ROOT,
  `public/assets/aivor-news-${weekTag}-talking.mp4`
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
const SIGNATURE_BEATS = [
  "Quite extraordinary.",
  "Marvellous.",
  "Worth your attention.",
  "A story I shan't soon forget.",
];

function pick(arr, seed) {
  return arr[seed % arr.length];
}

function trimSentence(s, maxWords) {
  const words = s.replace(/\s+/g, " ").trim().split(" ");
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
    `${opener}, here's what you told us mattered this week.`,
  ];
  props.teases.forEach((t, i) => {
    const headline = trimSentence(t.title, 12);
    const beat = pick(SIGNATURE_BEATS, seed + i);
    lines.push(`${connectors[i]} — ${headline}. ${beat}`);
  });
  lines.push(
    `All three at ${props.cta?.spokenUrl || "news.blkoutuk.com"}, where you're the editor. Tell us which stories matter most to you.`
  );
  return lines.join(" ");
}

async function curate() {
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
  const script = buildScript(props);
  const wordCount = script.split(/\s+/).length;
  console.log(`\n— Script (${wordCount} words, ~${(wordCount / 2.5).toFixed(0)}s) —`);
  console.log(script);
  console.log(`—`);

  const scriptPath = resolve(ROOT, `out/weekly-${weekTag}-script.txt`);
  await mkdir(dirname(scriptPath), { recursive: true });
  await writeFile(scriptPath, script, "utf8");

  await run("node", [
    resolve(ROOT, "scripts/lipsync.mjs"),
    "--script",
    `@${scriptPath}`,
    "--image",
    resolve(ROOT, "public/assets/aivor-news.jpg"),
    "--out",
    talkingHeadPath,
    ...(args["no-enhancer"] ? ["--enhancer", "false"] : []),
  ]);

  props.avatarVideo = `assets/aivor-news-${weekTag}-talking.mp4`;
  await writeFile(propsPath, JSON.stringify(props, null, 2) + "\n", "utf8");
  console.log(`  patched props.avatarVideo → ${props.avatarVideo}`);
}

async function render() {
  await mkdir(outDir, { recursive: true });
  for (const aspect of args.aspects.split(",")) {
    const compId = `IVORMessage${aspect}`;
    const out = resolve(outDir, `weekly-${weekTag}-${aspect}.mp4`);
    await run("npx", [
      "remotion",
      "render",
      "src/index.ts",
      compId,
      `--output=${out}`,
      "--concurrency=1",
      "--gl=angle",
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
