const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

class AICodeUpdater {
  constructor() {
    this.repoPath = path.resolve(__dirname, "../../");
  }

  /**
   * Diagnose inefficiencies in the system and identify areas for improvement.
   * @returns {Object} - Diagnostic report.
   */
  async diagnoseSystem() {
    // Example: Analyze logs and performance metrics
    try {
      const logs = fs.readFileSync(path.join(this.repoPath, "logs", "combined.log"), "utf-8");
      const errorCount = (logs.match(/error/gi) || []).length;
      const suggestions = errorCount > 10
        ? "Reduce error occurrences by optimizing error-prone code sections."
        : "System performance is acceptable.";

      return { errorCount, suggestions };
    } catch (error) {
      console.error("Error analyzing logs:", error);
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
        {
          role: "system",
          content: "You are an AI assisting in improving code efficiency.",
        },
        {
          role: "user",
          content: `The following code needs optimization:\n\n${context}\n\nPlease suggest improvements.`,
        },
      ],
    };

    try {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", payload, {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error querying ChatGPT for code suggestions:", error);
      return "Unable to retrieve suggestions at this time.";
    }
  }

  /**
   * Apply suggested improvements to the codebase.
   * @param {string} filePath - Path to the file to update.
   * @param {string} updatedCode - New code to replace the existing one.
   * @returns {boolean} - Whether the update was successful.
   */
  async applyCodeUpdate(filePath, updatedCode) {
    try {
      const fullPath = path.resolve(this.repoPath, filePath);
      fs.writeFileSync(fullPath, updatedCode, "utf-8");

      // Commit the changes to version control
      await this.commitChanges(filePath, "Applied AI-suggested improvements.");
      return true;
    } catch (error) {
      console.error("Error applying code update:", error);
      return false;
    }
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
          console.error(`Error executing command: ${command}`, error);
        } else {
          console.log(`Command executed: ${command}`, stdout);
        }
      });
    }
  }
}

module.exports = new AICodeUpdater();
