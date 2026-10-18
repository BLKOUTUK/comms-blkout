#!/usr/bin/env node
/**
 * Count Instagram comment-votes on The Wire's "voting open" Reel (Rob, 18 Oct 2026).
 *
 * The Reel numbers each story; people comment the numbers they back. For every news-wire
 * "open" post whose fortnight is still open, this reads the comments and records one vote
 * per Instagram account per story in news_votes, exactly like a site vote (the existing
 * trigger updates the counts). Voter id = "ig_" + sha256(username), so no handle is stored.
 * Votes are only ever added: deleting a comment does not remove a vote, and a site vote and
 * an Instagram vote from the same person count separately (we cannot link them).
 *
 * Flags: --dry-run (count and report, write nothing)
 * Needs: META_PAGE_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({ options: { "dry-run": { type: "boolean", default: false } }, strict: true });
const env = process.env;
const missing = ["META_PAGE_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !env[k]);
if (missing.length) { console.error(`✗ FAILED: missing ${missing.join(", ")}`); process.exit(1); }
const GRAPH = "https://graph.facebook.com/v21.0";

const getJson = async (url, init) => {
  const r = await fetch(url, init);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`${url.split("?")[0]}: HTTP ${r.status} ${JSON.stringify(j.error || j).slice(0, 300)}`);
  return j;
};
const sb = (path, init = {}) => getJson(`${env.SUPABASE_URL}/rest/v1/${path}`, {
  ...init,
  headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
});

const active = await sb("voting_periods?status=eq.active&select=id&limit=1");
if (!active.length) { console.log("No active fortnight. Nothing to count."); process.exit(0); }
const posts = await sb(`content_calendar?select=id,metadata&metadata->>campaign=eq.news-wire&metadata->>moment=eq.open&metadata->>period_id=eq.${active[0].id}`);
const reels = posts.filter((p) => p.metadata?.posted?.instagram_media_id && p.metadata?.story_ids?.length);
if (!reels.length) { console.log("No 'voting open' Reel for this fortnight yet."); process.exit(0); }

let added = 0, seen = 0;
for (const post of reels) {
  const ids = post.metadata.story_ids;
  let url = `${GRAPH}/${post.metadata.posted.instagram_media_id}/comments?fields=id,text,username&limit=100&access_token=${env.META_PAGE_TOKEN}`;
  while (url) {
    const page = await getJson(url);
    for (const c of page.data || []) {
      if (!c.username) continue;
      const voter = "ig_" + createHash("sha256").update(c.username.toLowerCase()).digest("hex").slice(0, 32);
      const numbers = [...new Set((c.text || "").match(/\b\d{1,2}\b/g) || [])].map(Number).filter((n) => n >= 1 && n <= ids.length);
      for (const n of numbers) {
        seen++;
        const article = ids[n - 1];
        const exists = await sb(`news_votes?select=id&article_id=eq.${article}&voter_id=eq.${voter}&limit=1`);
        if (exists.length) continue;
        if (!args["dry-run"]) {
          await sb("news_votes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ article_id: article, voter_id: voter, user_id: null }) });
        }
        added++;
      }
    }
    url = page.paging?.next || null;
  }
}
console.log(`${args["dry-run"] ? "DRY RUN: would add" : "Added"} ${added} vote(s) from ${seen} numbered comment mention(s) on ${reels.length} Reel(s).`);
