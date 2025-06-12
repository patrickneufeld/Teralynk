/* File Path: backend/src/ai/aiDebugAPI.js */

const { queryAI } = require('./aiIntegrationAPI');

async function debugAI(issue) {
    const response = await queryAI('gpt-4', `Debug this issue: ${issue}`);
    return response;
}

export { debugAI };