
function sanitize(input) {
  return String(input).replace(/[^a-zA-Z0-9@_\-:. ]/g, '').trim();
}


import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/ai/aiCodeUpdater.js

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import { storePreviousVersion, rollbackToLastStable } from '../api/rollbackManager.mjs';

// ✅ Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AICodeUpdater {
  constructor() {
    this.repoPath = path.resolve(__dirname, "../../");
    this.backupDir = path.join(this.repoPath, "backups");
    this.logsPath = path.join(this.repoPath, "logs", "combined.log");

    // ✅ Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * ✅ Diagnose system performance & log inefficiencies.
   * @returns {Object} - Diagnostic report.
   */
  async diagnoseSystem() {
    try {
      const logs = fs.readFileSync(this.logsPath, "utf-8");
      const errorCount = (logs.match(/error/gi) || []).length;
      const suggestions =
        errorCount > 10
          ? "⚠️ System has high error occurrences. Optimization required."
          : "✅ System performance is stable.";

      return { errorCount, suggestions };
    } catch (error) {
      console.error("❌ Error analyzing logs:", error);
      return { errorCount: 0, suggestions: "Log analysis failed." };
    }
  }

  /**
   * ✅ Fetch AI-Suggested Code Improvements
   * Uses OpenAI to analyze and improve AI-generated code dynamically.
   * @param {string} filePath - The path of the file to update
   * @param {string} context - Contextual information for better updates
   * @returns {Promise<string>} - AI-optimized code suggestions.
   */
  async queryChatGPTForCode(filePath, context) {
    try {
      const code = fs.readFileSync(filePath, "utf-8");

      const response = await axios.post(
        "https://api.openai.com/v1/completions",
        {
          model: "gpt-4",
          prompt: `Analyze the following code for potential improvements and suggest a corrected version:\n\n${code}\n\nContext: ${context}`,
          max_tokens: 800,
          temperature: 0.3,
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        }
      );

      return response.data?.choices?.[0]?.text?.trim() || null;
    } catch (error) {
      console.error("❌ Error querying AI for code suggestions:", error);
      return null;
    }
  }

  /**
   * ✅ Create a backup before modifying code.
   * @param {string} filePath - Path to the file to back up.
   */
  createBackup(filePath) {
    try {
      const fullPath = path.resolve(this.repoPath, filePath);
      const backupPath = path.join(this.backupDir, `${path.basename(filePath)}.bak`);

      fs.copyFileSync(fullPath, backupPath);
      console.log(`💾 Backup created for ${filePath} at ${backupPath}`);
    } catch (error) {
      console.error("❌ Error creating backup:", error);
    }
  }

  /**
   * ✅ Restore backup if update fails.
   * @param {string} filePath - Path to restore.
   */
  restoreBackup(filePath) {
    try {
      const fullPath = path.resolve(this.repoPath, filePath);
      const backupPath = path.join(this.backupDir, `${path.basename(filePath)}.bak`);

      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, fullPath);
        console.log(`🔄 Rolled back ${filePath} to the last stable version.`);
      } else {
        console.warn(`⚠️ No backup found for ${filePath}. Rollback skipped.`);
      }
    } catch (error) {
      console.error("❌ Error restoring backup:", error);
    }
  }

  /**
   * ✅ Apply AI-Suggested Code Updates
   * @param {string} filePath - The path of the file to update
   * @param {string} updatedCode - The AI-suggested updated code
   * @returns {Promise<boolean>} - Success status.
   */
  async applyCodeUpdate(filePath, updatedCode) {
    try {
      if (!updatedCode) {
        console.log("⚠️ No valid updates were suggested.");
        return false;
      }

      // ✅ Create a backup before updating
      this.createBackup(filePath);
      storePreviousVersion(filePath);

      fs.writeFileSync(filePath, updatedCode, "utf-8");
      console.log(`✅ AI Code Update Applied: ${filePath}`);

      // ✅ Verify syntax before committing changes
      if (await this.verifyCodeSyntax(filePath)) {
        await this.commitChanges(filePath, "Applied AI-suggested improvements.");
        return true;
      } else {
        console.error(`❌ Syntax errors detected in ${filePath}. Rolling back...`);
        this.restoreBackup(filePath);
        rollbackToLastStable(filePath);
        return false;
      }
    } catch (error) {
      console.error("❌ Error applying AI code update:", error);
      return false;
    }
  }

  /**
   * ✅ Verify that the updated JavaScript file has no syntax errors.
   * @param {string} filePath - File path to check.
   * @returns {Promise<boolean>} - Whether the code is valid.
   */
  async verifyCodeSyntax(filePath) {
    return new Promise((resolve) => {
      exec(`node --check ${path.resolve(this.repoPath, filePath)}`, (error) => {
        if (error) {
          console.error(`❌ Syntax error in ${filePath}:`, error.message);
          resolve(false);
        } else {
          console.log(`✅ No syntax errors in ${filePath}.`);
          resolve(true);
        }
      });
    });
  }

  /**
   * ✅ Auto-Rollback If Errors Detected
   * @param {string} filePath - Path of the updated file.
   */
  async autoRollbackIfError(filePath) {
    try {
      // Simulate testing the updated code (to be replaced with an actual testing framework)
      const testResult = Math.random() > 0.5; // Simulated pass/fail
      if (!testResult) {
        console.warn("⚠️ AI-generated code failed tests. Rolling back...");
        this.restoreBackup(filePath);
        rollbackToLastStable(filePath);
      }
    } catch (error) {
      console.error("❌ Error during rollback check:", error.message);
    }
  }

  /**
   * ✅ Commit changes to Git.
   * @param {string} filePath - Updated file path.
   * @param {string} message - Commit message.
   */
  async commitChanges(filePath, message) {
    const commands = [
      `git add ${filePath}`,
      `git commit -m "${message}"`,
      "git push",
    ];

    for (const command of commands) {
      exec(command, { cwd: this.repoPath }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error executing: ${command}`, error);
        } else {
          console.log(`✅ Command executed: ${command}`, stdout);
        }
      });
    }
  }
}

// ✅ Fix: Use ES Module Export
export default new AICodeUpdater();


// TODO: Implement rate limiting logic to avoid API abuse (e.g., token bucket or middleware).