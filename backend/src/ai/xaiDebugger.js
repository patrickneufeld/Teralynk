// ✅ FILE: backend/src/ai/xaiDebugger.js

import fetch from "node-fetch"; // Ensure 'node-fetch' is installed
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const XAI_API_URL = process.env.XAI_API_URL || "https://api.x.ai/analyze";
const XAI_API_KEY = process.env.XAI_API_KEY;

if (!XAI_API_KEY) {
    throw new Error("❌ ERROR: XAI_API_KEY is missing in the environment variables.");
}

/**
 * Sends a code snippet to x.ai for AI-powered debugging.
 * @param {string} codeSnippet - The code to analyze.
 * @param {string} language - Programming language (e.g., "javascript", "python").
 * @returns {Promise<Object>} - AI-generated debugging feedback.
 */
export async function analyzeCodeWithXAI(codeSnippet, language = "javascript") {
    try {
        const response = await fetch(XAI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${XAI_API_KEY}`,
            },
            body: JSON.stringify({ code: codeSnippet, language }),
        });

        if (!response.ok) {
            throw new Error(`❌ x.ai API request failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.analysis;
    } catch (error) {
        console.error("❌ Error analyzing code with x.ai:", error);
        return { error: "AI debugging service unavailable. Please try again later." };
    }
}
