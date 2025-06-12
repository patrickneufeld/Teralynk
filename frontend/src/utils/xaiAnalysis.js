import axios from "axios";

// ✅ Detect runtime environment
const isNode = typeof process !== "undefined" && process.env.NODE_ENV;

// ✅ Load environment variables if running in Node.js
if (isNode) {
  import("dotenv").then((dotenv) => dotenv.config());
}

// ✅ Retrieve VITE_XAI_API_KEY correctly for both environments
import 'dotenv/config';

const API_KEY = process.env.VITE_XAI_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_XAI_API_KEY is not defined");
}

console.log(`Using VITE_XAI API Key: ${API_KEY}`);

// Your script logic here

const XAI_API_URL = "https://api.x.ai/analyze";

if (!API_KEY) {
  console.warn("⚠️ Warning: VITE_XAI_API_KEY is missing. Ensure it"s set in your .env file.");
}

/**
 * ✅ Analyze issue using X.AI
 * Sends error logs and relevant debug data to X.AI for analysis.
 *
 * @param {string} errorLog - The error message or stack trace.
 * @param {string} [context="Secrets Fetching Issue"] - Context of the error.
 * @returns {Promise<string>} - AI-generated troubleshooting suggestions.
 */
export const analyzeIssueWithXAI = async (errorLog, context = "Secrets Fetching Issue") => {
  try {
    console.log("🚀 Sending issue to X.AI for analysis...");

    const response = await axios.post(
      XAI_API_URL,
      {
        error_log: errorLog,
        project: "Teralynk",
        context,
        timestamp: new Date().toISOString(),
        environment: isNode ? "Node.js" : "Browser",
        browser_info: isNode
          ? null
          : {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              onlineStatus: navigator.onLine,
            },
        localStorage: isNode ? null : JSON.stringify(localStorage),
        sessionStorage: isNode ? null : JSON.stringify(sessionStorage),
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ X.AI Suggested Fix:", response.data.suggested_fix);
    return response.data.suggested_fix;
  } catch (error) {
    console.error("❌ XAI API Error:", error);
    return "Error analyzing issue with X.AI. Check API key and connectivity.";
  }
};

// ✅ Test function if run directly in Node.js
if (isNode) {
  analyzeIssueWithXAI("Test error: Unable to load secrets")
    .then((suggestion) => console.log("X.AI Suggested Fix:", suggestion))
    .catch((err) => console.error("❌ Error:", err));
}
