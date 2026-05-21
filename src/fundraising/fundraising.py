#!/usr/bin/env python3
"""Critical Frequency fundraising CLI.

Per-partner generation, listing, and inspection of Critical Frequency comms drafts.

Usage:
    fundraising generate --audience A --type briefing --partner "Wellcome Mental Health"
    fundraising generate --audience A --type briefing --partner "Health Foundation" --notes "follow-up to 12 May call"
    fundraising list
    fundraising list --partner Wellcome
    fundraising list --audience A
    fundraising profiles
    fundraising types
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib.generator import (
    OUTPUTS_DIR,
    RUNS_LOG,
    HERE,
    available_combos,
    find_prompt,
    generate_to_file,
    slugify,
)
from lib.profiles import PROFILES
from lib.index_builder import build_index, write_index, INDEX_PATH


def cmd_generate(args):
    entry = find_prompt(args.audience, args.type)
    if entry is None:
        combos = available_combos()
        print(f"ERROR: no prompt found for audience={args.audience} type={args.type}\n")
        print("Available (audience, type) combos:")
        for aud, typ in combos:
            print(f"  {aud:<4} {typ}")
        sys.exit(2)

    partner_slug = slugify(args.partner) if args.partner else None
    date_str = datetime.now().strftime("%Y-%m-%d")

    if partner_slug:
        filename = f"{partner_slug}-{args.type}-{date_str}.md"
    else:
        # fall back to library's default filename if no partner given
        filename = entry["filename"]

    out_path = OUTPUTS_DIR / entry["out_dir"] / filename

    if out_path.exists() and not args.force:
        print(f"REFUSING to overwrite existing file: {out_path.relative_to(HERE)}")
        print("Pass --force to overwrite, or use a different partner / date.")
        sys.exit(3)

    print(f"Generating: {entry['id']}")
    if args.partner:
        print(f"  Partner:   {args.partner}")
    print(f"  Output:    {out_path.relative_to(HERE)}")
    print(f"  Notebook:  Critical Frequency · Fundraising")
    print(f"  This usually takes 30–90s...")

    record = generate_to_file(
        prompt_id=entry["id"],
        prompt_type=entry["type"],
        audience_id=entry["audience"],
        prompt_text=entry["prompt"],
        output_path=out_path,
        partner=args.partner,
        crm_id=args.crm_id,
        notes=args.notes,
        timeout=args.timeout,
    )

    if record["status"] == "success":
        ds = record["drift_summary"]
        print()
        print(f"  ✓ {record['word_count']} words · {record['references_count']} refs")
        print(
            f"  Drift: PASS {ds['PASS']} · AMBI {ds['AMBIGUOUS']} (defensive) · "
            f"DRIFT {ds['DRIFT']} · MISSING {ds['MISSING']}"
        )
        if ds["DRIFT"] or ds["MISSING"]:
            print(f"  ⚠️  Manual review needed — see drift section in file.")
        else:
            print(f"  ✓ No softening detected.")
        print()
        print(f"  Path: {out_path}")
    else:
        print(f"  ✗ FAILED: {record.get('error', 'unknown error')}")
        sys.exit(1)


def cmd_list(args):
    if not RUNS_LOG.exists():
        print("No runs logged yet.")
        return

    runs = []
    with open(RUNS_LOG) as f:
        for line in f:
            try:
                runs.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    # apply filters
    def matches(r):
        if args.partner and (r.get("partner") or "").lower().find(args.partner.lower()) == -1:
            return False
        if args.audience and r.get("audience") != args.audience:
            return False
        if args.type and r.get("type") != args.type:
            return False
        if args.status and r.get("status") != args.status:
            return False
        return True

    runs = [r for r in runs if matches(r)]

    if not runs:
        print("No matching runs.")
        return

    # de-dupe: keep latest per (partner, type, audience)
    if args.latest:
        latest = {}
        for r in runs:
            key = (r.get("partner") or "", r.get("audience"), r.get("type"))
            r_time = r.get("finished_at", "") or r.get("generated_at", "")
            existing_time = latest[key].get("finished_at", "") or latest[key].get("generated_at", "") if key in latest else ""
            if key not in latest or r_time > existing_time:
                latest[key] = r
        runs = list(latest.values())

    # sort newest first
    runs.sort(key=lambda r: r.get("finished_at", "") or r.get("generated_at", ""), reverse=True)

    # output
    fmt = "{date:<10} {aud:<4} {typ:<18} {partner:<30} {words:>6} {drift:<18} {path}"
    print(fmt.format(date="DATE", aud="AUD", typ="TYPE", partner="PARTNER", words="WORDS", drift="DRIFT", path="PATH"))
    print("-" * 130)
    for r in runs:
        date = (r.get("finished_at") or r.get("generated_at") or "")[:10]
        aud = r.get("audience") or "-"
        typ = r.get("type") or "-"
        partner = (r.get("partner") or "-")[:30]
        if r.get("status") == "error":
            words = "ERR"
            drift = f"!{r.get('error','')[:14]}"
        else:
            words = str(r.get("word_count") or "-")
            ds = r.get("drift_summary") or {}
            drift = f"P{ds.get('PASS',0)} A{ds.get('AMBIGUOUS',0)} D{ds.get('DRIFT',0)} M{ds.get('MISSING',0)}"
        path = r.get("path", "")
        print(fmt.format(date=date, aud=aud, typ=typ, partner=partner, words=words, drift=drift, path=path))


def cmd_profiles(args):
    for pid, p in PROFILES.items():
        print(f"\n{pid}: {p['name']}")
        print(f"  Priorities: {p['priorities']}")
        print(f"  Source emphasis: {p['source_emphasis']}")
        print(f"  Example partners: {', '.join(p['example_partners'][:3])}...")


def cmd_index(args):
    records = build_index()
    write_index(records)
    print(f"Indexed {len(records)} drafts → {INDEX_PATH.relative_to(HERE)}")
    if args.show:
        for r in records:
            ds = r.get("drift_summary", {})
            print(
                f"  {r['audience_profile']:<4} {r['output_type']:<15} {(r.get('partner_name') or '-')[:30]:<30} "
                f"{r.get('word_count') or '-':>6}  D{ds.get('DRIFT',0)} M{ds.get('MISSING',0)} A{ds.get('AMBIGUOUS',0)}  "
                f"{r['file_path']}"
            )


def cmd_sync(args):
    from lib.supabase_sync import sync
    result = sync(dry_run=args.dry_run)
    print(json.dumps(result, indent=2, default=str))
    if result.get("status") == "error":
        sys.exit(1)


def cmd_mark_sent(args):
    """Update a draft's frontmatter to record a send."""
    from datetime import datetime as dt
    path = Path(args.path)
    if not path.is_absolute():
        path = OUTPUTS_DIR / path
    if not path.exists():
        # try resolving as a relative path from repo root
        repo_root = HERE.parent.parent.parent.parent
        candidate = repo_root / args.path
        if candidate.exists():
            path = candidate
        else:
            print(f"ERROR: file not found: {args.path}")
            sys.exit(2)

    text = path.read_text()
    if not text.startswith("---"):
        print(f"ERROR: no frontmatter in {path}")
        sys.exit(2)

    end = text.find("\n---", 4)
    fm_text = text[4:end].rstrip()
    body = text[end + 4 :]

    sent_at_iso = dt.now().strftime("%Y-%m-%d %H:%M")
    new_fm_lines = fm_text.split("\n")
    # remove existing sent_at / sent_to / status lines
    new_fm_lines = [l for l in new_fm_lines if not l.strip().startswith(("sent_at:", "sent_to:", "status:"))]
    new_fm_lines.append(f"sent_at: {sent_at_iso}")
    if args.to:
        new_fm_lines.append(f"sent_to: {args.to}")
    new_fm_lines.append("status: sent")

    new_text = "---\n" + "\n".join(new_fm_lines) + "\n---" + body
    path.write_text(new_text)
    print(f"✓ marked sent: {path}")
    print(f"  sent_at: {sent_at_iso}")
    if args.to:
        print(f"  sent_to: {args.to}")
    print(f"\nRun `fundraising sync` to push state to CRM.")


