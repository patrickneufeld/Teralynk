/**
 * Migration script to help identify files that need to be updated to use the new logging system.
 * 
 * Usage:
 * 1. Run this script with Node.js: node migrate-logging.js
 * 2. It will scan your project files and output a report of files that need to be updated
 * 3. It can also generate migration suggestions for each file
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const rootDir = path.resolve(__dirname, '../../..');
const excludeDirs = ['node_modules', 'build', 'dist', '.git', 'public'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

// Patterns to search for
const patterns = {
  consoleLog: /console\.log\(/g,
  consoleError: /console\.error\(/g,
  consoleWarn: /console\.warn\(/g,
  consoleInfo: /console\.info\(/g,
  consoleDebug: /console\.debug\(/g,
  logError: /logError\(/g,
  logInfo: /logInfo\(/g,
  logWarning: /logWarning\(/g,
  logDebug: /logDebug\(/g,
  logAuditEvent: /logAuditEvent\(/g,
  importErrorHandler: /import.*ErrorHandler/g,
  importLogger: /import.*logger/g,
  importLoggingService: /import.*loggingService/g,
  importAuditLogger: /import.*auditLogger/g,
};

// Files to remove after migration
const filesToRemove = [
  path.join(rootDir, 'src/utils/logger.js'),
  path.join(rootDir, 'src/utils/ErrorHandler.js'),
  path.join(rootDir, 'src/utils/loggingService.js'),
  path.join(rootDir, 'src/utils/auditLogger.js'),
  path.join(rootDir, 'src/components/ErrorBoundary.jsx'),
];

// Replacement suggestions
const replacements = {
  'logger.info(': 'logger.info(',
  'logger.error(': 'logger.error(',
  'logger.warn(': 'logger.warn(',
  'logger.info(': 'logger.info(',
  'logger.debug(': 'logger.debug(',
  'logger.error(': 'logger.error(',
  'logger.info(': 'logger.info(',
  'logger.warn(': 'logger.warn(',
  'logger.debug(': 'logger.debug(',
  'logger.logAudit(': 'logger.logAudit(',
  "import logger from "../utils/logging"": "import logger from "../utils/logging.js"",
  "import logger from "../utils/logging"": "import logger from "../utils/logging.js"",
  "import { info } from "../utils/logging"": "import { info } from "../utils/logging.js"",
  "import { logAudit } from "../utils/logging"": "import { logAudit } from "../utils/logging.js"",
};

// Function to scan a file for patterns
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = {};
  
  Object.entries(patterns).forEach(([name, pattern]) => {
    const match = content.match(pattern);
    if (match && match.length > 0) {
      matches[name] = match.length;
    }
  });
  
  return Object.keys(matches).length > 0 ? matches : null;
}

// Function to walk directory and find files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (fileExtensions.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main function
function main() {
  logger.info('Scanning project for files to migrate...');
  const files = findFiles(rootDir);
  const filesToMigrate = [];
  
  files.forEach(file => {
    const matches = scanFile(file);
    if (matches) {
      filesToMigrate.push({ file, matches });
    }
  });
  
  logger.info(`\nFound ${filesToMigrate.length} files that need migration:`);
  filesToMigrate.forEach(({ file, matches }) => {
    const relativePath = path.relative(rootDir, file);
    logger.info(`\n${relativePath}:`);
    Object.entries(matches).forEach(([pattern, count]) => {
      logger.info(`  - ${pattern}: ${count} occurrences`);
    });
  });
  
  logger.info('\nFiles to remove after migration:');
  filesToRemove.forEach(file => {
    const relativePath = path.relative(rootDir, file);
    logger.info(`  - ${relativePath}`);
  });
  
  logger.info('\nReplacement suggestions:');
  Object.entries(replacements).forEach(([from, to]) => {
    logger.info(`  - Replace "${from}" with "${to}"`);
  });
  
  logger.info('\nMigration steps:');
  logger.info('1. Update imports to use the new logging system');
  logger.info('2. Replace logging function calls with the new API');
  logger.info('3. Update ErrorBoundary components to use the new one from utils/logging');
  logger.info('4. Test thoroughly to ensure all logging works as expected');
  logger.info('5. Remove the old logging files once migration is complete');
}

// Run the script
main();
