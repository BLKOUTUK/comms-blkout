#!/bin/bash
cd /home/robbe/blkout-platform/apps/comms-blkout/remotion-videos

echo "Rendering IVOR messages with low resource usage..."

for msg in founding_story revolutionary_love platform_features event_invite next_decade; do
  echo "Rendering: $msg"
  npx remotion render src/index.ts IVORMessage \
    --output="out/ivor-${msg//_/-}.mp4" \
    --props="{\"messageType\":\"$msg\"}" \
    --concurrency=1 \
    --timeout=120000 \
    2>&1 | grep -E "(Rendered|Encoded|\+|Error)"
  echo "Done: $msg"
  sleep 2
done

echo "All IVOR renders complete!"
ls -la out/ivor-*.mp4
