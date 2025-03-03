import { v4 as uuidv4 } from "uuid";  // Importing uuid for unique request IDs
import pkg from 'pg';  // PostgreSQL Client for database interaction
const { Client } = pkg;  // Destructure Client from 'pg'
import axios from "axios";  // For making external API requests
import dotenv from "dotenv";  // To load environment variables

dotenv.config();

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

// ✅ PROCESS AI REQUEST
export const processAIRequest = async (req, res) => {
    try {
        const { query, models } = req.body;

        if (!query || !Array.isArray(models) || models.length === 0) {
            return res.status(400).json({ error: "Query and at least one AI model are required." });
        }

        const user_id = req.user.cognito_id;
        const request_id = uuidv4(); // Unique ID for the request

        const aiResponses = await Promise.all(models.map(async (model) => {
            try {
                const apiResult = await dbClient.query(
                    "SELECT api_url, api_key FROM ai_integrations WHERE model_name = $1 AND user_id = $2",
                    [model, user_id]
                );

                if (apiResult.rows.length === 0) {
                    return { model, error: "AI integration not configured for this user." };
                }

                const { api_url, api_key } = apiResult.rows[0];

                // ✅ Perform AI request
                const response = await axios.post(api_url, { query }, {
                    headers: { Authorization: `Bearer ${api_key}` }
                });

                return { model, response: response.data };

            } catch (error) {
                console.error(`❌ Error querying ${model}:`, error.message);
                return { model, error: error.message };
            }
        }));

        // ✅ Log AI request to PostgreSQL
        await dbClient.query(
            `INSERT INTO ai_requests (id, user_id, query, response, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [request_id, user_id, query, JSON.stringify(aiResponses)]
        );

        res.json({ message: "AI responses retrieved successfully", data: aiResponses });
    } catch (error) {
        console.error("❌ AI Processing Error:", error);
        res.status(500).json({ error: "AI processing failed." });
    }
};

/**
 * ✅ Fetch AI Request History
 * @route GET /api/ai/history
 */
export const fetchAIHistory = async (req, res) => {
    try {
        const user_id = req.user.cognito_id;

        const result = await dbClient.query(
            `SELECT id, query, response, created_at FROM ai_requests
             WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
            [user_id]
        );

        res.json({ history: result.rows });
    } catch (error) {
        console.error("❌ AI History Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch AI history." });
    }
};

/**
 * ✅ Delete specific AI History entry
 * @route DELETE /api/ai/history/:id
 */
export const deleteAIHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.cognito_id;

        const result = await dbClient.query(
            `DELETE FROM ai_requests WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, user_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "AI history entry not found." });
        }

        res.json({ message: "AI history entry deleted successfully." });
    } catch (error) {
        console.error("❌ AI History Deletion Error:", error);
        res.status(500).json({ error: "Failed to delete AI history entry." });
    }
};
