"""Six unchanging claims drift checker.

Returns: list of {claim, status, hits, context} for each of the six claims.
Status: PASS, MISSING (must-have not found), DRIFT (must-not-have found in softening context),
AMBIGUOUS (must-not-have phrase present but used defensively — pattern indicates the briefing
is rejecting/refusing the softening, not adopting it).
"""

import re

CHECKS = [
    {
        "id": 1,
        "claim": "Reparations framing (UN GA Res 60/147) — never softened to 'social investment' or 'impact philanthropy'",
        "must_have_any": ["reparation", "60/147", "ga res", "un ga"],
        "must_not_have": [
            "social investment",
            "impact philanthropy",
            "impact investment",
            "philanthropic investment",
        ],
    },
    {
        "id": 2,
        "claim": "£4–6m founding partnership — single cornerstone partner, not a syndicated panel",
        "must_have_any": ["£4", "£6", "4 million", "6 million", "4-6", "4–6", "cornerstone"],
        "must_not_have": [
            "panel of funders",
            "consortium of funders",
            "syndicate",
            "multiple funders contributing",
        ],
    },
    {
        "id": 3,
        "claim": "Action-learning frame — not 'steering group'",
        "must_have_any": ["action-learning", "action learning"],
        "must_not_have": ["steering group", "steering committee"],
    },
    {
        "id": 4,
        "claim": "CBS asset-lock cited as structural non-extraction commitment",
        "must_have_any": ["asset lock", "asset-lock", "cbs", "community benefit society", "cooperative"],
        "must_not_have": [],
    },
    {
        "id": 5,
        "claim": "Genuine uncertainty named as strength — never softened to 'tested methodology'",
        "must_have_any": [
            "novel",
            "unproven",
            "uncharted",
            "untested",
            "experimental",
            "innovative",
            "pioneering",
            "new clinical",
            "new methodology",
            "first of its kind",
            "build the evidence base",
            "building the evidence base",
            "evidence base is the work",
        ],
        "must_not_have": [
            "tested methodology",
            "proven methodology",
            "established practice",
            "well-established methodology",
        ],
    },
    {
        "id": 6,
        "claim": "Community-led-from-the-start — never reframed as 'designed with community input'",
        "must_have_any": ["community-led", "community led", "community-owned"],
        "must_not_have": [
            "designed with community input",
            "community feedback informed",
            "co-designed with the community",
            "with community input",
        ],
    },
]


# Defensive-framing patterns. If any of these match in the same sentence (or the sentence
# immediately preceding) the forbidden phrase, the use is defensive and the status is AMBIGUOUS
# (false drift). If none match, it's real DRIFT.
#
# Each pattern is a regex that captures BLKOUT's typical rejection structure:
# - "refuse the softening of this reality into 'X'"
# - "we will not soften X into Y"
# - "we reject/refuse models that are merely 'X'"
# - "too often, programmes are 'X' but..."
# - "not 'X' but 'Y'"
# - "rather than X" / "instead of X" / "more than just X" / "merely X"
DEFENSIVE_PATTERNS = [
    # rejection verbs
    r"\b(refuse|reject|resist)\b[^.!?]{0,200}",
    r"\b(will not|won't|do not|does not|cannot|categorically not)\s+\w+",
    r"\bnever\s+\w+",
    # "not an/a/the X" / "not just/merely X" / "not offering/providing X" — common rejection structures
    r"\bnot\s+(?:a|an|the)\s+(?:polite\s+|mere\s+|simple\s+)?(?:exercise|matter|case|question|instance|kind|form|type|programme|service|activity)",
    r"\b(is|are|am)\s+not\s+(?:a|an|the|just|merely|simply|offering|providing|engaging|conducting)",
    r"\b(?:make\s+no\s+mistake|to be clear|to be explicit|let me be clear)",
    r"\b(?:we\s+)?are\s+not\s+offering\b",
    # softening framing — anything talking about "softening of X into Y" is BLKOUT's defensive move
    r"\bsoften(?:ed|ing|s)?\s+(?:this|the|that|our|into)",
    r"\b(?:the\s+)?softening\s+of",
    r"\breduce(?:d|s)?\s+to\b",
    r"\breduction\s+(?:to|into)\b",
    # contrastive constructs
    r"\brather than\b",
    r"\binstead of\b",
    r"\bmore than (?:just|merely|simply|a)\b",
    r"\bmerely\s+(?:being|a|an|the)\b",
    r"\bnot\s+(?:just|merely|simply)\b",
    # framing as critique of the term
    r'"\s*\w+',  # phrase appears in scare-quotes (often signals critique)
    r"\b(?:the\s+)?language of\b",
    r"\b(?:the\s+)?palatable language\b",
    # explicit critique
    r"\btoo often\b",
    r"\boften\s+(?:becomes?|reduced|treated|framed)",
    r"\bunlike\s+\w+",
    r"\bdiffer(?:s)? from\b",
]
DEFENSIVE_RE = re.compile("|".join(DEFENSIVE_PATTERNS), re.IGNORECASE)


def _split_sentences(text: str):
    """Rough sentence split — good enough for our purposes."""
    # treat newlines as sentence boundaries too
    parts = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [p.strip() for p in parts if p.strip()]


