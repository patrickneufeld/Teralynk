// File: backend/scripts/fixProject.js

import { autoFixProject } from '../utils/xaiCodeFixer.mjs';
import path from 'path';
import fs from 'fs';

// ✅ Get the absolute path of the project's root directory
const projectRoot = path.resolve('../../frontend');

console.log(`🚀 Starting X.ai Auto-Fixer on project: ${projectRoot}`);

// ✅ Ensure the project directory exists
if (!fs.existsSync(projectRoot)) {
    console.error(`❌ Error: Project directory not found: ${projectRoot}`);
    process.exit(1);
}

// ✅ Run the auto-fix process
await autoFixProject(projectRoot);

console.log('✅ X.ai Auto-Fixer completed successfully!');
