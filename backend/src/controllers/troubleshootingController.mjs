import { v4 as uuidv4 } from "uuid";  // For generating unique IDs
import pkg from 'pg';  // PostgreSQL Client for database interaction
const { Client } = pkg;  // Destructure Client from 'pg'
import axios from "axios";  // For making external API requests
import dotenv from "dotenv";  // To load environment variables
import logger from "../config/logger.mjs";  // Logger setup

dotenv.config();

// Initialize PostgreSQL Client
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
 * AI Troubleshooting Handler
 * @route POST /api/troubleshoot/query
 * @desc AI analyzes user issues and provides solutions
 */
export const troubleshootIssue = async (req, res) => {
    try {
        const { query, category } = req.body;
        const user_id = req.user.cognito_id;
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        const request_id = uuidv4();

        // Log user issue in PostgreSQL
        await dbClient.query(
            `INSERT INTO troubleshooting_logs (id, user_id, query, category, created_at) VALUES ($1, $2, $3, $4, NOW())`,
            [request_id, user_id, query, category || "general"]
        );

        // AI Query Processing (Self-Diagnosing)
        const aiResponse = await querySelfDiagnosingAI(query);

        // Store AI Response
        await dbClient.query(
            `UPDATE troubleshooting_logs SET response = $1 WHERE id = $2`,
            [JSON.stringify(aiResponse), request_id]
        );

        res.json({ request_id, response: aiResponse });
    } catch (error) {
        console.error("❌ Troubleshooting Error:", error.message);
        res.status(500).json({ error: "Failed to troubleshoot issue" });
    }
};

/**
 * Fetch Past Troubleshooting Queries
 * @route GET /api/troubleshoot/history
 * @desc Retrieve past troubleshooting queries for a user
 */
export const fetchTroubleshootingHistory = async (req, res) => {
    try {
        const user_id = req.user.cognito_id;
        const result = await dbClient.query(
            "SELECT id, query, response, category, created_at FROM troubleshooting_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
            [user_id]
        );

        res.json({ history: result.rows });
    } catch (error) {
        console.error("❌ Fetch Troubleshooting History Error:", error.message);
        res.status(500).json({ error: "Failed to retrieve troubleshooting history" });
    }
};

/**
 * Delete Troubleshooting History
 * @route DELETE /api/troubleshoot/history/:id
 * @desc Allow users to delete specific troubleshooting queries
 */
export const deleteTroubleshootingHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.cognito_id;

        const result = await dbClient.query(
            "DELETE FROM troubleshooting_logs WHERE id = $1 AND user_id = $2 RETURNING *",
            [id, user_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Entry not found" });
        }

        res.json({ message: "Troubleshooting history deleted successfully" });
    } catch (error) {
        console.error("❌ Troubleshooting History Deletion Error:", error.message);
        res.status(500).json({ error: "Failed to delete troubleshooting history" });
    }
};

/**
 * Query AI for Self-Diagnosing Troubleshooting
 * @desc AI attempts to automatically resolve user issues
 */
const querySelfDiagnosingAI = async (query) => {
    try {
        const aiServiceURL = process.env.TROUBLESHOOTING_AI_URL;
        const apiKey = process.env.TROUBLESHOOTING_AI_KEY;

        if (!aiServiceURL || !apiKey) {
            throw new Error("AI service credentials are missing.");
        }

        const response = await axios.post(aiServiceURL, { prompt: query }, {
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        });

        return response.data;
    } catch (error) {
        logger.error("❌ AI Troubleshooting Error:", error.message);
        return { error: "AI failed to diagnose the issue. Please try again later." };
    }
};

export {
    troubleshootIssue,
    fetchTroubleshootingHistory,
    deleteTroubleshootingHistory,
};
