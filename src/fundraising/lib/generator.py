"""Core generator — calls NotebookLM, runs drift check, writes file, logs run.

Shared by the batch runner (generate_batch.py) and the per-partner CLI (fundraising.py).
"""

import json
import re
import subprocess
from datetime import datetime
from pathlib import Path

from .drift_check import check_drift, format_report
from .profiles import PROFILES


NOTEBOOK_ID = "f72a8c79-85ab-42a7-9fee-0049d600c511"
HERE = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = HERE / "outputs"
RUNS_LOG = OUTPUTS_DIR / "_runs.jsonl"


def slugify(s: str) -> str:
    """Partner-name → URL-safe slug. 'Wellcome Mental Health' → 'wellcome-mental-health'."""
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def call_notebooklm(prompt: str, timeout: int = 480) -> dict:
    """Run notebooklm ask, return parsed JSON. Raises RuntimeError on failure."""
    proc = subprocess.run(
        ["notebooklm", "ask", prompt, "--notebook", NOTEBOOK_ID, "--json"],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"notebooklm ask failed: {proc.stderr[:500]}")
    return json.loads(proc.stdout)


def build_output(
    prompt_id: str,
    prompt_type: str,
    audience_id: str,
    prompt_text: str,
    response: dict,
    *,
    partner: str | None = None,
    crm_id: str | None = None,
    notes: str | None = None,
) -> tuple[str, list[dict]]:
    """Build the full markdown body (frontmatter + content + drift report).

    Returns (body_text, drift_results).
    """
    answer = response.get("answer", "")
    refs = response.get("references", [])
    conv = response.get("conversation_id", "")
    profile = PROFILES.get(audience_id)

    fm = [
        "---",
        f"id: {prompt_id}",
        f"type: {prompt_type}",
        f"audience_profile: {audience_id}",
    ]
    if profile:
        fm.append(f"audience_name: {profile['name']}")
    if partner:
        fm.append(f"partner: {partner}")
    if crm_id:
        fm.append(f"crm_id: {crm_id}")
    if notes:
        fm.append(f"notes: {json.dumps(notes)}")
    fm.extend(
        [
            f"generated_at: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            f"notebook_id: {NOTEBOOK_ID}",
            f"conversation_id: {conv}",
            f"word_count: {len(answer.split())}",
            f"references_count: {len(refs)}",
            "status: draft (pre-relational-layer)",
            "---",
            "",
        ]
    )

    header = f"# {prompt_id}"
    if partner:
        header = f"# {prompt_type.title()} — {partner} (Profile {audience_id})"
    elif profile:
        header = f"# {prompt_type.title()} — Profile {audience_id} ({profile['name']})"

    drift_results = check_drift(answer)
    drift_md = format_report(drift_results)

    body = (
        "\n".join(fm)
        + header
        + "\n\n"
        + (f"**Audience:** Profile {audience_id} — {profile['name']}\n\n" if profile else "")
        + (f"**Partner:** {partner}\n\n" if partner else "")
        + (f"**Notes:** {notes}\n\n" if notes else "")
        + "---\n\n"
        + answer
        + "\n\n---\n\n"
        + drift_md
        + "\n"
    )

    return body, drift_results


def log_run(record: dict):
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(RUNS_LOG, "a") as f:
        f.write(json.dumps(record) + "\n")


def generate_to_file(
    prompt_id: str,
    prompt_type: str,
    audience_id: str,
    prompt_text: str,
    output_path: Path,
    *,
    partner: str | None = None,
    crm_id: str | None = None,
    notes: str | None = None,
    timeout: int = 480,
) -> dict:
    """Run end-to-end generation. Returns a run-record dict."""
    started = datetime.now()
    record = {
        "id": prompt_id,
        "type": prompt_type,
        "audience": audience_id,
        "partner": partner,
        "crm_id": crm_id,
        "notes": notes,
        "started_at": started.isoformat(),
        "path": str(output_path.relative_to(HERE)),
    }

    try:
        response = call_notebooklm(prompt_text, timeout=timeout)
        body, drift_results = build_output(
            prompt_id, prompt_type, audience_id, prompt_text, response,
            partner=partner, crm_id=crm_id, notes=notes,
        )
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(body)

        statuses = [r["status"] for r in drift_results]
        record["word_count"] = len(response.get("answer", "").split())
        record["references_count"] = len(response.get("references", []))
        record["drift_summary"] = {
            s: statuses.count(s) for s in ["PASS", "AMBIGUOUS", "DRIFT", "MISSING"]
        }
        record["conversation_id"] = response.get("conversation_id", "")
        record["status"] = "success"
    except Exception as e:
        record["status"] = "error"
        record["error"] = str(e)[:500]

    record["finished_at"] = datetime.now().isoformat()
    log_run(record)
    return record


def find_prompt(audience: str, prompt_type: str) -> dict | None:
    """Look up a prompt-library entry by (audience, type)."""
    from .prompts import PROMPTS
    for p in PROMPTS:
        if p["audience"] == audience and p["type"] == prompt_type:
            return p
    return None


def available_combos() -> list[tuple[str, str]]:
    from .prompts import PROMPTS
    return sorted({(p["audience"], p["type"]) for p in PROMPTS})
