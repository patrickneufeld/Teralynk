const { exec } = require("child_process");
const { analyzeProjectFiles, applyFixes } = require("./src/ai/aiTroubleshooter");
const dotenv = require("dotenv");
dotenv.config({ path: "/Users/patrick/Projects/Teralynk/backend/.env" });

const projectPath = "/Users/patrick/Projects/Teralynk/backend";
const maxIterations = 10; // Limit the number of debugging iterations

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

const runApp = () => {
  return new Promise((resolve, reject) => {
    const process = exec("node server.js", { cwd: projectPath });

    let errorLog = "";
    process.stdout.on("data", (data) => console.log(data));
    process.stderr.on("data", (data) => {
      console.error(data);
      errorLog += data;
    });

    process.on("exit", (code) => {
      if (code === 0) {
        resolve("App ran successfully without errors.");
      } else {
        reject(errorLog);
      }
    });
  });
};

const analyzeAndFixProject = async () => {
  console.log("\n🔍 Starting full project analysis...\n");

  // Analyze project files using AI
  const { suggestions, filesToAnalyze } = await analyzeProjectFiles(projectPath);

  console.log("\n🔍 AI Analysis Suggestions:\n");
  console.log(suggestions);

  if (!filesToAnalyze || filesToAnalyze.length === 0) {
    console.log("✅ No files require updates.");
    return [];
  }

  // Apply fixes based on AI suggestions
  const updatedFiles = applyFixes(filesToAnalyze, suggestions);

  console.log(`✅ Applied fixes to the following files:\n${updatedFiles.join("\n")}`);
  return updatedFiles;
};

const debugProject = async () => {
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n🔍 Debugging Iteration: ${iteration}\n`);

    try {
      // Static analysis and fixes
      const updatedFiles = await analyzeAndFixProject();

      if (updatedFiles.length === 0) {
        console.log("✅ No further fixes required. Exiting debugger.");
        break;
      }

      // Runtime testing
      const result = await runApp();
      console.log(`✅ ${result}`);
      break; // Exit if runtime succeeds
    } catch (errorLog) {
      console.error(`❌ Error occurred during runtime:\n${errorLog}`);
      console.log("🤖 Sending runtime error to AI for debugging...");
    }
  }

  if (iteration === maxIterations) {
    console.error("❌ Maximum debugging iterations reached. Please review the project manually.");
  }
};

debugProject();
