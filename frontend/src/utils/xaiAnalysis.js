// /Users/patrick/Projects/Teralynk/frontend/src/utils/xaiAnalysis.js

import axios from "axios";

const XAI_API_KEY = process.env.XAI_API_KEY; // Ensure you have this in .env file

export const analyzeIssueWithXAI = async (errorLog) => {
  try {
    const response = await axios.post(
      "https://api.x.ai/analyze",
      {
        error_log: errorLog,
        project: "Teralynk",
        context: "Frontend build issue",
      },
      {
        headers: {
          Authorization: `Bearer ${XAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.suggested_fix; // AI-generated fix
  } catch (error) {
    console.error("XAI API Error:", error);
    return "Error analyzing issue with x.ai.";
  }
};