def _is_defensive_context(text: str, phrase: str, sentences: list[str]) -> tuple[bool, str]:
    """
    Determine whether `phrase` appears in defensive context within `text`.
    Returns (is_defensive, context_string).

    Strategy: find the sentence containing the phrase, look at that sentence AND the prior one
    for defensive patterns. Also accept matches in a generous proximity window of ±200 chars
    around the phrase.
    """
    phrase_lower = phrase.lower()
    text_lower = text.lower()

    pos = text_lower.find(phrase_lower)
    if pos == -1:
        return False, ""

    # 1) sentence-level check
    for i, sent in enumerate(sentences):
        if phrase_lower in sent.lower():
            check_chunk = sent
            if i > 0:
                check_chunk = sentences[i - 1] + " " + check_chunk
            if DEFENSIVE_RE.search(check_chunk):
                return True, check_chunk[:300]

    # 2) proximity-window fallback (±200 chars)
    window_start = max(0, pos - 200)
    window_end = min(len(text), pos + len(phrase) + 200)
    window = text[window_start:window_end]
    if DEFENSIVE_RE.search(window):
        return True, window[:300].replace("\n", " ")

    return False, text[max(0, pos - 80) : pos + len(phrase) + 80].replace("\n", " ")


def check_drift(text: str):
    text_lower = text.lower()
    sentences = _split_sentences(text)
    results = []

    for c in CHECKS:
        # must_have_any
        have_hits = []
        for term in c["must_have_any"]:
            if " " in term or "-" in term or "/" in term or "£" in term:
                if term.lower() in text_lower:
                    have_hits.append(term)
            else:
                if re.search(r"\b" + re.escape(term) + r"\b", text_lower):
                    have_hits.append(term)

        present = bool(have_hits) if c["must_have_any"] else True

        # must_not_have — find each occurrence and classify
        drift_hits = []
        ambiguous_hits = []
        for term in c["must_not_have"]:
            idx = 0
            while True:
                pos = text_lower.find(term.lower(), idx)
                if pos == -1:
                    break
                is_def, ctx = _is_defensive_context(text[pos:], term, sentences)
                # also check wider context around this exact occurrence
                w_start = max(0, pos - 200)
                w_end = min(len(text), pos + len(term) + 200)
                wider = text[w_start:w_end]
                if DEFENSIVE_RE.search(wider):
                    ambiguous_hits.append(
                        {"term": term, "context": wider[:300].replace("\n", " ")}
                    )
                else:
                    ctx_short = text[max(0, pos - 80) : pos + len(term) + 80].replace("\n", " ")
                    drift_hits.append({"term": term, "context": ctx_short})
                idx = pos + len(term)

        if drift_hits:
            status = "DRIFT"
        elif ambiguous_hits:
            status = "AMBIGUOUS"
        elif present:
            status = "PASS"
        else:
            status = "MISSING"

        results.append(
            {
                "id": c["id"],
                "claim": c["claim"],
                "status": status,
                "present_hits": have_hits,
                "drift_hits": drift_hits,
                "ambiguous_hits": ambiguous_hits,
            }
        )

    return results


def format_report(results) -> str:
    lines = ["## Drift Review (automated, six unchanging claims)\n"]
    summary = {"PASS": 0, "AMBIGUOUS": 0, "DRIFT": 0, "MISSING": 0}
    for r in results:
        summary[r["status"]] += 1
    lines.append(
        f"**Summary:** PASS {summary['PASS']} · AMBIGUOUS {summary['AMBIGUOUS']} (defensive use) · "
        f"DRIFT {summary['DRIFT']} (genuine softening) · MISSING {summary['MISSING']}\n"
    )
    if summary["DRIFT"] == 0 and summary["MISSING"] == 0:
        lines.append("**Verdict:** no genuine softening detected. Ambiguous flags are defensive uses.\n")

    for r in results:
        icon = {"PASS": "✅", "AMBIGUOUS": "⚠️", "DRIFT": "❌", "MISSING": "❌"}[r["status"]]
        lines.append(f"\n### {icon} {r['id']}. {r['claim']}\n")
        lines.append(f"- **Status:** {r['status']}")
        if r["present_hits"]:
            lines.append(f"- **Required terms present:** {', '.join(r['present_hits'][:3])}")
        if r["ambiguous_hits"]:
            lines.append(f"- **Ambiguous (phrase used defensively, briefing rejects the softening):**")
            for h in r["ambiguous_hits"][:2]:
                lines.append(f"  - *'{h['term']}'* — context: ...{h['context'][:180]}...")
        if r["drift_hits"]:
            lines.append(f"- **DRIFT (genuine softening, review and rewrite):**")
            for h in r["drift_hits"][:2]:
                lines.append(f"  - *'{h['term']}'* — context: ...{h['context'][:180]}...")
    return "\n".join(lines)


# --- test runner: run check against all existing outputs and report ---
if __name__ == "__main__":
    import json
    import sys
    from pathlib import Path

    outputs_dir = Path(__file__).resolve().parent.parent / "outputs"
    print(f"Scanning {outputs_dir}")
    total = {"PASS": 0, "AMBIGUOUS": 0, "DRIFT": 0, "MISSING": 0}
    per_file = []
    for md in sorted(outputs_dir.rglob("*.md")):
        if md.name.startswith("_"):
            continue
        text = md.read_text()
        # strip any existing drift section
        if "## Drift Review" in text:
            text_for_check = text.split("## Drift Review")[0]
        else:
            text_for_check = text
        results = check_drift(text_for_check)
        statuses = [r["status"] for r in results]
        counts = {s: statuses.count(s) for s in ["PASS", "AMBIGUOUS", "DRIFT", "MISSING"]}
        for k, v in counts.items():
            total[k] += v
        per_file.append({"file": str(md.relative_to(outputs_dir)), "counts": counts})

    print(f"\n=== Total across {len(per_file)} files ===")
    print(json.dumps(total, indent=2))
    print("\n=== Per file ===")
    for f in per_file:
        print(f"  {f['file']:<60} {f['counts']}")
