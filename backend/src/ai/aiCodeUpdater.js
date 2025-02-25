// File: /Users/patrick/Projects/Teralynk/backend/src/ai/aiCodeUpdater.js

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

class AICodeUpdater {
  constructor() {
    this.repoPath = path.resolve(__dirname, "../../");
    this.backupDir = path.join(this.repoPath, "backups");
    this.logsPath = path.join(this.repoPath, "logs", "combined.log");

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Diagnose inefficiencies in the system and identify areas for improvement.
   * @returns {Object} - Diagnostic report.
   */
  async diagnoseSystem() {
    try {
      const logs = fs.readFileSync(this.logsPath, "utf-8");
      const errorCount = (logs.match(/error/gi) || []).length;
      const suggestions = errorCount > 10
        ? "System has high error occurrences. Consider optimizing inefficient code paths."
        : "System performance is acceptable.";

      return { errorCount, suggestions };
    } catch (error) {
      console.error("❌ Error analyzing logs:", error);
      return { errorCount: 0, suggestions: "Log analysis failed." };
    }
  }

  /**
   * Query ChatGPT for code improvement suggestions.
   * @param {string} context - Context of the inefficiency or specific code section.
   * @returns {string} - Suggested improvements.
   */
  async queryChatGPTForCode(context) {
    const payload = {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an AI optimizing JavaScript code for efficiency." },
        { role: "user", content: `Optimize the following code for performance:\n\n${context}\n\nProvide improvements.` },
      ],
    };

    try {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", payload, {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("❌ Error querying ChatGPT for code suggestions:", error);
      return "Unable to retrieve suggestions at this time.";
    }
  }

  /**
   * Create a backup of the original file before modifying.
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
   * Restore the last backup if an update fails.
   * @param {string} filePath - Path to the file to restore.
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
   * Apply AI-suggested improvements to the codebase.
   * @param {string} filePath - Path to the file to update.
   * @param {string} updatedCode - New code to replace the existing one.
   * @returns {boolean} - Whether the update was successful.
   */
  async applyCodeUpdate(filePath, updatedCode) {
    try {
      const fullPath = path.resolve(this.repoPath, filePath);

      // Create a backup before modifying
      this.createBackup(filePath);

      fs.writeFileSync(fullPath, updatedCode, "utf-8");
      console.log(`✅ Successfully applied AI-suggested updates to ${filePath}`);

      // Verify that the updated code is error-free before committing
      if (await this.verifyCodeSyntax(filePath)) {
        await this.commitChanges(filePath, "Applied AI-suggested improvements.");
        return true;
      } else {
        console.error(`❌ Syntax errors detected in ${filePath}. Rolling back...`);
        this.restoreBackup(filePath);
        return false;
      }
    } catch (error) {
      console.error("❌ Error applying code update:", error);
      return false;
    }
  }

  /**
   * Check if the updated JavaScript file has syntax errors.
   * @param {string} filePath - Path to the JavaScript file.
   * @returns {boolean} - Returns true if the code is valid, otherwise false.
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
   * Commit changes to version control.
   * @param {string} filePath - File path of the updated file.
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

module.exports = new AICodeUpdater();
