// File: fix-mismatched-quotes.js
// ⚙️ Scans for mismatched quotes in import/export statements and string literals and auto-corrects them to valid double quotes

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname);

const VALID_QUOTE_REGEX = /([""])(.*?)\1/gs;
const MISMATCHED_QUOTE_REGEX = /([""])(.*?)([""])/g;

function scanAndFixFile(filePath) {
  let contents = fs.readFileSync(filePath, 'utf8');
  let original = contents;

  contents = contents.replace(/(import\s+.*?\s+from\s+)([""])(.*?)([""])/g, (match, imp, open, src, close) => {
    if (open !== close) {
      return `${imp}"${src}"`;
    }
    return match;
  });

  contents = contents.replace(/(export\s+.*?\s+from\s+)([""])(.*?)([""])/g, (match, exp, open, src, close) => {
    if (open !== close) {
      return `${exp}"${src}"`;
    }
    return match;
  });

  contents = contents.replace(/([""])(.*?)([""])/g, (match, open, inner, close) => {
    if (open !== close) {
      return `"${inner}"`;
    }
    return match;
  });

  if (contents !== original) {
    fs.writeFileSync(filePath, contents, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  }
}

function walkDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath);
    } else if (entry.isFile() && /\.(mjs|js|jsx|ts|tsx)$/.test(entry.name)) {
      scanAndFixFile(fullPath);
    }
  }
}

console.log('🔍 Fixing mismatched quote issues in project...');
walkDirectory(rootDir);
console.log('🎉 All possible mismatched quotes scanned and corrected.');
