#!/bin/bash

echo "🔧 Starting Teralynk Frontend Cleanup..."

# Step 1: Remove Vite caches and build output
echo "🧹 Removing Vite caches and build output..."
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite
rm -rf frontend/.vite
rm -rf frontend/dist

# Step 2: Delete lingering .ts and .tsx files
echo "🧼 Cleaning residual TypeScript artifacts..."
find ./frontend/src -name "*.ts" -delete
find ./frontend/src -name "*.tsx" -delete

# Step 3: Reinstall frontend dependencies without running husky
echo "📦 Reinstalling frontend dependencies..."
cd frontend
npm install --ignore-scripts
cd ..

# Step 4: Confirm VITE_WS_URL in .env.local
echo "🌐 Confirming VITE_WS_URL..."
grep 'VITE_WS_URL' frontend/.env.local || echo "⚠️ VITE_WS_URL not found in frontend/.env.local!"

# Step 5: Wrap up
echo "✅ Cleanup complete. Now run:"
echo "👉 npm run dev"
echo "🟢 Teralynk frontend is clean and ready."
