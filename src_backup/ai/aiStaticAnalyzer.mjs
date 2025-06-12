// File: /Users/patrick/Projects/Teralynk/backend/src/ai/aiStaticAnalyzer.js

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);
import fs from "fs";
import path from "path";
import axios from "axios";
import { MongoClient } from "mongodb.js";

class AIStaticAnalyzer {
  constructor() {
    this.repoPath = path.resolve(__dirname, "../../");
    this.backupDir = path.join(this.repoPath, "backups");
    this.mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
    this.dbName = "teralynk_ai";
    this.client = new MongoClient(this.mongoUri);
    
    // Ensure the backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async connectDB() {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    this.rollbackCollection = this.db.collection("rollback_versions");
  }

  /**
   * Recursively find JavaScript files in the project directory.
   * @param {string} projectPath - The root directory of the project.
   * @returns {Array<string>} - List of JavaScript file paths.
   */
  getJavaScriptFiles(projectPath) {
    const filesToAnalyze = [];

    const readFiles = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.forEach((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          readFiles(fullPath);
        } else if (entry.isFile() && fullPath.endsWith(".js")) {
          filesToAnalyze.push(fullPath);
        }
      });
    };

    readFiles(projectPath);
    return filesToAnalyze;
  }

  /**
   * Perform static analysis on all JavaScript files using AI.
   * @param {string} projectPath - Path to the project directory.
   * @returns {Promise<object>} - Analysis results with suggestions.
   */
  async analyzeProjectFiles(projectPath) {
    const filesToAnalyze = this.getJavaScriptFiles(projectPath);

    // Read code from all files
    const codeSnippets = filesToAnalyze.map((filePath) => ({
      filePath,
      code: fs.readFileSync(filePath, "utf-8"),
    }));

    // Generate AI prompt
    const prompt = `Perform a static code analysis on the following JavaScript files.
      Detect syntax errors, logical issues, unused code, and suggest fixes.
      Respond in a JSON format with keys "filePath" and "updatedCode":\n\n` +
      codeSnippets.map(({ filePath, code }) => `File: ${filePath}\n${code}\n\n`).join("\n");

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 3000,
          temperature: 0.3,
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        }
      );

      return { suggestions: response.data.choices[0].message.content.trim(), filesToAnalyze };
    } catch (error) {
      console.error("❌ AI Analysis Failed:", error.message);
      return { suggestions: "Analysis failed due to API error.", filesToAnalyze: [] };
    }
  }

  /**
   * Create a rollback version in MongoDB before modifying files.
   * @param {string} filePath - Path of the file to back up.
   */
  async storeRollbackVersion(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const timestamp = new Date();
      await this.rollbackCollection.insertOne({ filePath, content, timestamp });

      console.log(`💾 Rollback version stored for ${filePath}`);
    } catch (error) {
      console.error("❌ Failed to store rollback version:", error.message);
    }
  }

  /**
   * Restore the latest rollback version from MongoDB.
   * @param {string} filePath - Path of the file to restore.
   */
  async restoreRollbackVersion(filePath) {
    try {
      const latestVersion = await this.rollbackCollection.findOne(
        { filePath },
        { sort: { timestamp: -1 } }
      );

      if (latestVersion) {
        fs.writeFileSync(filePath, latestVersion.content, "utf-8");
        console.log(`🔄 Restored ${filePath} to last rollback version.`);
      } else {
        console.warn(`⚠️ No rollback version found for ${filePath}.`);
      }
    } catch (error) {
      console.error("❌ Rollback restoration failed:", error.message);
    }
  }

  /**
   * Apply AI-generated fixes to the corresponding files.
   * @param {Array<object>} filesToAnalyze - Original code snippets.
   * @param {string} suggestions - AI-generated fix suggestions.
   */
  async applyFixes(filesToAnalyze, suggestions) {
    const updatedFiles = [];

    try {
      let suggestionsMap;
      try {
        suggestionsMap = JSON.parse(suggestions);
      } catch (parseError) {
        console.error("❌ Failed to parse AI suggestions as JSON.");
        console.log("AI Response:", suggestions);
        return [];
      }

      for (const { filePath, updatedCode } of suggestionsMap) {
        if (fs.existsSync(filePath)) {
          await this.storeRollbackVersion(filePath); // Store rollback version

          fs.writeFileSync(filePath, updatedCode, "utf-8");
          console.log(`✅ Applied fix to: ${filePath}`);

          if (await this.verifyCodeSyntax(filePath)) {
            updatedFiles.push(filePath);
          } else {
            console.error(`❌ Syntax error in ${filePath}. Rolling back...`);
            await this.restoreRollbackVersion(filePath);
          }
        } else {
          console.warn(`⚠️ File not found: ${filePath}. Skipping.`);
        }
      }
    } catch (err) {
      console.error("❌ Error applying fixes:", err.message);
    }

    return updatedFiles;
  }

  /**
   * Verify the syntax of a JavaScript file before applying AI fixes.
   * @param {string} filePath - Path to the JavaScript file.
   * @returns {Promise<boolean>} - Returns true if valid, false if syntax errors are detected.
   */
  async verifyCodeSyntax(filePath) {
    return new Promise((resolve) => {
      await import("child_process.js").exec(`node --check ${filePath}`, (error) => {
        if (error) {
          console.error(`❌ Syntax error in ${filePath}:`, error.message);
          resolve(false);
        } else {
          console.log(`✅ Syntax check passed for ${filePath}.`);
          resolve(true);
        }
      });
    });
  }
}

// Ensure database connection before exporting
(async () => {
  const analyzer = new AIStaticAnalyzer();
  await analyzer.connectDB();
  export default analyzer;
})();
