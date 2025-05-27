// File: /frontend/src/utils/aimlClient.js
import axios from "axios";

const AIML_API_KEY = import.meta.env.VITE_AIML_API_KEY;
const BASE_URL = "https://api.aimlapi.com/v1"; // Adjust based on endpoint docs

const aimlClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Authorization": `Bearer ${AIML_API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Example: Send a prompt to the AI
export const sendPromptToAI = async (prompt) => {
  try {
    const response = await aimlClient.post("/chat", {
      prompt,
      temperature: 0.7,
      max_tokens: 1000,
    });
    return response.data;
  } catch (error) {
    console.error("❌ AI API call failed:", error);
    throw error;
  }
};

export default aimlClient;
