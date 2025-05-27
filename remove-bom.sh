#!/bin/bash
echo "Removing BOM from all .mjs files in backend/src/routes..."

find ./backend/src/routes -type f -name "*.mjs" | while read -r file; do
  echo "Processing $file"
  sed -i '' '1s/^\xEF\xBB\xBF//' "$file"
done

echo "BOM removal complete."
