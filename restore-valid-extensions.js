// File: /Users/patrick/Projects/Teralynk/restore-valid-extensions.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rootDirs = ['backend', 'frontend'];
const importPattern = /from\s+([""])([^""]+?\.js)\1/g;

const fixedFiles = [];
const skippedFiles = [];

function fileExists(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function tryFixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  content = content.replace(importPattern, (match, quote, importPath) => {
    const absoluteImportPath = path.resolve(path.dirname(filePath), importPath);
    const mjsPath = absoluteImportPath.replace(/\.js$/, '.mjs');

    if (fileExists(mjsPath)) {
      changed = true;
      const relativeFixed = importPath.replace(/\.js$/, '.mjs');
      return `from ${quote}${relativeFixed}${quote}`;
    } else {
      skippedFiles.push(filePath);
      return match;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedFiles.push(filePath);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.mjs')) {
      tryFixFile(fullPath);
    }
  }
}

function runFix() {
  console.log('🔍 Scanning project for broken .js imports...');

  for (const dir of rootDirs) {
    const fullDir = path.join(__dirname, dir);
    if (fs.existsSync(fullDir)) walk(fullDir);
  }

  console.log(`\n🎯 Fix complete.`);
  console.log(`✅ Files fixed: ${fixedFiles.length}`);
  console.log(`🚫 Files skipped (missing .mjs): ${skippedFiles.length}`);
}

runFix();
