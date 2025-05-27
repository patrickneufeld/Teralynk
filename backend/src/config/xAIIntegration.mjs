// File: backend/src/config/xAIIntegration.js

import axios from "axios";
import fs from "fs/promises"; // ✅ FIX: Import `fs` to avoid "fs is not defined" error

class xAIIntegration {
  constructor() {
    this.apiEndpoint = "https://api.x.ai"; // ✅ FIX: Use correct API endpoint
    this.apiKey = XAI_API_KEY
  }

  /**
   * Queries xAI for troubleshooting suggestions.
   * @param {string} filePath - The file path being debugged.
   * @param {string} fileContent - The content of the file.
   * @returns {Promise<string>}
   */
  async queryXAIForTroubleshooting(filePath, fileContent) {
    try {
      const response = await axios.post(this.apiEndpoint, {
        filePath,
        fileContent,
      }, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.suggestion) {
        return response.data.suggestion;
      }

      return "❌ xAI did not return a valid suggestion.";
    } catch (error) {
      console.error("❌ xAI API request failed:", error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        return `❌ xAI API Error - Invalid endpoint: ${this.apiEndpoint}`;
      }

      return `❌ xAI API Error - ${error.response?.data?.error?.message || "Unknown issue"}`;
    }
  }

  /**
   * Applies an AI-generated fix to a file.
   * @param {string} filePath - The file to update.
   * @param {string} newContent - The updated file content.
   * @returns {Promise<boolean>}
   */
  async applyAIFix(filePath, newContent) {
    try {
      await fs.writeFile(filePath, newContent, "utf-8"); // ✅ FIXED: `fs` now properly imported
      console.log(`✅ Applied AI fix to ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error applying fix to ${filePath}:`, error.message);
      return false;
    }
  }
}

// ✅ Correct Export
const xAI = new xAIIntegration();
export default xAI;
