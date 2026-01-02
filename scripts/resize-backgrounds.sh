#!/bin/bash
# Resize all theory backgrounds to reduce base64 size

INPUT_DIR="/home/robbe/blkout-website/public/images/theory-backgrounds"
OUTPUT_DIR="/home/robbe/blkout-website/public/images/theory-backgrounds-resized"

mkdir -p "$OUTPUT_DIR"

for img in "$INPUT_DIR"/*.png; do
  filename=$(basename "$img")
  echo "Resizing $filename..."

  # Resize to max 1080x1350 and compress (4:5 portrait)
  ffmpeg -i "$img" -vf "scale='min(1080,iw)':'min(1350,ih)':force_original_aspect_ratio=decrease" -y "$OUTPUT_DIR/$filename" 2>/dev/null

  echo "✓ $filename"
done

echo ""
echo "✅ All backgrounds resized to $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR" | tail -5
