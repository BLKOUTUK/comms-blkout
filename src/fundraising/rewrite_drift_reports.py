"""Re-run drift check across all existing outputs and rewrite their drift report sections.

Preserves frontmatter + body; replaces the trailing `## Drift Review` section.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.drift_check import check_drift, format_report


def main():
    outputs_dir = Path(__file__).parent / "outputs"
    updated = 0
    for md in sorted(outputs_dir.rglob("*.md")):
        if md.name.startswith("_"):
            continue
        text = md.read_text()
        if "## Drift Review" in text:
            body, _, _ = text.partition("## Drift Review")
            body = body.rstrip()
        else:
            body = text.rstrip()
        # also strip any prior trailing `---` separator
        body = body.rstrip("-").rstrip()

        results = check_drift(body)
        report = format_report(results)
        new_text = body + "\n\n---\n\n" + report + "\n"
        md.write_text(new_text)
        statuses = [r["status"] for r in results]
        counts = {s: statuses.count(s) for s in ["PASS", "AMBIGUOUS", "DRIFT", "MISSING"]}
        print(f"  {str(md.relative_to(outputs_dir)):<60} {counts}")
        updated += 1

    print(f"\nUpdated {updated} files.")


if __name__ == "__main__":
    main()
