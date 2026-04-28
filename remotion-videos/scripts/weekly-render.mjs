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
const introScript =
  "My dear friends, three stories worth your time this week.";

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
  await run("node", [
    resolve(ROOT, "scripts/lipsync.mjs"),
    "--script",
    introScript,
    "--image",
    resolve(ROOT, "public/assets/aivor-news.jpg"),
    "--out",
    talkingHeadPath,
    ...(args["no-enhancer"] ? [] : []),
  ]);

  const props = JSON.parse(await readFile(propsPath, "utf8"));
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
