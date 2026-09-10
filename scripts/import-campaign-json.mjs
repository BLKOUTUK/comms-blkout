#!/usr/bin/env node
/**
 * import-campaign-json.mjs — campaign JSON files into the content register.
 *
 * Brief: docs/content-one-register-brief-2026-09-10.md, section B.
 *
 * Until today BLKOUT's scheduled content lived in five places: four JSON files compiled
 * into the browser bundle, two more in src/data that nothing loaded, four older ones at
 * the repo root, the BHM 2026 register in a projects folder the commands expected in
 * src/data and never found, and public.content_calendar, which held four rows nobody
 * looked at. This moves every item into the register and the files are then deleted.
 *
 * Usage:
 *   node scripts/import-campaign-json.mjs --dry-run <file...>
 *   node scripts/import-campaign-json.mjs <file...>
 *
 * Writing goes through ~/blkout/platform/scripts/supabase-query.mjs with
 * SUPABASE_ACCESS_TOKEN read from ~/blkout/platform/.env.supabase and handed to the child
 * as env — never on argv, never printed, and scrubbed out of any error text before it can
 * reach a terminal. Same mechanism as build-finance.mjs publishToMetrics.
 *
 * Idempotent on metadata->>'source' (`file:<name>#<item id>`, where <name> is the path
 * relative to this repo for files inside it and the basename otherwise): the database function
 * public.admin_content_insert (migration 018) returns {created:false} for a source that
 * already has a live row, so a second run inserts nothing and says so. The item ids are
 * derived from the item's position in the file's own structure, so they are stable
 * between runs — that is what makes re-running safe.
 *
 * Nothing here invents a value. An item with no parseable date gets scheduled_for NULL and
 * shows up in the counts as undated; it does not get today, or the campaign start, or any
 * other plausible-looking substitute. A file whose shape this script does not recognise
 * raises rather than importing zero items and reporting success.
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');                      // apps/comms-blkout

/**
 * The platform root, which holds scripts/supabase-query.mjs and .env.supabase.
 *
 * NOT `path.resolve(HERE, '../../..')`. In a git worktree — the way this repo is
 * supposed to be worked on — the checkout is at ~/wt/<slug>, so that expression
 * resolves to ~/ and the helper is not there. Walk up looking for the helper instead,
 * and raise if it is nowhere: a missing helper must stop the import, not let it write
 * nothing and report a clean run.
 */
