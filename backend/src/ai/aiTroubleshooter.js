console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);
const fs = require("fs");
const path = require("path");
const axios = require("axios");

/**
 * Perform static analysis on all project files
 * @param {string} projectPath - Path to the project directory
 * @returns {Promise<object>} - Analysis results
 */
const analyzeProjectFiles = async (projectPath) => {
  const filesToAnalyze = [];

  // Recursively read all JavaScript files
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

  // Read code from all files
  const codeSnippets = filesToAnalyze.map((filePath) => ({
    filePath,
    code: fs.readFileSync(filePath, "utf-8"),
  }));

  // Generate AI prompt for analysis
  const prompt = `Perform a static code analysis of the following project files. Detect syntax errors, logical issues, and unused code. Provide suggestions for fixes in a JSON format with keys "filePath" and "updatedCode":\n\n` +
    codeSnippets
      .map(({ filePath, code }) => `File: ${filePath}\n\n${code}\n\n`)
      .join("\n");

  try {
    // Send prompt to AI
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4",
        prompt,
        max_tokens: 3000,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    return { suggestions: response.data.choices[0].text.trim(), filesToAnalyze };
  } catch (error) {
    console.error("Error during AI analysis:", error.message);
    throw new Error("AI analysis failed.");
  }
};

/**
 * Apply fixes suggested by the AI
 * @param {Array<object>} filesToAnalyze - Original code snippets
 * @param {string} suggestions - AI-generated fix suggestions
 */
const applyFixes = (filesToAnalyze, suggestions) => {
  const updatedFiles = [];

  try {
    // Parse AI suggestions (expecting JSON response)
    let suggestionsMap;
    try {
      suggestionsMap = JSON.parse(suggestions);
    } catch (parseError) {
      console.error("Failed to parse AI suggestions as JSON. Manual review required.");
      console.log("AI Suggestions:", suggestions);
      throw new Error("AI suggestions could not be parsed.");
    }

    // Apply fixes to the corresponding files
    suggestionsMap.forEach(({ filePath, updatedCode }) => {
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, updatedCode, "utf-8");
        updatedFiles.push(filePath);
        console.log(`✅ Applied fix to: ${filePath}`);
      } else {
        console.warn(`❌ File not found: ${filePath}. Skipping.`);
      }
    });
  } catch (err) {
    console.error("Error applying fixes:", err.message);
    throw new Error("Failed to apply AI fixes.");
  }

  return updatedFiles;
};

module.exports = { analyzeProjectFiles, applyFixes };
