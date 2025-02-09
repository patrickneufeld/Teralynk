// File: backend/src/ai/AIFileDebugger.js

import fs from "fs/promises";
import path from "path";
import xAI from "../config/xAIIntegration.js";
import { exec } from "child_process";

class AIFileDebugger {
  constructor() {
    this.repoPath = path.resolve(".");
    this.targetFiles = [
      "src/routes/aiRoutes.js",
      "src/config/db.js",
    ];
  }

  /**
   * Locate missing files and correct their paths.
   * @param {string} fileName - The file name to search for.
   * @returns {Promise<string|null>} - Corrected file path or null.
   */
  async findFile(fileName) {
    try {
      console.log(`🔍 Searching for ${fileName} from project root...`);
      const { stdout } = await this.executeCommand(`find ${this.repoPath} -type f -name "${fileName}"`);
      const filePaths = stdout.split("\n").filter(Boolean);

      if (filePaths.length > 0) {
        console.log(`✅ Found ${fileName} at: ${filePaths[0]}`);
        return filePaths[0];
      } else {
        console.error(`❌ Could not locate ${fileName}.`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error searching for ${fileName}:`, error.message);
      return null;
    }
  }

  /**
   * Executes a shell command.
   * @param {string} command - The shell command to execute.
   * @returns {Promise<{ stdout: string, stderr: string }>}
   */
  executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) reject(error);
        resolve({ stdout, stderr });
      });
    });
  }

  /**
   * Fix incorrect file paths.
   */
  async fixFilePaths() {
    console.log("🔍 Validating file paths...");
    for (let i = 0; i < this.targetFiles.length; i++) {
      const filePath = path.resolve(this.targetFiles[i]);
      try {
        await fs.access(filePath);
      } catch (error) {
        console.warn(`⚠ File not found: ${this.targetFiles[i]}. Searching...`);
        const foundPath = await this.findFile(path.basename(this.targetFiles[i]));
        if (foundPath) {
          console.log(`✅ Updating path for ${this.targetFiles[i]}`);
          this.targetFiles[i] = foundPath;
        }
      }
    }
  }

  /**
   * Debug files without overwriting.
   */
  async debugFiles() {
    console.log("🔍 Starting AI File Debugger...");
    let allFilesFixed = false;

    while (!allFilesFixed) {
      await this.fixFilePaths();
      allFilesFixed = true; // Assume no issues

      for (const file of this.targetFiles) {
        try {
          console.log(`🔍 Debugging file: ${file}`);
          const content = await fs.readFile(file, "utf-8");

          // Send content to xAI for troubleshooting
          const fixSuggestion = await xAI.queryXAIForTroubleshooting(file, content);

          if (!fixSuggestion || fixSuggestion.includes("xAI API Error")) {
            console.warn(`⚠ xAI could not process ${file}. No changes made.`);
            continue;
          }

          // ✅ Only log fixes instead of overwriting files
          console.log(`🛠 Suggested fix for ${file}:\n${fixSuggestion}`);
          console.log("⚠ Please apply the suggested fix manually.");
        } catch (error) {
          console.error(`❌ Error reading file ${file}:`, error.message);
          allFilesFixed = false; // Keep retrying
        }
      }

      console.log("🔄 Restarting server to verify fixes...");
      await this.restartServer();
    }

    console.log("✅ Debugging complete. All issues resolved.");
  }

  /**
   * Restart the Node.js server only if necessary.
   */
  async restartServer() {
    console.log("🔄 Restarting server.js...");
    exec("npm run dev", (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error restarting server: ${error.message}`);
        return;
      }
      console.log(stdout);
      console.error(stderr);
    });
  }

  /**
   * Update the list of files to debug.
   * @param {string[]} newFiles - List of files to debug.
   */
  updateTargetFiles(newFiles) {
    this.targetFiles = newFiles;
    console.log(`✅ Updated files to debug:\n${newFiles.join("\n")}`);
  }
}

export default new AIFileDebugger();
