/**
 * Shared between publish-instagram.mjs (direct Graph publish, needs an IG
 * token) and host-digest.mjs (public hosting for the Monday distribution
 * routine). One caption builder, one week-tag rule, one storage uploader —
 * two scripts producing slightly different captions is silent drift.
 */
import { readFile } from "node:fs/promises";

export function isoWeekTag(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil(((d - yearStart) / 86400000 + 1) / 7)).padStart(2, "0")}`;
}

// 2,200 characters is Instagram's hard limit. Count, never assume.
export function buildCaption(props, fallbackWeekTag) {
  const lines = [`BLKOUT News — ${props.weekLabel || fallbackWeekTag}`, ""];
  for (const s of (props.stories || []).slice(0, 3)) lines.push(`• ${s.title}`);
  lines.push("", "You're the editor. Vote on the stories that matter to you:",
             props?.cta?.displayUrl || "news.blkoutuk.com", "",
             "#BlackQueer #BLKOUT #MakingSpaceForUs #BlackQueerMen #QueerUK");
  let caption = lines.join("\n");
  if (caption.length > 2200) caption = caption.slice(0, 2197) + "...";
  console.log(`  caption: ${caption.length}/2200 chars`);
  return caption;
}

export async function putObject(body, key, { supabaseUrl, serviceKey, bucket, contentType }) {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${key}`, {
    method: "POST",
    headers: {
      // Both header forms: classic JWT service keys authenticate via
      // Authorization; new sb_secret_ keys authenticate via apikey and are
      // rejected as "Invalid Compact JWS" if sent as Bearer alone.
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body,
  });
  if (!res.ok) throw new Error(`Supabase upload failed for ${key}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${key}`;

  // Consumers (Instagram, the Monday routine) fetch this URL themselves. If it
  // is not publicly readable they fail opaquely, so prove reachability here.
  const head = await fetch(publicUrl, { method: "HEAD" });
  if (!head.ok) throw new Error(`Uploaded ${key} but not publicly reachable: HTTP ${head.status} — check bucket is public`);
  console.log(`  public: ${publicUrl} (${head.headers.get("content-length")} bytes)`);
  return publicUrl;
}

export async function uploadToStorage(filePath, key, opts) {
  const buf = await readFile(filePath);
  return putObject(buf, key, { contentType: "video/mp4", ...opts });
}
