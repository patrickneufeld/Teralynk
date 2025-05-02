// File: /Users/patrick/Projects/Teralynk/frontend/scripts/debugLoginWithAI.js

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_PATH = path.join(__dirname, '..'); // /frontend/
const API_KEY = 'b15ab920ef4c41709fbfdcb058e74075';
const API_URL = 'https://api.aimlapi.com/v1/chat/completions';
const MAX_TOKENS = 7900;

const getAllRelevantFiles = (dir) => {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllRelevantFiles(fullPath));
    } else if (
      entry.name.match(/(login|auth|token|session|context)/i) &&
      entry.name.match(/\.(js|jsx)$/)
    ) {
      results.push(fullPath);
    }
  }
  return results;
};

const readFiles = (files) =>
  files.map((file) => ({
    name: path.relative(FRONTEND_PATH, file),
    content: fs.readFileSync(file, 'utf-8'),
  }));

const estimateTokens = (text) => Math.ceil(text.length / 4);

const chunkByTokenLimit = (files) => {
  const chunks = [];
  let current = [];
  let totalTokens = 0;

  for (const file of files) {
    const fileTokens = estimateTokens(file.content);
    if (totalTokens + fileTokens > MAX_TOKENS) {
      chunks.push(current);
      current = [];
      totalTokens = 0;
    }
    current.push(file);
    totalTokens += fileTokens;
  }

  if (current.length) chunks.push(current);
  return chunks;
};

const createPrompt = (chunk) => {
  const fileDump = chunk
    .map(
      (f) =>
        `// File: ${f.name}\n${f.content}`
    )
    .join('\n\n/* --- */\n\n');

  return [
    {
      role: 'system',
      content:
        'You are an expert React and authentication debugger. Identify login failures, token issues, and redirect logic errors. Be precise.',
    },
    {
      role: 'user',
      content:
        `I am debugging why clicking the login button doesn't redirect to the dashboard in my React app. Here are the related files:\n\n${fileDump}`,
    },
  ];
};

const sendToAI = async (messages) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('❌ API Error:', JSON.stringify(result, null, 2));
      return;
    }

    const reply = result.choices?.[0]?.message?.content || '[No response]';
    console.log('\n🧠 AI Debug Suggestion:\n');
    console.log(reply);
  } catch (error) {
    console.error('❌ Fetch Error:', error.message);
  }
};

(async () => {
  console.log('🔍 Scanning frontend directory for auth-related files...');
  const files = getAllRelevantFiles(FRONTEND_PATH);
  const fileContents = readFiles(files);
  const chunks = chunkByTokenLimit(fileContents);

  for (const chunk of chunks) {
    const prompt = createPrompt(chunk);
    await sendToAI(prompt);
  }
})();(async function processFiles() {
  const files = await getFiles(); // Assuming getFiles is a function that retrieves the files
  const fileContents = files.map(file => file.content); // Assuming each file has a 'content' property
  const chunks = chunkFiles(fileContents); // Assuming chunkFiles is a function that chunks the file contents

  console.log(`📦 Found ${files.length} files, sending ${chunks.length} chunk(s) to AI...`);

  for (let i = 0; i < chunks.length; i++) {
    console.log(`\n--- Sending Chunk ${i + 1} of ${chunks.length} ---`);
    const messages = createPrompt(chunks[i]); // Assuming createPrompt is a function that creates messages from chunks
    await sendToAI(messages); // Assuming sendToAI is a function that sends messages to AI
  }
})();

function chunkFiles(fileContents) {
  // Implement the logic to chunk file contents
  // This is a placeholder function and should be replaced with actual logic
  return [fileContents]; // Example: returning the entire content as a single chunk
}

function createPrompt(chunk) {
  // Implement the logic to create a prompt from a chunk
  // This is a placeholder function and should be replaced with actual logic
  return [`Prompt for chunk: ${chunk}`]; // Example: creating a simple prompt
}

async function sendToAI(messages) {
  // Implement the logic to send messages to AI
  // This is a placeholder function and should be replaced with actual logic
  console.log(`Sending messages to AI: ${messages}`);
}