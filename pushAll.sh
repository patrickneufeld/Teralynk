#!/bin/bash

echo "🔄 Starting GitHub force push for Teralynk..."

cd "$(dirname "$0")"

# Confirm git is initialized
if [ ! -d ".git" ]; then
  echo "🚨 Git is not initialized. Initializing now..."
  git init
fi

# Set remote (force overwrite just in case)
git remote remove origin 2>/dev/null
git remote add origin https://github.com/patrickneufeld/Teralynk.git

# Stage and commit all changes
git add .
git commit -m "🚀 Full overwrite from local MacBook — keeping local as source of truth" || echo "✅ Nothing new to commit"

# Ensure we are on main branch
git branch -M main

# Force push to GitHub main
echo "📤 Pushing to GitHub..."
git push -f origin main

echo "✅ Push complete! GitHub now matches your local Teralynk project."
