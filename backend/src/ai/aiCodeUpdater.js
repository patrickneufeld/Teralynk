import { exec } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url"; // ✅ Required for ES module support

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
   * ✅ Diagnose inefficiencies and identify areas for improvement.
   * @returns {Object} - Diagnostic report.
   */
  async diagnoseSystem() {
    try {
      const logs = fs.readFileSync(this.logsPath, "utf-8");
      const errorCount = (logs.match(/error/gi) || []).length;
      const suggestions =
        errorCount > 10
          ? "⚠️ System has high error occurrences. Consider optimizing inefficient code paths."
          : "✅ System performance is acceptable.";

      return { errorCount, suggestions };
    } catch (error) {
      console.error("❌ Error analyzing logs:", error);
      return { errorCount: 0, suggestions: "Log analysis failed." };
    }
  }

  /**
   * ✅ Query OpenAI for code improvement suggestions.
   * @param {string} context - Context of inefficiency or code needing improvement.
   * @returns {Promise<string>} - Suggested improvements.
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
   * ✅ Apply AI-suggested improvements.
   * @param {string} filePath - File to update.
   * @param {string} updatedCode - AI-optimized code.
   * @returns {Promise<boolean>} - Success status.
   */
  async applyCodeUpdate(filePath, updatedCode) {
    try {
      const fullPath = path.resolve(this.repoPath, filePath);

      // ✅ Create a backup
      this.createBackup(filePath);

      fs.writeFileSync(fullPath, updatedCode, "utf-8");
      console.log(`✅ Successfully applied AI-suggested updates to ${filePath}`);

      // ✅ Verify syntax before committing changes
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
