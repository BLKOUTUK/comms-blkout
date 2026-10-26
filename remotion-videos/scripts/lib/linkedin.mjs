// Direct LinkedIn posting for the BLKOUT company page (no Zapier; Rob, 26 Oct 2026).
// CI holds the app's refresh token (valid a year from login; LinkedIn does not extend it on use)
// and swaps it for a 60-day access token on every run, so nobody has to log in weekly.
// Re-login before it lapses: node ~/blkout/platform/scripts/linkedin-auth.mjs, then update the
// LINKEDIN_REFRESH_TOKEN secret. refreshDaysLeft() lets callers warn ahead of time.
//
// Video: initializeUpload → PUT each part (collect ETags) → finalizeUpload → wait for AVAILABLE
// → POST /rest/posts. Commentary is LinkedIn "little text", so reserved characters are escaped.
import { readFile } from "node:fs/promises";

const API = "https://api.linkedin.com/rest";
const VERSION = "202601";
export const ORG_URN = "urn:li:organization:19202635";
const CLIENT_ID = "78gtl6ezibp2ip";

let refreshDaysLeft = null;
export const linkedinRefreshDaysLeft = () => refreshDaysLeft;

export async function linkedinToken(env = process.env) {
  const r = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: env.LINKEDIN_REFRESH_TOKEN,
      client_id: CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`token refresh failed: ${j.error_description || j.error || r.status} (re-run linkedin-auth.mjs)`);
  refreshDaysLeft = j.refresh_token_expires_in ? Math.floor(j.refresh_token_expires_in / 86400) : null;
  return j.access_token;
}

const headers = (token, extra = {}) => ({
  Authorization: `Bearer ${token}`,
  "LinkedIn-Version": VERSION,
  "X-Restli-Protocol-Version": "2.0.0",
  ...extra,
});

async function call(token, path, init = {}) {
  const r = await fetch(`${API}/${path}`, { ...init, headers: headers(token, init.body ? { "Content-Type": "application/json" } : {}) });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path.split("?")[0]}: HTTP ${r.status} ${text.slice(0, 300)}`);
  return { json: text ? JSON.parse(text) : {}, res: r };
}

// Escape LinkedIn little-text reserved characters so captions post as written.
export const littleText = (s) => s.replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`);

// Upload an mp4 as an organisation video; returns its urn once LinkedIn reports AVAILABLE.
export async function uploadVideo(token, buf) {
  const { json: init } = await call(token, "videos?action=initializeUpload", {
    method: "POST",
    body: JSON.stringify({ initializeUploadRequest: { owner: ORG_URN, fileSizeBytes: buf.length, uploadCaptions: false, uploadThumbnail: false } }),
  });
  const { video, uploadToken = "", uploadInstructions } = init.value;
  const partIds = [];
  for (const part of uploadInstructions) {
    const r = await fetch(part.uploadUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" },
      body: buf.subarray(part.firstByte, part.lastByte + 1),
    });
    if (!r.ok) throw new Error(`video part upload: HTTP ${r.status}`);
    partIds.push(r.headers.get("etag"));
  }
  await call(token, "videos?action=finalizeUpload", {
    method: "POST",
    body: JSON.stringify({ finalizeUploadRequest: { video, uploadToken, uploadedPartIds: partIds } }),
  });
  let status = "";
  for (let i = 0; i < 30 && status !== "AVAILABLE"; i++) {
    await new Promise((r) => setTimeout(r, 10_000));
    ({ json: { status } } = await call(token, `videos/${encodeURIComponent(video)}`));
    if (status === "PROCESSING_FAILED") throw new Error(`video ${video} processing failed`);
  }
  if (status !== "AVAILABLE") throw new Error(`video ${video} still ${status} after 5 min`);
  return video;
}

// Post a video to the company page. Returns { id, url }.
export async function postVideo(token, { file, url, commentary, title }) {
  const buf = file ? await readFile(file) : Buffer.from(await (await fetch(url)).arrayBuffer());
  const video = await uploadVideo(token, buf);
  const { res } = await call(token, "posts", {
    method: "POST",
    body: JSON.stringify({
      author: ORG_URN,
      commentary: littleText(commentary),
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      content: { media: { title, id: video } },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  const id = res.headers.get("x-restli-id");
  if (!id) throw new Error("post created but LinkedIn returned no id");
  return { id, url: `https://www.linkedin.com/feed/update/${id}` };
}
