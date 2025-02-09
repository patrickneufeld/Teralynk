/* File Path: backend/src/ai/aiIntegrationAPI.js */

const axios = require('axios');

async function queryAI(model, prompt) {
    const response = await axios.post('https://api.openai.com/v1/completions', {
        model,
        prompt,
        max_tokens: 100
    }, {
        headers: { 'Authorization': `Bearer YOUR_OPENAI_API_KEY` }
    });
    return response.data;
}

module.exports = { queryAI };