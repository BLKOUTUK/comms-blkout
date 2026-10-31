#!/usr/bin/env node
// Events scraper health → Rob on Telegram (31 Oct 2026). The scraper (events-calendar
// api/scrape-events.ts) records every source's result in scraper_source_health and parks a source
// after two failed runs in a row. This tells Rob, once per parking, and also if the scraper has
// stopped running at all. Says nothing when nothing changed.
//
// Needs: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
const env = process.env;
for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]) {
  if (!env[k]) {
    console.error(`✗ FAILED: ${k} not set.`);
    process.exit(1);
  }
}
const STALE_DAYS = 8; // the scrape is weekly (Sunday 06:00 UTC)

const db = (path, init = {}) =>
  fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });

async function say(text) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    body: new URLSearchParams({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: "true" }),
  });
  if (!r.ok) throw new Error(`Telegram sendMessage failed: HTTP ${r.status} ${await r.text()}`);
}

const day = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "never");

try {
  const r = await db("scraper_source_health?select=*&order=source_name");
  if (!r.ok) throw new Error(`scraper_source_health read failed: ${r.status} ${await r.text()}`);
  const rows = await r.json();
  const lines = [];

  const lastRun = rows.map((x) => x.last_run_at).filter(Boolean).sort().pop();
  if (!lastRun || Date.now() - Date.parse(lastRun) > STALE_DAYS * 86400000) {
    lines.push(`The events scraper has not recorded a run since ${day(lastRun)}. The Sunday 06:00 scrape on events.blkoutuk.com may not be running.`);
  }

  const fresh = rows.filter((x) => x.parked_at && !x.alerted_at);
  for (const x of fresh) {
    lines.push(`Parked ${x.source_name}: ${x.parked_reason}. Last worked: ${day(x.last_ok_at)}. It won't be tried again until someone fixes it and clears parked_at in scraper_source_health.`);
  }

  if (!lines.length) {
    console.log(`Nothing new: ${rows.length} sources, last run ${lastRun}, ${rows.filter((x) => x.parked_at).length} parked (already reported).`);
  } else {
    const working = rows.filter((x) => !x.parked_at && !x.last_error).length;
    await say([`Events scraper (${working} of ${rows.length} sources working):`, "", ...lines.map((l) => `• ${l}`)].join("\n"));
    for (const x of fresh) {
      const m = await db(`scraper_source_health?source_id=eq.${encodeURIComponent(x.source_id)}`, { method: "PATCH", body: JSON.stringify({ alerted_at: new Date().toISOString() }) });
      if (!m.ok) console.log(`⚠ alerted_at not saved for ${x.source_id}: it will be reported again next week`);
    }
    console.log(`✓ Told Rob: ${lines.length} item(s)`);
  }
} catch (err) {
  console.error(`✗ FAILED: ${err.message}`);
  process.exit(1);
}
