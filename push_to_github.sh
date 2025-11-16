#!/bin/bash
set -e

echo "=========================================="
echo "BLKOUT UK Communications System"
echo "GitHub Repository Push Script"
echo "=========================================="
echo ""

# Repository details
REPO_NAME="comms-blkout"
REPO_OWNER="BLKOUTUK"
REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
TOKEN="ghu_tdym7Qmg20ByR1bUtbfVooztNZfw9D32EtXo"

echo "Repository: ${REPO_OWNER}/${REPO_NAME}"
echo "URL: ${REPO_URL}"
echo ""

# Check if repository exists on GitHub
echo "Checking if repository exists on GitHub..."
REPO_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token ${TOKEN}" \
  "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}")

if [ "$REPO_CHECK" = "200" ]; then
  echo "✓ Repository exists on GitHub"
elif [ "$REPO_CHECK" = "404" ]; then
  echo "✗ Repository does not exist yet"
  echo ""
  echo "Please create the repository first:"
  echo "1. Go to: https://github.com/new"
  echo "2. Repository name: ${REPO_NAME}"
  echo "3. Description: BLKOUT UK Communications & Content Calendar System"
  echo "4. Visibility: Private"
  echo "5. DO NOT initialize with README, .gitignore, or license"
  echo "6. Click 'Create repository'"
  echo ""
  echo "Then run this script again."
  exit 1
else
  echo "⚠ Unexpected response code: $REPO_CHECK"
  echo "Continuing anyway..."
fi

echo ""
echo "Configuring git..."

# Rename branch to main if it's master
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "master" ]; then
  echo "Renaming branch from master to main..."
  git branch -M main
fi

# Check if remote already exists
if git remote | grep -q "^origin$"; then
  echo "Remote 'origin' already exists, updating URL..."
  git remote set-url origin "https://${TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
else
  echo "Adding remote 'origin'..."
  git remote add origin "https://${TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
fi

echo ""
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "=========================================="
echo "✓ SUCCESS!"
echo "=========================================="
echo ""
echo "Repository URL: https://github.com/${REPO_OWNER}/${REPO_NAME}"
echo ""
echo "Next steps:"
echo "1. Visit your repository: https://github.com/${REPO_OWNER}/${REPO_NAME}"
echo "2. Review the code and settings"
echo "3. Configure GitHub Pages or deployment if needed"
echo "4. Set up any required secrets for CI/CD"
echo ""
