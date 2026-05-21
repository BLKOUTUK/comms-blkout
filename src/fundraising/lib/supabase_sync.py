"""Push the local fundraising index to Supabase cf_fundraising_drafts.

Auth: requires either SUPABASE_ACCESS_TOKEN (management API) or SUPABASE_URL +
SUPABASE_SERVICE_ROLE_KEY (REST API). Tries REST first, falls back to management.

Also attempts fuzzy-match of partner_name → organizations.id and populates
organization_id where confident.
"""

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.index_builder import INDEX_PATH, build_index, write_index


SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://bgjengudzfickgomjqmz.supabase.co")


def _post_rest(table: str, rows: list[dict], key: str, on_conflict: str = "file_path") -> dict:
    """Upsert rows into a Supabase table via PostgREST."""
    url = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict={on_conflict}"
    body = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return {"status": resp.status, "body": resp.read().decode("utf-8")}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "body": e.read().decode("utf-8"), "error": True}


def _select_rest(table: str, key: str, params: str = "") -> list[dict] | None:
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"  SELECT {table} failed: {e.code} {e.read().decode('utf-8')[:200]}")
        return None


def _fuzzy_match_orgs(records: list[dict], key: str) -> dict[str, str]:
    """Look up organization_id by partner_name. Returns {partner_name: org_id}."""
    partner_names = sorted({r["partner_name"] for r in records if r.get("partner_name")})
    if not partner_names:
        return {}

    orgs = _select_rest("organizations", key, params="select=id,name&limit=2000")
    if not orgs:
        return {}

    STOP_TOKENS = {"the", "a", "an", "of", "and", "for", "trust", "foundation", "fund", "charity"}

    def tokens(s: str) -> set[str]:
        return {t for t in s.lower().replace("&", " and ").split() if t and t not in STOP_TOKENS}

    matches = {}
    for pn in partner_names:
        pn_lower = pn.lower().strip()
        pn_tokens = tokens(pn)

        # 1) exact match
        for o in orgs:
            if o["name"].lower().strip() == pn_lower:
                matches[pn] = o["id"]
                break
        if pn in matches:
            continue

        # 2) substring match (either direction)
        for o in orgs:
            on = o["name"].lower().strip()
            if pn_lower in on or on in pn_lower:
                matches[pn] = o["id"]
                break
        if pn in matches:
            continue

        # 3) token overlap — match if ≥50% of the smaller token set is shared
        best = None
        best_overlap = 0
        for o in orgs:
            o_tokens = tokens(o["name"])
            if not o_tokens or not pn_tokens:
                continue
            overlap = pn_tokens & o_tokens
            denom = min(len(pn_tokens), len(o_tokens))
            ratio = len(overlap) / denom
            # require: at least one significant token shared AND ≥50% overlap
            if overlap and ratio >= 0.5 and ratio > best_overlap:
                best = o["id"]
                best_overlap = ratio
        if best:
            matches[pn] = best

    return matches


def sync(*, dry_run: bool = False) -> dict:
    """Build index, fuzzy-match orgs, upsert into Supabase."""
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
    if not key and not dry_run:
        return {
            "status": "error",
            "error": "Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY in the environment.",
            "hint": "Find it in Supabase dashboard → Project Settings → API.",
        }

    records = build_index()
    write_index(records)
    print(f"Indexed {len(records)} drafts")

    # fuzzy match partner names to organization IDs
    org_matches = {}
    if key:
        org_matches = _fuzzy_match_orgs(records, key)
        print(f"Fuzzy-matched {len(org_matches)}/{len({r['partner_name'] for r in records if r.get('partner_name')})} unique partners to CRM orgs")

    # prepare rows for upsert
    rows = []
    for r in records:
        row = {
            "file_path": r["file_path"],
            "audience_profile": r["audience_profile"],
            "output_type": r["output_type"],
            "partner_name": r.get("partner_name"),
            "organization_id": org_matches.get(r.get("partner_name")) if r.get("partner_name") else None,
            "notebook_id": r.get("notebook_id"),
            "conversation_id": r.get("conversation_id"),
            "prompt_id": r.get("prompt_id"),
            "word_count": r.get("word_count"),
            "references_count": r.get("references_count"),
            "drift_summary": r.get("drift_summary", {}),
            "status": r.get("status", "draft"),
            "notes": r.get("notes"),
            "generated_at": r.get("generated_at"),
        }
        # parse generated_at into ISO
        if isinstance(row["generated_at"], str) and " " in row["generated_at"]:
            row["generated_at"] = row["generated_at"].replace(" ", "T") + ":00Z"
        rows.append(row)

    if dry_run:
        print(f"\n[dry-run] would upsert {len(rows)} rows. Sample:")
        print(json.dumps(rows[:2], indent=2, default=str))
        return {"status": "dry-run", "row_count": len(rows)}

    # batch upsert (Supabase REST can handle ~1000 at a time)
    result = _post_rest("cf_fundraising_drafts", rows, key)
    if result.get("error"):
        return {"status": "error", "http_status": result["status"], "body": result["body"][:500]}

    return {
        "status": "success",
        "rows_synced": len(rows),
        "partners_matched": len(org_matches),
    }


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    result = sync(dry_run=args.dry_run)
    print(f"\nResult: {json.dumps(result, indent=2, default=str)}")
