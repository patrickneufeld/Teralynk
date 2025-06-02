// File: scan-esm-errors.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// -----------------------------
// 🔧 Config
// -----------------------------
const projectRoot = path.resolve(process.argv[2] || '.');
const allowedQuotePattern = /([""`])(?:(?=(\\?))\2.)*?\1/g;

// -----------------------------
// 🔍 Recursively find files
// -----------------------------
function getAllFiles(dirPath, arrayOfFiles = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (entry.name.endsWith('.mjs') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

// -----------------------------
// 🧠 Analyze each file
// -----------------------------
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const errors = [];

  lines.forEach((line, idx) => {
    const lineNumber = idx + 1;

    // ❌ Flag invalid CJS use in .mjs
    if (
      filePath.endsWith('.mjs') &&
      (line.includes('require(') || line.includes('module.exports') || line.includes('__dirname'))
    ) {
      errors.push({ lineNumber, line, reason: 'CJS pattern used in .mjs' });
    }

    // ❌ Flag mismatched quotes (rudimentary check)
    const singleCount = (line.match(/'/g) || []).length;
    const doubleCount = (line.match(/"/g) || []).length;
    const backtickCount = (line.match(/`/g) || []).length;

    if ((singleCount % 2 !== 0) || (doubleCount % 2 !== 0) || (backtickCount % 2 !== 0)) {
      errors.push({ lineNumber, line, reason: 'Unmatched quote detected' });
    }

    // ❌ Control characters or encoding artifacts
    if (/[^\x00-\x7F]/.test(line)) {
      errors.push({ lineNumber, line, reason: 'Non-ASCII character (possible encoding error)' });
    }
  });

  return errors;
}

// -----------------------------
// 🚀 Execute
// -----------------------------
const allFiles = getAllFiles(projectRoot);
let totalIssues = 0;

console.log(`\n🔎 Scanning files in: ${projectRoot}`);
for (const file of allFiles) {
  const issues = analyzeFile(file);
  if (issues.length > 0) {
    console.log(`\n❗ ${file}`);
    issues.forEach(({ lineNumber, line, reason }) => {
      console.log(`  [${lineNumber}] ${reason}: ${line.trim()}`);
      totalIssues++;
    });
  }
}

console.log(`\n✅ Scan complete. Found ${totalIssues} potential issue${totalIssues !== 1 ? 's' : ''}.\n`);
