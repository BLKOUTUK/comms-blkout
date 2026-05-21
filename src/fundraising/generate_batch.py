"""Run the full Phase 2 batch — generate every output in the prompt library, save with
frontmatter + drift report, log to outputs/_runs.jsonl.

Usage:
    python3 generate_batch.py [--only ID] [--skip ID,ID]
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from lib.prompts import PROMPTS
from lib.profiles import PROFILES
from lib.drift_check import check_drift, format_report


NOTEBOOK_ID = "f72a8c79-85ab-42a7-9fee-0049d600c511"
OUTPUTS_DIR = Path(__file__).parent / "outputs"
RUNS_LOG = OUTPUTS_DIR / "_runs.jsonl"


def call_notebooklm(prompt: str) -> dict:
    proc = subprocess.run(
        ["notebooklm", "ask", prompt, "--notebook", NOTEBOOK_ID, "--json"],
        capture_output=True,
        text=True,
        timeout=300,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"notebooklm ask failed: {proc.stderr[:500]}")
    return json.loads(proc.stdout)


def render_output(entry: dict, response: dict) -> str:
    answer = response.get("answer", "")
    refs = response.get("references", [])
    conv = response.get("conversation_id", "")
    profile_id = entry["audience"]
    profile = PROFILES.get(profile_id) if profile_id in PROFILES else None

    fm_lines = [
        "---",
        f"id: {entry['id']}",
        f"type: {entry['type']}",
        f"audience_profile: {profile_id}",
    ]
    if profile:
        fm_lines.append(f"audience_name: {profile['name']}")
    fm_lines.extend(
        [
            f"generated_at: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            f"notebook_id: {NOTEBOOK_ID}",
            f"conversation_id: {conv}",
            f"word_count: {len(answer.split())}",
            f"references_count: {len(refs)}",
            f"status: draft (pre-review)",
            "---",
            "",
        ]
    )

    drift_results = check_drift(answer)
    drift_md = format_report(drift_results)

    body = (
        "\n".join(fm_lines)
        + f"# {entry['id']}\n\n"
        + (f"**Audience: Profile {profile_id} — {profile['name']}**\n\n" if profile else "")
        + "---\n\n"
        + answer
        + "\n\n---\n\n"
        + drift_md
        + "\n"
    )
    return body, drift_results


def log_run(entry: dict, response: dict, drift_results: list, path: Path, error: str = None):
    run = {
        "id": entry["id"],
        "type": entry["type"],
        "audience": entry["audience"],
        "generated_at": datetime.now().isoformat(),
        "path": str(path.relative_to(OUTPUTS_DIR.parent)),
        "error": error,
    }
    if response:
        run["word_count"] = len(response.get("answer", "").split())
        run["references_count"] = len(response.get("references", []))
    if drift_results:
        statuses = [r["status"] for r in drift_results]
        run["drift_summary"] = {
            "PASS": statuses.count("PASS"),
            "AMBIGUOUS": statuses.count("AMBIGUOUS"),
            "DRIFT": statuses.count("DRIFT"),
            "MISSING": statuses.count("MISSING"),
        }
    with open(RUNS_LOG, "a") as f:
        f.write(json.dumps(run) + "\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="comma-separated prompt IDs to run")
    parser.add_argument("--skip", help="comma-separated prompt IDs to skip")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    only_set = set(args.only.split(",")) if args.only else None
    skip_set = set(args.skip.split(",")) if args.skip else set()

    runs = []
    for entry in PROMPTS:
        if only_set and entry["id"] not in only_set:
            continue
        if entry["id"] in skip_set:
            continue
        runs.append(entry)

    print(f"=== Phase 2 batch — {len(runs)} outputs to generate ===\n")

    for i, entry in enumerate(runs, 1):
        out_path = OUTPUTS_DIR / entry["out_dir"] / entry["filename"]
        print(f"[{i}/{len(runs)}] {entry['id']} → {out_path.relative_to(OUTPUTS_DIR.parent)}")
        if args.dry_run:
            continue
        try:
            response = call_notebooklm(entry["prompt"])
            body, drift_results = render_output(entry, response)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_text(body)
            ds = {s: [r["status"] for r in drift_results].count(s) for s in ["PASS", "AMBIGUOUS", "DRIFT", "MISSING"]}
            print(
                f"    words={len(response.get('answer','').split())} refs={len(response.get('references',[]))} "
                f"drift: PASS {ds['PASS']} · AMBI {ds['AMBIGUOUS']} · DRIFT {ds['DRIFT']} · MISS {ds['MISSING']}"
            )
            log_run(entry, response, drift_results, out_path)
        except Exception as e:
            print(f"    ERROR: {e}")
            log_run(entry, None, None, out_path, error=str(e))

    print(f"\n=== Done. Runs logged to {RUNS_LOG.relative_to(OUTPUTS_DIR.parent)} ===")


if __name__ == "__main__":
    main()
