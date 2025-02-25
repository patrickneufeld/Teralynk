/* File Path: backend/src/ai/aiModelTrainer.js */

const { spawn } = require('child_process');

function trainModel(scriptPath) {
    const process = spawn('python', [scriptPath]);
    process.stdout.on('data', (data) => console.log(`Training: ${data}`));
    process.stderr.on('data', (data) => console.error(`Error: ${data}`));
}

module.exports = { trainModel };