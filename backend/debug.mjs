// File: backend/debug.js

import xAI from "./src/config/xAIIntegration.mjs"; // ✅ Ensure correct import
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";

class AIFileDebugger {
  constructor() {
    this.targetFiles = [
      "src/routes/aiRoutes.mjs";,
      "src/config/db.js",
    ];
    this.repoPath = path.resolve(".");
  }

  /**
   * Start debugging process
   */
  async debugFiles() {
    console.log("🔍 Starting AI File Debugger...");

    for (const file of this.targetFiles) {
      const filePath = await this.findFile(file);
      if (!filePath) {
        console.error(`❌ Could not locate ${file}. Skipping.`);
        continue;
      }

      try {
        const content = await fs.readFile(filePath, "utf-8");

        // ✅ Ensure xAI is queried correctly
        let fixSuggestion = await xAI.queryXAIForTroubleshooting(filePath, content);

        if (!fixSuggestion || fixSuggestion.includes("xAI API is currently unavailable")) {
          console.warn(`⚠ xAI could not process ${file}. No changes applied.`);
          continue;
        }

        if (fixSuggestion.includes("❌ xAI API Error")) {
          console.warn(`⚠ xAI provided a suggested fix for ${file}:`);
          console.log(fixSuggestion);
          continue;
        }

        // ✅ Only log fixes instead of overwriting files
        console.log(`🛠 Suggested Fix for ${file}:`);
        console.log(fixSuggestion);
        console.log("⚠ Fix NOT applied automatically. Please review manually.");

      } catch (error) {
        console.error(`❌ Error reading file ${file}:`, error.message);
      }
    }

    // ✅ Restart server only after debugging completes
    this.restartServer();
  }

  /**
   * Locate missing files and return the correct path.
   * @param {string} filename - The filename to search for.
   * @returns {Promise<string|null>}
   */
  async findFile(filename) {
    const searchPath = path.join(this.repoPath, filename);
    try {
      await fs.access(searchPath);
      console.log(`✅ Found ${filename} at: ${searchPath}`);
      return searchPath;
    } catch {
      console.warn(`⚠ File not found: ${filename}. Searching...`);
      return null;
    }
  }

  /**
   * Restart the server after debugging.
   */
  restartServer() {
    console.log("🔄 Restarting server.js...");
    exec("npm run dev", (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Error restarting server:", stderr);
        return;
      }
      console.log(stdout);
    });
  }
}

// ✅ Create and run debugger instance
const debuggerInstance = new AIFileDebugger();
debuggerInstance.debugFiles();
