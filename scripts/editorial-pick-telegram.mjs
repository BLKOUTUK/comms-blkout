#!/usr/bin/env node
/**
 * Saturday morning, on the day a news voting round closes, send Rob the round's
 * stories by Telegram with one signed link to pick up to three.
 *
 * Picks land on news.blkoutuk.com/api/editor-pick (news-blkout), which verifies
 * the same HMAC. If the vote separates the field by midnight the vote wins;
 * otherwise the picks lead the round's results and Sunday's digest video.
 * Replaces the Sunday ask to Bayard2, which could never reach a person.
 *
 * Needs: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * Flags: --dry-run  print the message (link withheld) and check the server accepts it
 *        --force    send even if the round doesn't close today
 */
import { createHmac } from 'node:crypto';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('✗ FAILED: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
  process.exit(1);
}
if (!DRY_RUN && (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID)) {
  console.error('✗ FAILED: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing — Rob would not be told.');
  process.exit(1);
}

const rest = async (path) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!r.ok) throw new Error(`Supabase ${path.split('?')[0]}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
};

const [period] = await rest('voting_periods?status=eq.active&select=id,period_number,end_date&order=period_number.desc&limit=1');
if (!period) {
  console.error('✗ FAILED: no active voting period.');
  process.exit(1);
}

const endsOn = String(period.end_date).slice(0, 10);
const today = new Date().toISOString().slice(0, 10);
if (endsOn !== today && !FORCE) {
  console.log(`Round ${period.period_number} closes ${endsOn}, not today (${today}). Nothing to send.`);
  process.exit(0);
}

const stories = await rest(
  `news_articles?voting_period_id=eq.${period.id}&published=eq.true&status=eq.published` +
  `&select=title,source_name,upvote_count&order=upvote_count.desc.nullslast,published_at.desc&limit=8`
);

const exp = Math.floor(new Date(period.end_date).getTime() / 1000);
const sig = createHmac('sha256', SUPABASE_SERVICE_ROLE_KEY).update(`editor-pick:${period.id}:${exp}`).digest('hex');
const link = `https://news.blkoutuk.com/api/editor-pick?period=${period.id}&exp=${exp}&sig=${sig}`;

const votes = stories.map((s) => s.upvote_count || 0);
const contested = votes[0] > 0 && new Set(votes).size > 1;

const text = stories.length === 0
  ? `Round ${period.period_number} closes tonight with no published stories, so there's nothing to pick.`
  : [
      `Round ${period.period_number} closes at midnight tonight.`,
      contested
        ? `The vote is separating the field (top story ${votes[0]} votes), so the vote will likely decide. You can still pick in case it ties.`
        : `Nobody's vote has separated the field. Pick up to 3 to lead the results and Sunday's video:`,
      '',
      ...stories.map((s, i) => `${i + 1}. ${s.title}${s.source_name ? ` (${s.source_name})` : ''} · ${s.upvote_count || 0} votes`),
      '',
      `Pick here: ${link}`,
    ].join('\n');

if (DRY_RUN) {
  // The repo and its logs are public, so never print the signed link.
  // Instead prove the news server accepts its signature.
  console.log(text.replace(link, '[signed link withheld]'));
  const check = await fetch(link);
  if (!check.ok) {
    console.error(`✗ FAILED: news server refused the signed link (HTTP ${check.status}) — the two service keys differ.`);
    process.exit(1);
  }
  console.log(`✓ News server accepts the signed link (HTTP ${check.status}).`);
  process.exit(0);
}

const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
});
if (!r.ok) {
  console.error(`✗ FAILED: Telegram HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  process.exit(1);
}
console.log(`✓ Sent Round ${period.period_number} pick list to Rob (${stories.length} stories).`);
