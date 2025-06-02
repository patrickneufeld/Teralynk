const fs = require("fs");
const path = require("path");

const baseDir = path.resolve(__dirname, "../");

// Define file movements
const structure = {
  "api": [
    "authRoutes.js",
    "chatFileRoutes.js",
    "fileRoutes.js",
    "healthCheck.js",
    "workflowRoutes.js",
  ],
  "config": ["oauthRoutes.js"],
  "middleware": ["errorHandler.js", "rateLimiter.js"],
  "services/auth": ["auth.js"],
  "services/file": ["fileService.js", "fileSharing.js", "fileSync.js"],
  "services/notification": ["notification.js", "notificationDashboard.js"],
  "utils": ["externalIntegrations.js"],
};

// Ensure directory exists
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// Move files to target directories
const moveFile = (fileName, targetDir) => {
  const sourcePath = path.join(baseDir, "src/api", fileName);
  const destinationPath = path.join(baseDir, "src", targetDir, fileName);

  if (fs.existsSync(sourcePath)) {
    ensureDir(path.dirname(destinationPath));
    fs.renameSync(sourcePath, destinationPath);
    console.log(`Moved ${fileName} -> ${destinationPath}`);
  } else {
    console.warn(`File not found: ${sourcePath}`);
  }
};

// Reorganize files based on the defined structure
const reorganizeFiles = () => {
  console.log("Starting reorganization...");

  for (const [targetDir, files] of Object.entries(structure)) {
    files.forEach((file) => {
      moveFile(file, targetDir);
    });
  }

  console.log("Reorganization complete.");
};

// Execute the script
reorganizeFiles();
