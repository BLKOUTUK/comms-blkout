#!/bin/bash
# Upload Board Recruitment Campaign Images to Supabase Storage
#
# Prerequisites:
# - Supabase CLI installed (npx supabase)
# - Images exported from Canva in the source directory
#
# Usage:
#   ./scripts/upload-campaign-images.sh /path/to/canva/exports

set -e

# Configuration
BUCKET_NAME="campaign-assets"
FOLDER_PATH="board-recruitment-2026"
SUPABASE_PROJECT_REF="bgjengudzfickgomjqmz"

# Source directory (from argument or default)
SOURCE_DIR="${1:-./content/campaigns/board-recruitment-2026/images}"

echo "🚀 BLKOUT Campaign Image Uploader"
echo "=================================="
echo ""

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "📁 Creating image directory: $SOURCE_DIR"
    mkdir -p "$SOURCE_DIR"
    echo ""
    echo "⚠️  Please add your Canva exports to this directory:"
    echo "    $SOURCE_DIR"
    echo ""
    echo "Expected files:"
    echo "  - chair-slide.png"
    echo "  - treasurer-slide.png"
    echo "  - secretary-slide.png"
    echo "  - technology-director-slide.png"
    echo "  - community-director-slide.png"
    echo ""
    exit 1
fi

# Check for expected files
EXPECTED_FILES=(
    "chair-slide.png"
    "treasurer-slide.png"
    "secretary-slide.png"
    "technology-director-slide.png"
    "community-director-slide.png"
)

echo "📋 Checking for expected files..."
MISSING=0
for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$SOURCE_DIR/$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (missing)"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo ""
    echo "⚠️  $MISSING files missing. Please export from Canva first."
    echo ""
    read -p "Continue with available files? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "📤 Uploading to Supabase Storage..."
echo "   Bucket: $BUCKET_NAME"
echo "   Folder: $FOLDER_PATH"
echo ""

# Upload each file
UPLOADED=0
for file in "$SOURCE_DIR"/*.png "$SOURCE_DIR"/*.jpg "$SOURCE_DIR"/*.jpeg; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "   Uploading: $filename"

        # Using Supabase CLI
        npx supabase storage cp "$file" "ss://$BUCKET_NAME/$FOLDER_PATH/$filename" \
            --project-ref "$SUPABASE_PROJECT_REF" 2>/dev/null || {
            echo "   ⚠️  Failed to upload $filename (trying curl fallback)"

            # Fallback: Use curl with service role key
            if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
                curl -s -X POST \
                    "https://$SUPABASE_PROJECT_REF.supabase.co/storage/v1/object/$BUCKET_NAME/$FOLDER_PATH/$filename" \
                    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                    -H "Content-Type: image/png" \
                    --data-binary "@$file" > /dev/null && echo "   ✅ Uploaded via curl" || echo "   ❌ Upload failed"
            else
                echo "   ❌ Set SUPABASE_SERVICE_ROLE_KEY for curl fallback"
            fi
        }

        UPLOADED=$((UPLOADED + 1))
    fi
done

echo ""
echo "=================================="
echo "📊 Upload complete!"
echo "   Files processed: $UPLOADED"
echo ""
echo "🔗 Public URLs will be:"
echo "   https://$SUPABASE_PROJECT_REF.supabase.co/storage/v1/object/public/$BUCKET_NAME/$FOLDER_PATH/[filename]"
echo ""
echo "📌 Next step: Run the scheduler"
echo "   npx ts-node scripts/schedule-board-recruitment-campaign.ts"
echo ""
