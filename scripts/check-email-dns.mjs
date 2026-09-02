#!/usr/bin/env node
/**
 * Email DNS posture check for blkoutuk.com.
 *
 * Exists because blkoutuk.com published TWO SPF records for months without
 * anyone noticing (fixed 2 Sept 2026). More than one SPF record is a PermError
 * under RFC 7208 §4.5 — not a pass, not a soft fail — so every message with an
 * envelope-from at the apex failed SPF. It stayed invisible because Google
 * DKIM-signs outbound and DMARC still passed on the DKIM leg alone.
 *
 * Nothing here needs a secret: it is all public DNS. Queries two independent
 * resolvers and only fails when they agree, so one flaky resolver cannot raise
 * a false alarm at 06:00 on a Monday.
 *
 * Exit 0 = healthy (warnings allowed), 1 = a real regression.
 */

const DOMAIN = process.env.CHECK_DOMAIN || "blkoutuk.com";
const SENDER_SUBDOMAIN = `sendfox.${DOMAIN}`;
const MAX_SPF_LOOKUPS = 10;

const RESOLVERS = {
  google: (n, t) => `https://dns.google/resolve?name=${n}&type=${t}`,
  cloudflare: (n, t) => `https://cloudflare-dns.com/dns-query?name=${n}&type=${t}`,
};

const errors = [];
const warnings = [];
const notes = [];

async function query(resolver, name, type) {
  const res = await fetch(RESOLVERS[resolver](name, type), {
    headers: { accept: "application/dns-json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`${resolver} HTTP ${res.status}`);
  const json = await res.json();
  return (json.Answer || []).map((a) => String(a.data || "").replace(/^"|"$/g, ""));
}

/** Ask both resolvers. Returns null when they disagree or one is unreachable. */
async function agreed(name, type, pick = (x) => x) {
  const out = {};
  for (const r of Object.keys(RESOLVERS)) {
    try {
      out[r] = pick(await query(r, name, type));
    } catch (err) {
      warnings.push(`${r} could not resolve ${type} ${name} (${err.message}) — skipping this check`);
      return null;
    }
  }
  const [a, b] = Object.values(out).map((v) => JSON.stringify([...v].sort()));
  if (a !== b) {
    warnings.push(`resolvers disagree on ${type} ${name} — likely mid-propagation, not alerting`);
    return null;
  }
  return Object.values(out)[0];
}

const spfOf = (records) => records.filter((d) => d.toLowerCase().startsWith("v=spf1"));

/** Count the DNS-querying mechanisms an SPF record costs (the RFC limit is 10). */
async function spfLookups(name, depth = 0, seen = new Set()) {
  if (depth > 5 || seen.has(name)) return 0;
  seen.add(name);
  let n = 0;
  let records;
  try {
    records = spfOf(await query("google", name, "TXT"));
  } catch {
    return 0;
  }
  for (const rec of records) {
    for (const tok of rec.split(/\s+/)) {
      const t = tok.toLowerCase();
      if (t === "a" || t === "mx") n += 1;
      else if (/^(include:|a:|mx:|exists:|redirect=)/.test(t)) {
        n += 1;
        const target = tok.split(/[:=]/)[1];
        if (target && (t.startsWith("include:") || t.startsWith("redirect="))) {
          n += await spfLookups(target, depth + 1, seen);
        }
      }
    }
  }
  return n;
}

async function main() {
  console.log(`Checking email DNS posture for ${DOMAIN}\n`);

  // 1. Exactly one SPF record at the apex. This is the regression that prompted the check.
  const apexTxt = await agreed(DOMAIN, "TXT", spfOf);
  if (apexTxt) {
    if (apexTxt.length === 1) {
      notes.push(`SPF: exactly one record — ${apexTxt[0]}`);
      const lookups = await spfLookups(DOMAIN);
      if (lookups > MAX_SPF_LOOKUPS) {
        errors.push(`SPF uses ${lookups} DNS lookups, over the RFC limit of ${MAX_SPF_LOOKUPS} — receivers will PermError.`);
      } else {
        notes.push(`SPF lookups: ${lookups} of ${MAX_SPF_LOOKUPS}`);
      }
    } else if (apexTxt.length === 0) {
      errors.push(`No SPF record on ${DOMAIN}. Outbound mail has no envelope authentication.`);
    } else {
      errors.push(
        `${apexTxt.length} SPF records on ${DOMAIN} — RFC 7208 makes this a PermError, so SPF fails for EVERY message. ` +
          `Delete all but one in Hostinger. Found:\n    ${apexTxt.join("\n    ")}`
      );
    }
  }

  // 2. DMARC present. Policy is reported, not enforced — p=none is a deliberate
  //    position until enough aggregate reports confirm every sender authenticates.
  const dmarc = await agreed(`_dmarc.${DOMAIN}`, "TXT", (r) =>
    r.filter((d) => d.toLowerCase().startsWith("v=dmarc1"))
  );
  if (dmarc) {
    if (dmarc.length !== 1) {
      errors.push(`Expected exactly one DMARC record on _dmarc.${DOMAIN}, found ${dmarc.length}.`);
    } else {
      const policy = /\bp=([a-z]+)/i.exec(dmarc[0])?.[1] ?? "?";
      notes.push(`DMARC: p=${policy}`);
      if (policy === "none") {
        warnings.push(
          "DMARC is p=none — monitoring only, no protection against spoofing of this domain. " +
            "Deliberate for now; revisit once aggregate reports confirm every sender authenticates."
        );
      }
      if (!/\brua=/i.test(dmarc[0])) {
        warnings.push("DMARC has no rua= address, so no aggregate reports are being collected.");
      }
    }
  }

  // 3. MX must exist, or inbound mail is dead.
  const mx = await agreed(DOMAIN, "MX");
  if (mx) {
    if (mx.length === 0) errors.push(`No MX records on ${DOMAIN} — inbound mail is not deliverable.`);
    else notes.push(`MX: ${mx.join(", ")}`);
  }

  // 4. The newsletter sender's own subdomain, which carries its own SPF.
  const senderSpf = await agreed(SENDER_SUBDOMAIN, "TXT", spfOf);
  if (senderSpf) {
    if (senderSpf.length === 1) notes.push(`${SENDER_SUBDOMAIN} SPF: one record`);
    else if (senderSpf.length > 1)
      errors.push(`${senderSpf.length} SPF records on ${SENDER_SUBDOMAIN} — PermError for newsletter sends.`);
    else warnings.push(`No SPF record on ${SENDER_SUBDOMAIN}.`);
  }

  for (const n of notes) console.log(`  ok   ${n}`);
  for (const w of warnings) console.log(`  warn ${w}`);
  for (const e of errors) console.log(`  FAIL ${e}`);

  if (process.env.GITHUB_ACTIONS) {
    for (const w of warnings) console.log(`::warning::${w}`);
    for (const e of errors) console.log(`::error::${e}`);
  }

  console.log(
    `\n${errors.length ? "FAILED" : "PASSED"} — ${notes.length} ok, ${warnings.length} warning(s), ${errors.length} error(s)`
  );
  process.exit(errors.length ? 1 : 0);
}

main().catch((err) => {
  // A total failure to reach any resolver is infrastructure noise, not a DNS
  // regression. Do not wake anyone up for it.
  console.log(`::warning::Email DNS check could not complete: ${err.message}`);
  console.log("Treating as transient — not failing the run.");
  process.exit(0);
});
