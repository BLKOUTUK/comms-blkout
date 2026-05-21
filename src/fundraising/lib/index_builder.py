"""Build a JSON index of all fundraising drafts by scanning output frontmatter.

The index is the bridge between local markdown files and the Supabase
`cf_fundraising_drafts` table. Each entry corresponds to one draft file.
"""

import json
import re
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.drift_check import check_drift


HERE = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = HERE / "outputs"
INDEX_PATH = OUTPUTS_DIR / "_index.json"
REPO_ROOT = HERE.parent.parent.parent.parent  # blkout-platform/


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Extract YAML-ish frontmatter from a markdown file.

    Returns (frontmatter_dict, body). Supports the simple key: value format we generate.
    """
    if not text.startswith("---"):
        return {}, text
    end_marker = text.find("\n---", 4)
    if end_marker == -1:
        return {}, text
    fm_text = text[4:end_marker].strip()
    body = text[end_marker + 4 :].lstrip("\n")

    fm = {}
    for line in fm_text.split("\n"):
        line = line.rstrip()
        if not line or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        # strip quotes if present
        if value.startswith('"') and value.endswith('"'):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                value = value[1:-1]
        fm[key] = value
    return fm, body


def index_one(md_path: Path) -> dict | None:
    """Build an index record for a single output file."""
    text = md_path.read_text()
    fm, body = parse_frontmatter(text)

    if not fm.get("audience_profile"):
        return None  # not one of our generated outputs

    # Infer type from filename if missing (legacy proof-slice files)
    output_type = fm.get("type")
    if not output_type:
        stem = md_path.stem.lower()
        for candidate in ["briefing", "faq", "talking-points", "personal-letter", "reframe", "pushback", "difficult-conversation"]:
            if candidate in stem:
                output_type = candidate
                break
        output_type = output_type or "briefing"  # final fallback
        fm["type"] = output_type

    # Re-run drift check on body (excluding any embedded drift report)
    if "## Drift Review" in body:
        body_for_check = body.split("## Drift Review")[0]
    else:
        body_for_check = body
    drift_results = check_drift(body_for_check)
    statuses = [r["status"] for r in drift_results]
    drift_summary = {s: statuses.count(s) for s in ["PASS", "AMBIGUOUS", "DRIFT", "MISSING"]}

    # Path relative to repo root
    try:
        rel_path = md_path.relative_to(REPO_ROOT)
    except ValueError:
        rel_path = md_path

    record = {
        "file_path": str(rel_path),
        "prompt_id": fm.get("id"),
        "output_type": fm.get("type"),
        "audience_profile": fm.get("audience_profile"),
        "partner_name": fm.get("partner") or None,
        "notebook_id": fm.get("notebook_id"),
        "conversation_id": fm.get("conversation_id"),
        "word_count": int(fm["word_count"]) if fm.get("word_count", "").isdigit() else None,
        "references_count": int(fm["references_count"]) if fm.get("references_count", "").isdigit() else None,
        "drift_summary": drift_summary,
        "status": "draft",  # default; overridden below if frontmatter has a richer status
        "sent_at": fm.get("sent_at") or None,
        "sent_to": fm.get("sent_to") or None,
        "notes": fm.get("notes") or None,
        "generated_at": fm.get("generated_at"),
    }

    # Map our frontmatter `status` (e.g. "draft (pre-relational-layer)") to canonical
    raw_status = (fm.get("status") or "").lower()
    if "sent" in raw_status:
        record["status"] = "sent"
    elif "reviewed" in raw_status:
        record["status"] = "reviewed"
    elif "responded" in raw_status:
        record["status"] = "responded"
    elif "archived" in raw_status:
        record["status"] = "archived"
    else:
        record["status"] = "draft"

    return record


def build_index() -> list[dict]:
    """Scan all *.md outputs and produce a list of index records."""
    records = []
    for md in sorted(OUTPUTS_DIR.rglob("*.md")):
        if md.name.startswith("_"):
            continue
        rec = index_one(md)
        if rec:
            records.append(rec)
    return records


def write_index(records: list[dict]) -> Path:
    """Write the index JSON to disk."""
    INDEX_PATH.write_text(json.dumps({"records": records, "count": len(records)}, indent=2))
    return INDEX_PATH


if __name__ == "__main__":
    records = build_index()
    write_index(records)
    print(f"Indexed {len(records)} drafts → {INDEX_PATH.relative_to(REPO_ROOT)}")
    by_profile = {}
    for r in records:
        by_profile.setdefault(r["audience_profile"], 0)
        by_profile[r["audience_profile"]] += 1
    print(f"\nBy audience profile:")
    for k in sorted(by_profile):
        print(f"  {k}: {by_profile[k]}")
    by_status = {}
    for r in records:
        by_status.setdefault(r["status"], 0)
        by_status[r["status"]] += 1
    print(f"\nBy status:")
    for k in sorted(by_status):
        print(f"  {k}: {by_status[k]}")
