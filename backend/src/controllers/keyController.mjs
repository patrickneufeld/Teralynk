import { v4 as uuidv4 } from "uuid";  // For generating unique IDs
import pkg from 'pg';  // PostgreSQL Client for database interaction
const { Client } = pkg;  // Destructure Client from 'pg'
import dotenv from "dotenv";  // To load environment variables

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

// GENERATE API KEY
export const generateKey = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const apiKey = uuidv4();  // Generate a new API key
        const query = `
            INSERT INTO api_keys (id, user_id, api_key, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), user_id, apiKey]);

        res.json({ message: "API key generated successfully", key: result.rows[0] });
    } catch (error) {
        console.error("❌ Generate API Key Error:", error.message);
        res.status(500).json({ error: "Failed to generate API key" });
    }
};

// FETCH API KEYS
export const getKeys = async (req, res) => {
    try {
        const { user_id } = req.query;

        const query = `
            SELECT * FROM api_keys
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        const result = await dbClient.query(query, [user_id]);

        res.json({ keys: result.rows });
    } catch (error) {
        console.error("❌ Fetch API Keys Error:", error.message);
        res.status(500).json({ error: "Failed to fetch API keys" });
    }
};

// REVOKE API KEY
export const revokeKey = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("DELETE FROM api_keys WHERE id = $1 RETURNING *;", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "API key not found" });
        }

        res.json({ message: "API key revoked successfully", key: result.rows[0] });
    } catch (error) {
        console.error("❌ Revoke API Key Error:", error.message);
        res.status(500).json({ error: "Failed to revoke API key" });
    }
};

// MANAGE API KEYS
export const manageKeys = async (req, res) => {
    try {
        const { user_id, action, key_id } = req.body;

        if (!user_id || !action || !key_id) {
            return res.status(400).json({ error: "User ID, action, and key ID are required" });
        }

        let query;
        if (action === "activate") {
            query = `
                UPDATE api_keys 
                SET active = true, updated_at = NOW()
                WHERE id = $1 AND user_id = $2
                RETURNING *;
            `;
        } else if (action === "deactivate") {
            query = `
                UPDATE api_keys 
                SET active = false, updated_at = NOW()
                WHERE id = $1 AND user_id = $2
                RETURNING *;
            `;
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }

        const result = await dbClient.query(query, [key_id, user_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "API key not found" });
        }

        res.json({ message: `API key ${action}d successfully`, key: result.rows[0] });
    } catch (error) {
        console.error("❌ Manage API Keys Error:", error.message);
        res.status(500).json({ error: "Failed to manage API keys" });
    }
};
