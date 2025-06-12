import fs from 'fs';
import path from 'path';

// Function to recursively search through files in a directory
const searchEnvVariables = (dir) => {
  const envVariables = new Set();

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      // Recursively search directories
      const subDirVars = searchEnvVariables(fullPath);
      subDirVars.forEach((v) => envVariables.add(v));
    } else if (file.endsWith('.js')) {
      // Search JavaScript files for `process.env`
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = content.match(/process\.env\.(\w+)/g);
      if (matches) {
        matches.forEach((match) => {
          const variable = match.replace('process.env.', '');
          envVariables.add(variable);
        });
      }
    }
  });

  return envVariables;
};

// Directory to scan (replace with your project directory)
const projectDir = path.resolve('./src');

// Scan and print all environment variables used in the code
const envVars = searchEnvVariables(projectDir);
console.log('Environment Variables Used in Code:');
envVars.forEach((v) => console.log(`- ${v}`));
