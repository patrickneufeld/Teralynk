// ================================================
// File: /backend/tmp/debugModule.mjs
// ================================================

import { spawn } from 'child_process';
import path from 'path';

const targetPath = process.argv[2];

if (!targetPath) {
    console.error('❌ Error: No target file specified.');
    process.exit(1);
}

console.log(`🛠️  Running syntax check on: ${targetPath}`);

const nodeProcess = spawn('node', ['--check', targetPath], { stdio: 'inherit' });

nodeProcess.on('exit', (code) => {
    if (code === 0) {
        console.log('✅ Syntax check passed. No syntax errors found.');
    } else {
        console.error(`❌ Syntax check failed with exit code: ${code}`);
    }
    process.exit(code);
});
