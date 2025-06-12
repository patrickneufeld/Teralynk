import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Correct __dirname handling in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target directory
const targetDirectory = path.resolve(__dirname, "src");

/**
 * Recursively find all JS files in the given directory.
 * @param {string} dir - Directory to search.
 * @returns {string[]} - List of .js file paths.
 */
function findJSFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  const jsFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      jsFiles.push(...findJSFiles(fullPath));
    } else if (file.isFile() && fullPath.endsWith(".js")) {
      jsFiles.push(fullPath);
    }
  }

  return jsFiles;
}

/**
 * Convert require statements to import statements.
 * @param {string} fileContent - Original file content.
 * @returns {string} - Updated file content with import statements.
 */
function convertRequireToImport(fileContent) {
  return fileContent.replace(/const (\w+) = require\([""](.*?)[""]\);/g, (match, variable, module) => {
    return `import ${variable} from "${module}";`;
  });
}

/**
 * Process all .js files in the target directory.
 */
function processFiles() {
  const jsFiles = findJSFiles(targetDirectory);

  for (const filePath of jsFiles) {
    const originalContent = fs.readFileSync(filePath, 'utf-8');
    const updatedContent = convertRequireToImport(originalContent);

    // Write updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Run the conversion
processFiles();
