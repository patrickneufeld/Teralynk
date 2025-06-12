// File: /backend/src/ai/aiTroubleshooter.js

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import troubleshootingLogger from '../utils/troubleshootingLogger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_MODEL = 'gpt-4-turbo';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/completions';
const LOG_PATH = path.resolve(__dirname, '../../logs/error.log');

// ✅ Validate OpenAI key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY');
  process.exit(1);
}

/**
 * Recursively gets all JavaScript files from a directory.
 */
const getJavaScriptFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory()
      ? getJavaScriptFiles(fullPath)
      : (entry.isFile() && fullPath.endsWith('.js') ? [fullPath] : []);
  });
};

/**
 * Runs OpenAI static analysis on project JS files.
 */
export const analyzeProjectFiles = async (projectPath) => {
  const jsFiles = getJavaScriptFiles(projectPath);
  if (!jsFiles.length) throw new Error('No JS files found for analysis.');

  const prompt = `
You are an expert AI code reviewer. Analyze the following JavaScript files for:
- syntax errors
- logical bugs
- security risks
- performance issues
- deprecated patterns

Respond in JSON array format:
[
  {
    "filePath": "path/to/file.js",
    "updatedCode": "fully rewritten, fixed code"
  }
]

--- CODE START ---

${jsFiles.map(fp => `File: ${fp}\n\n${fs.readFileSync(fp, 'utf8')}`).join('\n\n')}

--- CODE END ---
  `;

  try {
    const response = await axios.post(
      OPENAI_ENDPOINT,
      {
        model: OPENAI_MODEL,
        prompt,
        max_tokens: 4096,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const resultText = response?.data?.choices?.[0]?.text?.trim();
    if (!resultText) throw new Error('AI response empty.');

    await troubleshootingLogger.logTroubleshooting('project_analysis', projectPath, resultText);
    return { suggestions: resultText, analyzedFiles: jsFiles };
  } catch (err) {
    console.error('❌ AI Analysis Error:', err.message);
    throw new Error('AI analysis failed.');
  }
};

/**
 * Debug a single file using AI.
 */
export const debugFile = async (filePath) => {
  const fullPath = path.join(__dirname, '../../', filePath);
  if (!fs.existsSync(fullPath)) {
    return { success: false, message: 'File not found', filePath };
  }

  try {
    console.log(`🔍 Debugging file: ${filePath}`);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const analysis = await analyzeProjectFiles(path.dirname(fullPath));
    return { success: true, filePath, syntaxErrors: analysis };
  } catch (err) {
    console.error('❌ File Debugging Error:', err);
    return { success: false, message: 'Error during debugging', error: err.message };
  }
};

/**
 * Apply OpenAI-generated code fixes.
 */
export const applyFixes = (originalFiles, suggestionsJSON) => {
  try {
    const fixes = JSON.parse(suggestionsJSON);
    const updated = [];

    for (const { filePath, updatedCode } of fixes) {
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, updatedCode, 'utf8');
        updated.push(filePath);
        console.log(`✅ Fixed: ${filePath}`);
      } else {
        console.warn(`⚠️ Skipping missing file: ${filePath}`);
      }
    }

    return updated;
  } catch (err) {
    console.error('❌ Failed to apply AI fixes:', err.message);
    throw new Error('Fix application failed.');
  }
};

/**
 * Fetch recent log lines from system logs.
 */
export const fetchRecentLogs = () => {
  try {
    if (!fs.existsSync(LOG_PATH)) return 'No error logs found.';
    return fs.readFileSync(LOG_PATH, 'utf8').split('\n').slice(-50).join('\n');
  } catch (err) {
    console.error('❌ Log fetch error:', err.message);
    return 'Error reading logs.';
  }
};

/**
 * Log a manual debugging action to troubleshooting DB.
 */
export const logDebuggingAction = async (userId, filePath, summary) => {
  try {
    await troubleshootingLogger.logTroubleshooting(userId, filePath, summary);
    console.log(`📝 Logged debugging for ${filePath}`);
  } catch (err) {
    console.error('❌ Logging error:', err.message);
  }
};

/**
 * Exporting all tools
 */
export default {
  analyzeProjectFiles,
  debugFile,
  applyFixes,
  fetchRecentLogs,
  logDebuggingAction,
};
