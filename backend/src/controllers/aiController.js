// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/controllers/aiController.js

const { Client } = require("pg");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// ✅ Initialize PostgreSQL Client
const dbClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false, require: true },
});

dbClient.connect().catch(err => {
    console.error("❌ PostgreSQL Connection Error:", err.message);
});

/**
 * ✅ Process AI Request
 * @route POST /api/ai/process
 * @desc Send query to multiple AI models and return responses
 */
const processAIRequest = async (req, res) => {
    try {
        const { query, aiModels } = req.body;
        if (!query || !aiModels || !Array.isArray(aiModels) || aiModels.length === 0) {
            return res.status(400).json({ error: "Query and at least one AI model are required." });
        }

        const user_id = req.user.cognito_id;
        const request_id = uuidv4(); // Unique ID for tracking

        // ✅ Prepare AI Requests
        const aiResponses = await Promise.all(aiModels.map(async (model) => {
            try {
                // Retrieve API credentials for the model
                const apiResult = await dbClient.query(
                    "SELECT api_url, api_key FROM ai_integrations WHERE model = $1 AND user_id = $2",
                    [model, user_id]
                );

                if (apiResult.rows.length === 0) {
                    return { model, error: "AI integration not configured for this user." };
                }

                const { api_url, api_key } = apiResult.rows[0];

                // ✅ Send request to AI model
                const response = await axios.post(api_url, { prompt: query }, {
                    headers: { Authorization: `Bearer ${api_key}`, "Content-Type": "application/json" },
                });

                return { model, response: response.data };
            } catch (error) {
                console.error(`❌ Error querying ${model}:`, error.message);
                return { model, error: "Failed to process request." };
            }
        }));

        // ✅ Log AI request in PostgreSQL
        await dbClient.query(
            `INSERT INTO ai_requests (id, user_id, query, response, created_at) VALUES ($1, $2, $3, $4, NOW())`,
            [request_id, user_id, query, JSON.stringify(aiResponses)]
        );

        res.json({ request_id, responses: aiResponses });
    } catch (error) {
        console.error("❌ AI Processing Error:", error);
        res.status(500).json({ error: "AI processing failed." });
    }
};

/**
 * ✅ Fetch AI Request History
 * @route GET /api/ai/history
 * @desc Retrieve past AI requests from database
 */
const fetchAIHistory = async (req, res) => {
    try {
        const user_id = req.user.cognito_id;

        const result = await dbClient.query(
            "SELECT id, query, response, created_at FROM ai_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
            [user_id]
        );

        res.json({ history: result.rows });
    } catch (error) {
        console.error("❌ AI History Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch AI history." });
    }
};

/**
 * ✅ Delete AI Request History
 * @route DELETE /api/ai/history/:id
 * @desc Allow users to delete specific AI queries
 */
const deleteAIHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.cognito_id;

        const result = await dbClient.query(
            "DELETE FROM ai_requests WHERE id = $1 AND user_id = $2 RETURNING *",
            [id, user_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "AI history entry not found." });
        }

        res.json({ message: "AI history entry deleted successfully." });
    } catch (error) {
        console.error("❌ AI History Deletion Error:", error);
        res.status(500).json({ error: "Failed to delete AI history." });
    }
};

module.exports = { processAIRequest, fetchAIHistory, deleteAIHistory };
