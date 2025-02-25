// File Path: backend/src/ai/aiQueryDispatcher.js

function dispatchQuery(query, aiServices) {
    console.log(`📨 Dispatching query: "${query}" to selected AIs.`);
    return aiServices.map(ai => ai.respond(query));
}

module.exports = { dispatchQuery };
