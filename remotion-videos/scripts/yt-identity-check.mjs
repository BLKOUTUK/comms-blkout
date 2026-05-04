#!/usr/bin/env node
// Diagnose which YouTube channel(s) the configured OAuth refresh token can see.
// Reads YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN from env.
// Prints channels.list?mine=true result so we know whether the token reaches
// the BLKOUT channel UC7g_Es50958bYJauxym0n1A.

const REQUIRED = ["YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"];
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.error(`${k} not set.`);
    process.exit(1);
  }
}

const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: process.env.YT_CLIENT_ID,
    client_secret: process.env.YT_CLIENT_SECRET,
    refresh_token: process.env.YT_REFRESH_TOKEN,
    grant_type: "refresh_token",
  }),
});
if (!tokenRes.ok) {
  console.error(`Refresh failed: ${tokenRes.status} ${await tokenRes.text()}`);
  process.exit(1);
}
const { access_token, scope } = await tokenRes.json();
console.log("Refresh OK. Granted scopes:");
console.log("  " + scope);

const url =
  "https://www.googleapis.com/youtube/v3/channels?part=id,snippet,status&mine=true";
const chRes = await fetch(url, {
  headers: { Authorization: `Bearer ${access_token}` },
});
const body = await chRes.text();
console.log(`\nchannels.list?mine=true → HTTP ${chRes.status}`);
console.log(body);

if (chRes.ok) {
  const json = JSON.parse(body);
  const channels = json.items || [];
  console.log(`\nChannel count visible to this token: ${channels.length}`);
  for (const c of channels) {
    console.log(`  - ${c.id}  "${c.snippet?.title}"`);
  }
  const target = "UC7g_Es50958bYJauxym0n1A";
  const found = channels.some((c) => c.id === target);
  console.log(`\nBLKOUT channel ${target} reachable: ${found ? "YES" : "NO"}`);
}
