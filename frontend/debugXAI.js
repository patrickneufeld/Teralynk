// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/debugxai.js

import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); // Load API keys from .env

const XAI_API_KEY = process.env.XAI_API_KEY || "your-xai-api-key"; // Replace if needed
const ERROR_LOG_FILE = "./frontend_error.log";
const OUTPUT_FILE = "./debug_analysis.log";
const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

async function readErrorLogs() {
    try {
        if (!fs.existsSync(ERROR_LOG_FILE)) {
            console.log("❌ No error logs found.");
            return null;
        }
        return fs.readFileSync(ERROR_LOG_FILE, "utf8");
    } catch (err) {
        console.error("⚠️ Error reading log file:", err);
        return null;
    }
}

async function sendToXAI(errorLogs) {
    try {
        console.log("🚀 Sending error logs to X.ai for analysis...");

        const response = await axios.post(XAI_API_URL, {
            model: "grok-2-latest",
            messages: [
                { role: "system", content: "You are an expert AI developer. Analyze the errors and find why they keep occurring." },
                { role: "user", content: `Here are the latest frontend errors:\n\n${errorLogs}\n\nWhy do these errors keep happening? Give a detailed solution.` }
            ],
            stream: false,
            temperature: 0.5
        }, {
            headers: {
                "Authorization": `Bearer ${XAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        return response.data;
    } catch (err) {
        console.error("❌ Failed to send request to X.ai:", err.response ? err.response.data : err.message);
        return null;
    }
}

async function main() {
    console.log("🔎 Reading frontend error logs...");
    
    const errorLogs = await readErrorLogs();
    if (!errorLogs) return;

    const aiResponse = await sendToXAI(errorLogs);
    if (!aiResponse) {
        console.error("❌ X.ai failed to analyze the logs.");
        return;
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(aiResponse, null, 2));
    console.log(`✅ X.ai analysis saved to: ${OUTPUT_FILE}`);
}

main();
