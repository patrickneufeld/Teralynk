import pkg from 'pg';  // Default import for the pg module
const { Client } = pkg;  // Destructure to get the Client
import fs from 'fs';
import axios from 'axios';
import troubleshootingLogger from '../../utils/troubleshootingLogger.js'; // Ensure correct import for logger

// ✅ Ensure OpenAI API key is loaded
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ ERROR: Missing OPENAI_API_KEY in environment variables.");
  process.exit(1);
}

/**
 * Recursively retrieve all JavaScript files in a directory
 * @param {string} dir - Directory path
 * @returns {Array<string>} - List of JavaScript file paths
 */
const getJavaScriptFiles = (dir) => {
  let fileList = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      fileList = fileList.concat(getJavaScriptFiles(fullPath));
    } else if (entry.isFile() && fullPath.endsWith(".js")) {
      fileList.push(fullPath);
    }
  }

  return fileList;
};

/**
 * Analyze project files using AI for errors & improvements
 * @param {string} projectPath - Path to the project directory
 * @returns {Promise<object>} - Analysis results
 */
export const analyzeProjectFiles = async (projectPath) => {
  const jsFiles = getJavaScriptFiles(projectPath);
  if (jsFiles.length === 0) {
    throw new Error("No JavaScript files found in the project directory.");
  }

  // Prepare code snippets
  const codeSnippets = jsFiles.map((filePath) => ({
    filePath,
    code: fs.readFileSync(filePath, "utf-8"),
  }));

  const prompt = `
    Perform a **static code analysis** on the following JavaScript project files.
    - Detect syntax errors, logical issues, and security vulnerabilities.
    - Identify unused code, performance bottlenecks, and best practice violations.
    - Provide suggestions in JSON format with keys: "filePath", "updatedCode".
    
    ${codeSnippets.map(({ filePath, code }) => `File: ${filePath}\n\n${code}\n\n`).join("\n")}
  `;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-4-turbo",
        prompt,
        max_tokens: 4096,
        temperature: 0.2,
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    const aiResponse = response.data.choices[0]?.text?.trim();
    if (!aiResponse) {
      throw new Error("AI returned an empty response.");
    }

    await troubleshootingLogger.logTroubleshooting("project_analysis", projectPath, aiResponse);

    return { suggestions: aiResponse, analyzedFiles: jsFiles };
  } catch (error) {
    console.error("❌ Error during AI analysis:", error.message);
    throw new Error("AI analysis failed.");
  }
};

/**
 * Apply AI-suggested fixes to project files
 * @param {Array<object>} analyzedFiles - Original code snippets
 * @param {string} suggestions - AI-generated fix suggestions
 * @returns {Array<string>} - List of updated files
 */
export const applyFixes = (analyzedFiles, suggestions) => {
  const updatedFiles = [];

  try {
    let suggestionsMap;
    try {
      suggestionsMap = JSON.parse(suggestions);
    } catch (parseError) {
      console.error("❌ Failed to parse AI suggestions as JSON. Manual review required.");
      console.log("AI Suggestions:\n", suggestions);
      throw new Error("AI suggestions could not be parsed.");
    }

    // Apply fixes to files
    for (const { filePath, updatedCode } of suggestionsMap) {
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, updatedCode, "utf-8");
        updatedFiles.push(filePath);
        console.log(`✅ Applied AI fix to: ${filePath}`);
      } else {
        console.warn(`❌ File not found: ${filePath}. Skipping.`);
      }
    }
  } catch (err) {
    console.error("❌ Error applying fixes:", err.message);
    throw new Error("Failed to apply AI fixes.");
  }

  return updatedFiles;
};