def cmd_types(args):
    combos = available_combos()
    by_aud = {}
    for aud, typ in combos:
        by_aud.setdefault(aud, []).append(typ)
    print("Available (audience, type) combos:")
    for aud in sorted(by_aud):
        name = PROFILES.get(aud, {}).get("name", aud)
        print(f"\n  {aud}  {name}")
        for typ in by_aud[aud]:
            print(f"      → {typ}")


def main():
    parser = argparse.ArgumentParser(
        prog="fundraising",
        description="Critical Frequency fundraising CLI",
    )
    sub = parser.add_subparsers(dest="cmd")

    g = sub.add_parser("generate", help="Generate a per-partner output")
    g.add_argument("--audience", required=True, help="Profile ID (A-H)")
    g.add_argument("--type", required=True, help="Output type (e.g. briefing, faq, talking-points)")
    g.add_argument("--partner", help="Partner name (e.g. 'Wellcome Mental Health')")
    g.add_argument("--crm-id", help="CRM partner UUID (optional)")
    g.add_argument("--notes", help="Free-form notes recorded in frontmatter")
    g.add_argument("--force", action="store_true", help="Overwrite if file exists")
    g.add_argument("--timeout", type=int, default=480, help="NotebookLM timeout seconds (default 480)")

    l = sub.add_parser("list", help="List previous generation runs")
    l.add_argument("--partner", help="Filter by partner name (substring match)")
    l.add_argument("--audience", help="Filter by audience profile ID")
    l.add_argument("--type", help="Filter by output type")
    l.add_argument("--status", choices=["success", "error"], help="Filter by run status")
    l.add_argument("--latest", action="store_true", help="Show only the latest run per (partner, audience, type)")

    sub.add_parser("profiles", help="Show audience profile catalogue")
    sub.add_parser("types", help="Show available (audience, type) combinations")

    idx = sub.add_parser("index", help="Build local _index.json from output frontmatter")
    idx.add_argument("--show", action="store_true", help="Print each indexed record")

    sn = sub.add_parser("sync", help="Push index to Supabase cf_fundraising_drafts")
    sn.add_argument("--dry-run", action="store_true", help="Build payload without sending")

    ms = sub.add_parser("mark-sent", help="Record that a draft has been sent")
    ms.add_argument("path", help="Path to draft (relative to outputs/ or repo root)")
    ms.add_argument("--to", help="Recipient (email or contact name)")

    args = parser.parse_args()
    if args.cmd == "generate":
        cmd_generate(args)
    elif args.cmd == "list":
        cmd_list(args)
    elif args.cmd == "profiles":
        cmd_profiles(args)
    elif args.cmd == "types":
        cmd_types(args)
    elif args.cmd == "index":
        cmd_index(args)
    elif args.cmd == "sync":
        cmd_sync(args)
    elif args.cmd == "mark-sent":
        cmd_mark_sent(args)
    else:
        parser.print_help()
        sys.exit(2)


if __name__ == "__main__":
    main()
