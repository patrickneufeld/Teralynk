// File: /tools/fixAdminCode.js

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const XAI_API_KEY = process.env.XAI_API_KEY;
if (!XAI_API_KEY) {
  console.error('❌ XAI_API_KEY not found in .env file.');
  process.exit(1);
}

// === CORRECT PATHS HERE ===
const rootDir = path.join(__dirname, '..'); // /Teralynk/backend

const filesToCheck = [
  path.join(rootDir, 'src/controllers/adminController.js'),
  path.join(rootDir, 'src/routes/admin.js')
];

const frontendDir = path.join(rootDir, '../frontend/src');

const foldersToCheck = [
  path.join(frontendDir, 'utils'),
  path.join(frontendDir, 'config'),
  path.join(frontendDir, 'auth'),
  path.join(frontendDir, 'components'),
  path.join(frontendDir, 'services')
];

// === Collect JS/JSX files from folders ===
function getAllJsFiles(folder) {
  const entries = fs.readdirSync(folder, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      return getAllJsFiles(fullPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      return [fullPath];
    }
    return [];
  });
}

// === Send code to Grok (xAI) API for review ===
async function reviewCodeWithGrok(code, filePath) {
  const prompt = `
You are an expert developer reviewing the following JavaScript/React code.
1. Identify any errors, misuses, or bugs.
2. Suggest clear fixes and explain why.
3. If the file is part of a frontend React app (e.g., contains "useSecrets", context, etc.), check for recent common bugs like:
   - "useSecrets must be used within a SecretsProvider"
   - secrets not loaded correctly
4. If it's backend code, ensure middleware and routes are correctly used (e.g., Express, async handlers).
5. Don’t rewrite the whole file, just list problems and suggest specific fixes.
6. Compile a list of all the issues and save them at the bottom of the log so I have a summary of what to fix by file
File path: ${filePath}
Code:
\`\`\`js
${code}
\`\`\`
`;

  try {
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-beta',
        messages: [
          { role: 'system', content: 'You are an expert developer code reviewer.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${XAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const suggestions = response.data.choices?.[0]?.message?.content || '⚠️ No suggestions returned.';
    return suggestions;
  } catch (err) {
    console.error(`❌ Error reviewing file ${filePath}:`, err.message);
    return '❌ Failed to get review from Grok.';
  }
}

// === Run analysis on all files ===
async function analyzeCodebase() {
  const allFiles = [...filesToCheck];

  for (const folder of foldersToCheck) {
    try {
      const jsFiles = getAllJsFiles(folder);
      allFiles.push(...jsFiles);
    } catch (err) {
      console.warn(`⚠️ Skipping folder (not found): ${folder}`);
    }
  }

  console.log(`🔍 Reviewing ${allFiles.length} files...\n`);

  for (const filePath of allFiles) {
    try {
      console.log(`📂 Reviewing ${filePath}...\n`);
      const code = fs.readFileSync(filePath, 'utf-8');
      const review = await reviewCodeWithGrok(code, filePath);
      console.log(`💡 Suggestions for ${filePath}:\n${review}\n${'-'.repeat(80)}\n`);
    } catch (err) {
      console.error(`❌ Failed to read or review file ${filePath}:`, err.message);
    }
  }

  console.log('✅ Code review completed for all target files.');
}

analyzeCodebase();
