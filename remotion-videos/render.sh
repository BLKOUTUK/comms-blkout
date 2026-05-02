#!/usr/bin/env bash
set -euo pipefail

PROPS_FILE="${1:-./props/sample-news-digest.json}"

mkdir -p out

if [ ! -f "$PROPS_FILE" ]; then
  echo "Props file not found: $PROPS_FILE" >&2
  exit 1
fi

WEEK_TAG=$(date +%Y-W%V)

for ASPECT in 9x16 1x1 16x9; do
  COMP="IVORMessage${ASPECT}"
  OUT="out/ivor-${WEEK_TAG}-${ASPECT}.mp4"
  echo "→ Rendering $COMP → $OUT"
  npx remotion render src/index.ts "$COMP" \
    --output="$OUT" \
    --concurrency=1 \
    --gl=angle \
    --props="$PROPS_FILE"
done

echo "Done. Outputs in out/"
ls -la out/
