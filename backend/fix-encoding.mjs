#!/bin/bash
echo "Re-encoding all .mjs files in backend/src/routes to UTF-8..."

find ./backend/src/routes -type f -name "*.mjs" | while read -r file; do
  temp_file="${file}.utf8"
  echo "Processing $file -> $temp_file"

  # Convert encoding and save to temp file
  iconv -f ASCII -t UTF-8 "$file" > "$temp_file"

  # Overwrite original if conversion succeeded
  if [ -s "$temp_file" ]; then
    mv "$temp_file" "$file"
    echo "✅ Re-encoded: $file"
  else
    echo "❌ Failed to re-encode: $file (empty output)"
    rm -f "$temp_file"
  fi
done

echo "Encoding fix complete."
