#!/usr/bin/env node
// One-shot YouTube refresh-token re-mint.
//
// Why this exists: the OAuth app is in Google's Testing mode (restricted scope
// youtube.upload requires CASA + brand verification to publish), so refresh
// tokens expire ~7 days from mint. Until verification lands, this script
// makes the weekly re-mint a 30-second consent click instead of a manual
// OAuth Playground + nano + gh-secret-set dance.
//
// Prerequisites (one-time setup):
//   1. GCP Console → OAuth client → add http://localhost:8779/callback
//      to "Authorised redirect URIs" alongside the existing Playground URI.
//      (Port 8779 avoids collision with missioncontrol's 8765.)
//   2. /home/robbe/blkout-platform/.env contains YT_CLIENT_ID and YT_CLIENT_SECRET.
//
// What it does:
//   - Opens browser to Google consent URL (forces refresh_token issuance)
//   - Listens on localhost:8765, captures the auth code from redirect
//   - Exchanges code for refresh_token via oauth2.googleapis.com/token
//   - Writes YT_REFRESH_TOKEN and YT_REFRESH_TOKEN_MINTED_AT to .env
//   - Pushes new YT_REFRESH_TOKEN to BLKOUTUK/comms-blkout GH secret
//
// Usage:
//   node remotion-videos/scripts/yt-remint.mjs
//
// Sign in as blkoutuk@gmail.com (the account that owns the YT channel).
// Not rob@blkoutuk.com — Workspace has no channel attached.

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const PORT = 8779;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const ENV_PATH = "/home/robbe/blkout-platform/.env";
const REPO = "BLKOUTUK/comms-blkout";
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

async function loadEnv() {
  const raw = await readFile(ENV_PATH, "utf8");
  const map = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) map[m[1]] = m[2];
  }
  return { raw, map };
}

async function upsertEnvKeys(updates) {
  let { raw } = await loadEnv();
  for (const [k, v] of Object.entries(updates)) {
    const line = `${k}=${v}`;
    const re = new RegExp(`^${k}=.*$`, "m");
    if (re.test(raw)) {
      raw = raw.replace(re, line);
    } else {
      raw = raw.replace(/\n*$/, "\n") + line + "\n";
    }
  }
  await writeFile(ENV_PATH, raw, { encoding: "utf8", mode: 0o600 });
}

function setGhSecret(name, value) {
  return new Promise((res, rej) => {
    const proc = spawn(
      "gh",
      ["secret", "set", name, "--repo", REPO, "--body", value],
      { stdio: ["ignore", "inherit", "inherit"] }
    );
    proc.on("close", (code) =>
      code === 0 ? res() : rej(new Error(`gh secret set exited ${code}`))
    );
    proc.on("error", rej);
  });
}

function openBrowser(url) {
  for (const cmd of ["wslview", "xdg-open", "open"]) {
    try {
      const p = spawn(cmd, [url], { stdio: "ignore", detached: true });
      p.on("error", () => {});
      p.unref();
      return true;
    } catch {}
  }
  return false;
}

async function exchangeCode(code, clientId, clientSecret) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  const { map: env } = await loadEnv();
  if (!env.YT_CLIENT_ID || !env.YT_CLIENT_SECRET) {
    console.error(
      `\n✗ YT_CLIENT_ID and YT_CLIENT_SECRET must be set in ${ENV_PATH} first.\n` +
        `\n  Add them via:  nano ${ENV_PATH}\n` +
        `  Values live in: GCP Console → APIs & Services → Credentials → OAuth 2.0 Client IDs\n` +
        `  Project: the personal GCP project owned by blkoutuk@gmail.com\n`
    );
    process.exit(1);
  }

  const consentUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: env.YT_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
    });

  console.log("Opening browser for OAuth consent…");
  console.log("  → Sign in as blkoutuk@gmail.com (NOT rob@blkoutuk.com)");
  console.log(`  → If the browser doesn't open, paste this URL manually:\n\n${consentUrl}\n`);

  const codePromise = new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url, `http://localhost:${PORT}`);
      if (u.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
      }
      const code = u.searchParams.get("code");
      const error = u.searchParams.get("error");
      if (error) {
        res
          .writeHead(400, { "Content-Type": "text/html" })
          .end(`<h1>OAuth error</h1><pre>${error}</pre>`);
        server.close();
        reject(new Error(error));
        return;
      }
      res
        .writeHead(200, { "Content-Type": "text/html" })
        .end(
          "<h1>Done.</h1><p>Refresh token captured. You can close this tab.</p>"
        );
      server.close();
      resolve(code);
    });
    server.listen(PORT, "127.0.0.1");
    server.on("error", reject);
  });

  openBrowser(consentUrl);

  const code = await codePromise;
  console.log("✓ Got authorisation code.");

  const tokens = await exchangeCode(
    code,
    env.YT_CLIENT_ID,
    env.YT_CLIENT_SECRET
  );
  if (!tokens.refresh_token) {
    console.error(
      "\n✗ No refresh_token in response. Google only issues one on first consent or after revoke.\n" +
        "  Fix: visit https://myaccount.google.com/permissions, remove this app's access,\n" +
        "  then re-run this script.\n\nResponse:\n",
      JSON.stringify(tokens, null, 2)
    );
    process.exit(1);
  }

  const mintedAt = new Date().toISOString();
  const expiresApprox = new Date(Date.now() + 7 * 86_400_000).toISOString();

  await upsertEnvKeys({
    YT_REFRESH_TOKEN: tokens.refresh_token,
    YT_REFRESH_TOKEN_MINTED_AT: mintedAt,
  });
  console.log(`✓ Wrote YT_REFRESH_TOKEN to ${ENV_PATH}`);

  await setGhSecret("YT_REFRESH_TOKEN", tokens.refresh_token);
  console.log(`✓ Updated GH secret YT_REFRESH_TOKEN on ${REPO}`);

  const safeReMintBy = new Date(
    Date.now() + 7 * 86_400_000 - 48 * 3_600_000
  ).toISOString();
  console.log(
    `\nMinted at:           ${mintedAt}` +
      `\nExpires (~7 days):   ${expiresApprox}` +
      `\nRe-mint by (-48h):   ${safeReMintBy}` +
      `\n\nNext Sunday cron:    will succeed if ≤ ${expiresApprox.slice(0, 10)}.`
  );
}

main().catch((err) => {
  console.error(`✗ Re-mint failed: ${err.message}`);
  process.exit(1);
});
