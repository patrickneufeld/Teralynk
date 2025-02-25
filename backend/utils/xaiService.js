// File: backend/utils/xaiService.js

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL;

if (!XAI_API_KEY || !XAI_API_URL) {
    throw new Error("X.ai API credentials are missing. Check .env file.");
}

/**
 * Sends a message to X.ai and retrieves AI-generated responses.
 * @param {string} message - The user message to send.
 * @returns {Promise<string>} - The AI-generated response.
 */
export const askXAI = async (message) => {
    try {
        const response = await axios.post(
            XAI_API_URL,
            {
                messages: [
                    { role: "system", content: "You are an AI assistant." },
                    { role: "user", content: message }
                ],
                model: "grok-2-1212",
                stream: false,
                temperature: 0.7 // Changed from 0 to 0.7 for more natural responses
            },
            {
                headers: {
                    Authorization: `Bearer ${XAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content;
        } else {
            throw new Error("Unexpected response format from X.ai.");
        }
    } catch (error) {
        console.error("X.ai API Error:", error.response ? error.response.data : error.message);
        throw new Error("Failed to get response from X.ai.");
    }
};
