// File: backend/utils/xaiCodeFixer.js

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '../.env' });

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL;

if (!XAI_API_KEY || !XAI_API_URL) {
    console.error("❌ X.ai API credentials are missing! Check .env file.");
    process.exit(1);
}

/**
 * Sends code to X.ai for troubleshooting and auto-fixing.
 * @param {string} code - The raw code to analyze and fix.
 * @returns {Promise<string>} - The fixed code from X.ai.
 */
const troubleshootAndFixCode = async (code) => {
    try {
        const response = await axios.post(
            XAI_API_URL,
            {
                messages: [
                    { role: "system", content: "You are an expert software engineer. Troubleshoot and fix the provided code." },
                    { role: "user", content: `Analyze and fix the following code:\n\n${code}\n\nONLY return the corrected code. No explanations, no additional text.` }
                ],
                model: "grok-2-1212",
                stream: false,
                temperature: 0
            },
            {
                headers: {
                    Authorization: `Bearer ${XAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let fixedCode = response.data.choices[0].message.content;

        // 🛠 Ensure unwanted text like "Here's the corrected version..." is removed
        fixedCode = fixedCode.replace(/^Here's the corrected version of the provided code:\n/, '');

        return fixedCode;
    } catch (error) {
        console.error("X.ai API Error:", error.response ? error.response.data : error.message);
        throw new Error("Failed to analyze code with X.ai.");
    }
};

/**
 * Reads a file, sends it to X.ai for troubleshooting, and overwrites it with the fixed version.
 * @param {string} filePath - The path of the file to analyze and fix.
 */
const autoFixFile = async (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            return;
        }

        const code = fs.readFileSync(filePath, 'utf8');

        console.log(`🚀 Sending ${filePath} to X.ai for troubleshooting...`);
        const fixedCode = await troubleshootAndFixCode(code);

        console.log(`✅ Fixed code received. Updating ${filePath}...`);
        fs.writeFileSync(filePath, fixedCode, 'utf8');

        console.log(`🎉 ${filePath} has been auto-fixed!`);
    } catch (error) {
        console.error(`❌ Failed to auto-fix ${filePath}:`, error.message);
    }
};

/**
 * Recursively scans a directory for JavaScript/TypeScript files and fixes them.
 * @param {string} dir - The directory to scan.
 */
const autoFixProject = async (dir) => {
    const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);
    
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const fileName = path.basename(filePath);

        if (stats.isDirectory()) {
            if (!EXCLUDED_DIRS.has(fileName)) {
                await autoFixProject(filePath); // Recursively scan subdirectories
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
            await autoFixFile(filePath); // Fix JavaScript/TypeScript files
        }
    }
};

// Export functions
export { autoFixFile, autoFixProject };
