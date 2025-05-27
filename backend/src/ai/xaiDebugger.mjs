// ✅ FILE: backend/src/ai/xaiDebugger.js

import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// ✅ Fix for ES Modules (__dirname alternative)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Configuration
const baseURL = "https://api.x.ai/v1"; // Ensure this is correct based on X.AI documentation
const logFilePath = path.join(__dirname, "../../logs/xai_debug_results.json");

// ✅ Ensure logs directory exists
const LOGS_DIR = path.dirname(logFilePath);
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// ✅ AWS Secrets Manager Configuration
const secretsClient = new SecretsManagerClient({ region: "us-east-1" });

/**
 * Retrieves the XAI API key from AWS Secrets Manager.
 * @returns {Promise<string>} - The API key.
 */
async function getXAIAPIKey() {
    try {
        const secretName = "XAI_API_KEY";
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await secretsClient.send(command);
        
        if (!response.SecretString) {
            throw new Error("❌ AWS Secrets Manager response does not contain a SecretString.");
        }

        const secret = JSON.parse(response.SecretString);
        return secret.XAI_API_KEY;
    } catch (error) {
        console.error("❌ Error retrieving XAI API key from AWS Secrets Manager:", error);
        throw new Error("❌ Failed to retrieve XAI API key from AWS.");
    }
}

/**
 * Reads a file's content and returns it as a string.
 * @param {string} filePath - Absolute path to the file.
 * @returns {string|null} - File content or null if error.
 */
function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, "utf-8");
    } catch (error) {
        console.error(`❌ Error reading file ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Writes debugging results to a file.
 * @param {Object} data - Debugging results to save.
 */
function saveResultsToFile(data) {
    try {
        fs.writeFileSync(logFilePath, JSON.stringify(data, null, 2), "utf-8");
        console.log(`✅ Debugging results saved to: ${logFilePath}`);
    } catch (error) {
        console.error("❌ Error writing results file:", error.message);
    }
}

/**
 * Sends a code snippet to X.AI for AI-powered debugging.
 * @param {string} codeSnippet - The code to analyze.
 * @param {string} fileName - File name for context.
 * @returns {Promise<Object|null>} - AI-generated debugging feedback.
 */
async function analyzeCodeWithXAI(codeSnippet, fileName) {
    try {
        const XAI_API_KEY = await getXAIAPIKey();
        const XAI_API_URL = `${baseURL}/completions`; // Ensure this endpoint exists

        console.log(`🔹 Sending request to X.AI API: ${XAI_API_URL}`);
        console.log(`🔹 Using API Key: ${XAI_API_KEY ? "Present ✅" : "Missing ❌"}`);

        const response = await axios.post(
            XAI_API_URL,
            {
                model: "grok-beta", // Ensure this model is valid
                prompt: `Analyze the following code from ${fileName}:\n\n${codeSnippet}`,
                max_tokens: 1000,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${XAI_API_KEY}`,
                },
            }
        );

        console.log(`🔹 Response Status: ${response.status}`);
        console.log(`🔹 Response Data:`, response.data);

        if (!response.data) {
            throw new Error("❌ No response data from X.AI API.");
        }

        return response.data;
    } catch (error) {
        console.error(`❌ Error analyzing code with X.AI:`, error.response ? error.response.data : error.message);
        return null;
    }
}

/**
 * Scans a file and analyzes its content.
 * @param {string} filePath - Path to the file to analyze.
 * @returns {Promise<Object|null>}
 */
async function scanFile(filePath) {
    const code = readFileContent(filePath);
    if (code) {
        console.log(`🚀 Sending ${filePath} to X.AI for analysis...`);
        const analysisResult = await analyzeCodeWithXAI(code, path.basename(filePath));
        if (analysisResult) {
            console.log(`✅ Analysis complete for ${filePath}`);
            return { filePath, analysisResult };
        }
    }
    return null;
}

/**
 * Runs full debugging checks on authentication and login systems.
 */
async function runFullDebugScan() {
    console.log("🔎 Running full debugging scan...");

    const filesToScan = [
        "/Users/patrick/Projects/Teralynk/backend/src/routes/auth.js",
        "/Users/patrick/Projects/Teralynk/backend/src/controllers/authController.js",
        "/Users/patrick/Projects/Teralynk/backend/src/middleware/authMiddleware.js",
        "/Users/patrick/Projects/Teralynk/backend/services/auth/cognitoService.js", // ✅ Corrected Path
        "/Users/patrick/Projects/Teralynk/frontend/src/components/Login.jsx", // ✅ Corrected Path
        "/Users/patrick/Projects/Teralynk/frontend/src/utils/auth.js", // ✅ Corrected Path
    ];

    const scanResults = [];

    for (const filePath of filesToScan) {
        const result = await scanFile(filePath);
        if (result) {
            scanResults.push(result);
        } else {
            console.log(`⚠️ Skipping ${filePath} (File not found or empty).`);
        }
    }

    // Save results to log file
    saveResultsToFile(scanResults);

    console.log("✅ Full debugging scan complete.");
}

// Execute the debugging scan when script is run directly
runFullDebugScan().catch((error) => {
    console.error("❌ Error during full debugging scan:", error.message);
});

// Export functions for manual triggering (ES Module syntax)
export { analyzeCodeWithXAI, scanFile, runFullDebugScan };