function findPlatformRoot() {
  if (process.env.BLKOUT_PLATFORM) return process.env.BLKOUT_PLATFORM;
  let dir = HERE;
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(dir, 'scripts/supabase-query.mjs'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  const fallback = path.join(process.env.HOME || '', 'blkout/platform');
  if (fs.existsSync(path.join(fallback, 'scripts/supabase-query.mjs'))) return fallback;
  throw new Error('cannot find the platform root (scripts/supabase-query.mjs) — set BLKOUT_PLATFORM');
}

const PLATFORM = findPlatformRoot();
const QUERY_HELPER = path.join(PLATFORM, 'scripts/supabase-query.mjs');
const ENV_FILE = path.join(PLATFORM, '.env.supabase');

const TODAY = new Date();
const TODAY_ISO = TODAY.toISOString().slice(0, 10);

// The three channels BLKOUT actually posts to (reference_blkout_social_posting_playbook).
// 'all' in a campaign file means these, not "every platform that exists".
const ALL_CHANNELS = ['instagram', 'facebook', 'linkedin'];

// ── vocabulary maps ────────────────────────────────────────────────────────────────────

// content_calendar.content_type has its own CHECK, kept by migration 018:
// post/thread/carousel/video/story/reel/article. The files use a looser set; the original
// word is preserved in metadata.legacy.type, so nothing is lost by narrowing it here.
const TYPE_MAP = {
  carousel: 'carousel', instagram_carousel: 'carousel',
  thread: 'thread', twitter_thread: 'thread',
  reel: 'reel', instagram_reel: 'reel',
  story: 'story', stories: 'story', instagram_story: 'story',
  video: 'video', tiktok_video: 'video', youtube_video: 'video',
  article: 'article', blog: 'article', newsletter: 'article', email: 'article',
  post: 'post', social: 'post', graphic: 'post', image: 'post',
  linkedin_post: 'post', twitter_post: 'post',
};

const CHANNEL_MAP = {
  ig: 'instagram', instagram: 'instagram',
  fb: 'facebook', facebook: 'facebook',
  li: 'linkedin', linkedin: 'linkedin',
  x: 'twitter', twitter: 'twitter',
  tiktok: 'tiktok', youtube: 'youtube',
  email: 'email', newsletter: 'email', email_newsletter: 'email',
  web: 'website', website: 'website', internal: 'internal',
};

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const slugify = (v) => String(v).toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function mapType(raw) {
  const k = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  return TYPE_MAP[k] || 'post';
}

function mapChannels(raw) {
  const list = Array.isArray(raw) ? raw : [raw];
  const out = [];
  for (const entry of list) {
    const k = String(entry || '').toLowerCase().trim();
    if (!k) continue;
    if (k === 'all' || k === 'cross_platform') {
      for (const c of ALL_CHANNELS) if (!out.includes(c)) out.push(c);
      continue;
    }
    const mapped = CHANNEL_MAP[k];
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

/** The file's own word for where a row is, mapped into draft/ready/scheduled/posted/skipped. */
function mapStatus(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (!s) return 'draft';
  if (/^(published|live|sent|posted|done)\b/.test(s)) return 'posted';
  if (/^(scheduled|queued)\b/.test(s)) return 'scheduled';
  if (/^(ready|approved|complete|completed)\b/.test(s)) return 'ready';
  if (/^(skipped|cancelled|canceled|dropped|abandoned)\b/.test(s)) return 'skipped';
  return 'draft';
}

// ── dates ──────────────────────────────────────────────────────────────────────────────

/**
 * A date for the row, or null. Three sources, in order of how much they can be trusted:
 * an explicit ISO scheduled_for; a block-level date (the outoutchristmas day rows); a
 * prose `timing` string ("February 6th, 11:00 AM GMT", "Thursday 1 October, 12:00 BST"),
 * which needs a year from the campaign because it does not carry one.
 *
 * Returns an ISO timestamp string or null. Never a guess: an unparseable timing is null,
 * and the row is reported as undated rather than given a date that looks real.
 */
function resolveScheduledFor(item, ctx) {
  const explicit = item.scheduled_for ?? item.scheduledFor ?? ctx.blockDate ?? null;
  if (explicit) {
    const iso = String(explicit).trim();
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T${timeOf(item) || '12:00'}:00Z` : iso);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const timing = String(item.timing || '').trim();
  if (timing && ctx.year) {
    // "February 6th", "Thursday 1 October", "December 24th, 11:00 AM GMT", "March 2nd, 10:00 AM GMT"
    let month = null, day = null;
    let m = timing.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/);
    if (m && MONTHS[m[1].toLowerCase()]) { month = MONTHS[m[1].toLowerCase()]; day = Number(m[2]); }
    if (month === null) {
      m = timing.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)/);
      if (m && MONTHS[m[2].toLowerCase()]) { month = MONTHS[m[2].toLowerCase()]; day = Number(m[1]); }
    }
    if (month !== null && day >= 1 && day <= 31) {
      const hhmm = timeOf(item) || timeFromProse(timing) || '12:00';
      const d = new Date(`${ctx.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${hhmm}:00Z`);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }

  return null;
}

function timeOf(item) {
  const t = String(item.time || '').trim();
  return /^\d{1,2}:\d{2}$/.test(t) ? t.padStart(5, '0') : null;
}

function timeFromProse(s) {
  const m = String(s).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  if (m[3] && m[3].toUpperCase() === 'PM' && h < 12) h += 12;
  if (m[3] && m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

/** The campaign's year, for timing strings that do not carry one. */
function campaignYear(campaign, basename) {
  for (const key of ['launch_date', 'start_date', 'end_date', 'launchDate']) {
    const v = String(campaign?.[key] || '');
    const m = v.match(/(20\d{2})/);
    if (m) return Number(m[1]);
  }
  const m = basename.match(/(20\d{2})/);
  return m ? Number(m[1]) : null;
}

// ── content ────────────────────────────────────────────────────────────────────────────

/** The caption. An array of slides/tweets becomes one body separated by blank lines. */
function toBody(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (Array.isArray(value)) {
    const parts = value.map((v) => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object') return String(v.text ?? v.content ?? v.caption ?? v.first_tweet ?? '').trim();
      return String(v ?? '');
    }).map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts.join('\n\n') : null;
  }
  if (typeof value === 'object') {
    const direct = toBody(value.text ?? value.content ?? value.caption ?? null);
    if (direct) return direct;
    // A story set is an object of frames ({day_1: [...], day_7: [...]}) rather than a
    // caption. Flatten it in key order so the copy lands in primary_content instead of
    // being visible only in metadata.legacy, where /post cannot publish from it.
    const parts = Object.values(value).map((v) => toBody(v)).filter(Boolean);
    return parts.length ? parts.join('\n\n') : null;
  }
  return String(value);
}

const KNOWN_ITEM_KEYS = new Set([
  'id', 'title', 'type', 'platform', 'platforms', 'content', 'timing', 'time',
  'scheduled_for', 'scheduledFor', 'status', 'hashtags', 'metadata',
]);

/** Everything the register cannot model, kept so the import loses nothing. */
function legacyOf(item, extra) {
  const legacy = { ...extra };
  for (const [k, v] of Object.entries(item)) {
    if (!KNOWN_ITEM_KEYS.has(k)) legacy[k] = v;
  }
  if (item.metadata && typeof item.metadata === 'object') legacy.item_metadata = item.metadata;
  if (item.type) legacy.type = item.type;
  if (item.status) legacy.status = item.status;
  return legacy;
}

// ── row builder ────────────────────────────────────────────────────────────────────────

function buildRow(item, ctx, sourceId, extraLegacy = {}) {
  const title = String(item.title || item.content_title || item.name || ctx.fallbackTitle || 'Untitled').trim();
  const channels = mapChannels(item.platforms ?? item.platform ?? ctx.platform ?? 'all');
  const scheduledFor = resolveScheduledFor(item, ctx);

  let status = mapStatus(item.status);
  let internalNotes = null;

  // A draft or a schedule whose date has been and gone was never posted, and calling it
  // "scheduled" on a page in September 2026 would be a lie about the future. It is marked
  // skipped and the note says why, on the row, where a person reading it will see it.
  if (scheduledFor && scheduledFor.slice(0, 10) < TODAY_ISO && (status === 'draft' || status === 'scheduled')) {
    status = 'skipped';
    internalNotes = `imported ${TODAY_ISO}: past date, never posted`;
  }

  const hashtags = Array.isArray(item.hashtags) ? item.hashtags.map(String) : [];
  const mediaUrls = (Array.isArray(item.media) ? item.media : [])
    .map(String)
    .filter((u) => u.startsWith('https://'));   // media_urls is public https only

  const row = {
    title: title.slice(0, 255),
    content_type: mapType(item.type ?? ctx.type),
    status,
    scheduled_for: scheduledFor,
    published_at: status === 'posted' ? scheduledFor : null,
    // `tweets` and `slides` carry the actual copy in the thread and carousel shapes; without
    // them the row imports with an empty caption and the words survive only in legacy.
    primary_content: toBody(
      item.content ?? item.caption ?? item.text ?? item.tweets ?? item.slides
      ?? item.first_tweet ?? item.concept ?? null),
    hashtags,
    media_urls: mediaUrls,
    internal_notes: internalNotes,
    metadata: {
      campaign: ctx.campaignSlug,
      channels,
      source: `file:${ctx.basename}#${sourceId}`,
      legacy: legacyOf(item, extraLegacy),
    },
  };
  return row;
}

// ── shape adapters ─────────────────────────────────────────────────────────────────────
// Six real shapes across the nine files. Each adapter returns rows; a file that matches
// none of them raises, because "0 items imported" from an unrecognised shape reads exactly
// like "this file was empty" and it is not the same thing.

function adaptPhasesObject(json, ctx) {
  // content_calendar.phases[].content[]  — evergreen, meet-aivor, 10th-anniversary(src), BHM
  const rows = [];
  const phases = json.content_calendar?.phases;
  if (!Array.isArray(phases)) return null;
  phases.forEach((phase, pi) => {
    const content = Array.isArray(phase.content) ? phase.content : [];
    content.forEach((item, ii) => {
      rows.push(buildRow(item, ctx, `phase${pi}-${ii}`, { phase: phase.name, phase_dates: phase.dates, phase_theme: phase.theme }));
    });
  });
  return rows;
}

function adaptPhaseArray(json, ctx) {
  // content_calendar[] = [{phase, content[]}]  — picnic, b2b-apparel
  const cc = json.content_calendar;
  if (!Array.isArray(cc) || !cc.length || !('phase' in cc[0])) return null;
  const rows = [];
  cc.forEach((block, bi) => {
    const content = Array.isArray(block.content) ? block.content : [];
    content.forEach((item, ii) => {
      rows.push(buildRow(item, ctx, `block${bi}-${ii}`, { phase: block.phase }));
    });
  });
  return rows;
}

function adaptDayArray(json, ctx) {
  // content_calendar[] = [{date, day_of_campaign, platforms:{plat:[items]}}]  — outoutchristmas
  const cc = json.content_calendar;
  if (!Array.isArray(cc) || !cc.length || !('platforms' in cc[0])) return null;
  const rows = [];
  cc.forEach((day, di) => {
    Object.entries(day.platforms || {}).forEach(([plat, items]) => {
      (Array.isArray(items) ? items : []).forEach((item, ii) => {
        rows.push(buildRow(
          item,
          { ...ctx, platform: plat, blockDate: day.date, fallbackTitle: `${plat} — day ${day.day_of_campaign}` },
          `day${di}-${plat}-${ii}`,
          { day_of_campaign: day.day_of_campaign, block_date: day.date },
        ));
      });
    });
  });
  return rows;
}

function adaptPlatformTree(json, ctx, key) {
  // social_media_content.{platform}.{postKey}  — board-recruitment
  // cross_platform_strategy.{platform}.{postKey}  — 10th-anniversary(root), holiday-2025
  const tree = json[key];
  if (!tree || typeof tree !== 'object') return null;
  const rows = [];
  Object.entries(tree).forEach(([plat, platformData]) => {
    const channel = CHANNEL_MAP[plat.toLowerCase()];
    if (!channel || !platformData || typeof platformData !== 'object') return;   // campaign_phases etc.
    Object.entries(platformData).forEach(([postKey, post]) => {
      const entries = Array.isArray(post) ? post : [post];
      entries.forEach((entry, ei) => {
        if (!entry || typeof entry !== 'object') return;
        const title = entry.title
          || `${postKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`;
        rows.push(buildRow(
          { ...entry, title },
          { ...ctx, platform: plat, type: entry.type || (postKey.includes('thread') ? 'thread' : 'post') },
          `${plat}-${postKey}${entries.length > 1 ? `-${ei}` : ''}`,
          { post_key: postKey, source_section: key },
        ));
      });
    });
  });
  return rows;
}

function adaptFile(json, ctx) {
  return adaptPhasesObject(json, ctx)
      ?? adaptPhaseArray(json, ctx)
      ?? adaptDayArray(json, ctx)
      ?? adaptPlatformTree(json, ctx, 'social_media_content')
      ?? adaptPlatformTree(json, ctx, 'cross_platform_strategy');
}

// ── the write ──────────────────────────────────────────────────────────────────────────

function readAccessToken() {
  // Set-but-empty is an error, never a silent fall back to the file: `SUPABASE_ACCESS_TOKEN=
  // node import-campaign-json.mjs …` must fail loudly, not import nothing and say "done".
  if ('SUPABASE_ACCESS_TOKEN' in process.env) {
    const fromEnv = (process.env.SUPABASE_ACCESS_TOKEN || '').trim();
    if (!fromEnv) throw new Error('SUPABASE_ACCESS_TOKEN is set in the environment but empty');
    return fromEnv;
  }
  if (!fs.existsSync(ENV_FILE)) throw new Error(`no token file at ${ENV_FILE}`);
  const token = fs.readFileSync(ENV_FILE, 'utf8')
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .reduce((acc, line) => {
      const i = line.indexOf('=');
      if (i > 0) acc[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      return acc;
    }, {}).SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error(`SUPABASE_ACCESS_TOKEN missing or empty in ${ENV_FILE}`);
  return token;
}

const sqlStr = (v) => "'" + String(v).replace(/'/g, "''") + "'";

function runSql(sql, token) {
  try {
    return execFileSync('node', [QUERY_HELPER, sql], {
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
      stdio: 'pipe', encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024,
    });
  } catch (e) {
    const detail = [e.stdout, e.stderr, e.message].filter(Boolean).join(' ')
      .split(token).join('<redacted>').trim();
    throw new Error(`query helper failed: ${detail.slice(0, 800)}`);
  }
}

/**
 * Insert one batch through public.admin_content_insert (migration 018): it validates the
 * vocabulary, resolves platform_id from channels, and refuses a duplicate source. The
 * returned `created` flag is what the counts below are built from — not the number of
 * statements sent, which would count a skipped duplicate as an insert.
 */
function insertBatch(rows, token) {
  const values = rows.map((r) => `(${sqlStr(JSON.stringify(r))}::jsonb)`).join(',\n         ');
  // The function is called ONCE per row and its jsonb result unpacked afterwards. Calling
  // it twice in the same SELECT (once for `created`, once for the id) would insert on the
  // first call and return {created:false} on the second — every row would report itself a
  // duplicate of itself.
  const sql =
    `WITH incoming(payload) AS (VALUES\n         ${values}\n),\n` +
    `     applied AS (SELECT public.admin_content_insert(payload) AS r FROM incoming)\n` +
    `SELECT (r->>'created')::boolean AS created, r->'row'->>'id' AS id, r->'row'->>'status' AS status\n` +
    `FROM applied;`;
  const out = runSql(sql, token);
  const parsed = JSON.parse(out);
  if (!Array.isArray(parsed)) throw new Error('the query helper did not return rows');
  return parsed;
}

// ── main ───────────────────────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const files = argv.filter((a) => !a.startsWith('--'));
  if (!files.length) {
    console.error('Usage: node scripts/import-campaign-json.mjs [--dry-run] <campaign json file...>');
    process.exit(2);
  }

  const token = dryRun ? null : readAccessToken();
  const perFile = [];
  const overall = {};
  let grandTotal = 0;
  let grandCreated = 0;
  let grandSkipped = 0;

  for (const file of files) {
    const abs = path.resolve(file);
    // The source key has to be unique or the idempotency check silently eats a file. Two
    // of the inputs share a basename with a src/data file (the repo root holds older
    // copies of board-recruitment and 10th-anniversary), so files inside this repo are
    // keyed by their path relative to it and everything else by basename. Keyed on
    // basename alone, the root board-recruitment's seven rows would every one of them
    // report "already there" and its differing wording would never reach the register.
    const rel = path.relative(REPO, abs);
    const basename = rel.startsWith('..') ? path.basename(abs) : rel;
    const json = JSON.parse(fs.readFileSync(abs, 'utf8'));
    const campaign = json.campaign || {};
    const ctx = {
      basename,
      // A slug, always. Two of the files carry a `name` and no `slug`, and an unslugged
      // "BLKOUT Annual Picnic 2026" sitting next to "meet-aivor-2026" in the same column
      // makes the campaign filter look like two different fields.
      campaignSlug: slugify(campaign.slug || campaign.name || path.basename(abs).replace(/^campaign-content-|\.json$/g, '')),
      year: campaignYear(campaign, basename),
      platform: null,
      type: null,
      blockDate: null,
      fallbackTitle: null,
    };

    const rows = adaptFile(json, ctx);
    if (rows === null) {
      throw new Error(`${basename}: no adapter matched this file's shape — top-level keys ${Object.keys(json).join(', ')}`);
    }

    const statuses = {};
    let undated = 0;
    for (const r of rows) {
      statuses[r.status] = (statuses[r.status] || 0) + 1;
      overall[r.status] = (overall[r.status] || 0) + 1;
      if (!r.scheduled_for) undated += 1;
    }
    grandTotal += rows.length;

    let created = null;
    let alreadyThere = null;
    if (!dryRun && rows.length) {
      const results = [];
      for (let i = 0; i < rows.length; i += 40) {
        results.push(...insertBatch(rows.slice(i, i + 40), token));
      }
      created = results.filter((r) => r.created === true).length;
      alreadyThere = results.length - created;
      grandCreated += created;
      grandSkipped += alreadyThere;
    }

    perFile.push({ basename, campaign: ctx.campaignSlug, items: rows.length, undated, statuses, created, alreadyThere });

    if (dryRun) {
      console.log(`\n=== ${basename}  (campaign ${ctx.campaignSlug}, ${rows.length} items) ===`);
      for (const r of rows) {
        const when = r.scheduled_for ? r.scheduled_for.slice(0, 16).replace('T', ' ') : '   (no date)   ';
        const body = (r.primary_content || '').replace(/\s+/g, ' ').slice(0, 60);
        console.log(`  ${when}  ${r.status.padEnd(9)} ${r.content_type.padEnd(8)} ` +
                    `${(r.metadata.channels.join('+') || '—').padEnd(28)} ${r.title.slice(0, 52).padEnd(52)} | ${body}`);
      }
    }
  }

  console.log(`\n${dryRun ? 'DRY RUN — nothing written' : 'IMPORT'}`);
  console.log('file'.padEnd(42) + 'items  undated  created  already  statuses');
  for (const f of perFile) {
    const st = Object.entries(f.statuses).sort().map(([k, v]) => `${k}:${v}`).join(' ');
    console.log(
      f.basename.padEnd(42) +
      String(f.items).padStart(5) +
      String(f.undated).padStart(9) +
      String(f.created ?? '-').padStart(9) +
      String(f.alreadyThere ?? '-').padStart(9) + '  ' + st);
  }
  const st = Object.entries(overall).sort().map(([k, v]) => `${k}:${v}`).join(' ');
  console.log('TOTAL'.padEnd(42) + String(grandTotal).padStart(5) +
              ''.padStart(9) + String(dryRun ? '-' : grandCreated).padStart(9) +
              String(dryRun ? '-' : grandSkipped).padStart(9) + '  ' + st);
}

main();
