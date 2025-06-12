#!/bin/bash

echo "🔄 Starting full GitHub sync: main, dev, and uat branches..."

cd "$(dirname "$0")"

# Confirm git is initialized
if [ ! -d ".git" ]; then
  echo "🚨 Git is not initialized. Initializing now..."
  git init
fi

# Set correct GitHub remote
git remote remove origin 2>/dev/null
git remote add origin https://github.com/patrickneufeld/Teralynk.git

# Add and commit all changes
git add .
git commit -m "🚀 Full overwrite from MacBook — syncing main, dev, uat" || echo "✅ No new changes to commit"

# Ensure main branch
git branch -M main

# Push to main
echo "📤 Pushing to main..."
git push -f origin main

# Create or reset dev branch
echo "📤 Syncing dev branch..."
git branch -D dev 2>/dev/null
git checkout -b dev
git push -f origin dev

# Create or reset uat branch
echo "📤 Syncing uat branch..."
git branch -D uat 2>/dev/null
git checkout -b uat
git push -f origin uat

# Go back to main
git checkout main

echo "✅ All branches (main, dev, uat) now match your local project."
