#!/bin/bash

# Process all CommonJS files
while read -r file; do
  echo "Converting $file"
  
  # Convert requires to imports
  sed -i '' -E '
    s/const \{ ([^ ]*) \} = require\("([^"]*)"\);?/import { \1 } from "\2.js";/g;
    s/const ([^ ]*) = require\("([^"]*)"\);?/import \1 from "\2.js";/g;
    s/require\("([^"]*)"\)/await import("\1.js")/g;
  ' "$file"

  # Convert exports
  sed -i '' -E '
    s/module.exports = ([^{].*);?/export default \1;/g;
    s/module.exports = \{/export {/g;
    s/exports\.([^ ]*) =/export const \1 =/g;
  ' "$file"
  
  # Add .js extension to local imports
  sed -i '' -E 's/from "(\.[^"]*)"/from "\1.js"/g' "$file"
  
done < cjs_files.txt

echo "Conversion complete. Please verify the changes."