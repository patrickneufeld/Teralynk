// ✅ FILE PATH: /Users/patrick/Projects/Teralynk/backend/src/controllers/marketplaceController.js

import pkg from "pg";
const { Client } = pkg;
import logger from "../config/logger.js";

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
    logger.error("❌ PostgreSQL Connection Error:", err.message);
});

/**
 * ✅ Fetch All APIs Available in the Marketplace
 * @route GET /api/marketplace/addons
 */
export const getAllAPIs = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM marketplace_addons ORDER BY created_at DESC");
        res.json({ message: "Marketplace APIs retrieved successfully", data: result.rows });
    } catch (error) {
        logger.error("❌ Error fetching APIs:", error);
        res.status(500).json({ error: "Failed to fetch marketplace APIs" });
    }
};

/**
 * ✅ Fetch Single API Details
 * @route GET /api/marketplace/addons/:id
 */
export const getAPIById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbClient.query("SELECT * FROM marketplace_addons WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "API not found" });
        }

        res.json({ message: "API retrieved successfully", data: result.rows[0] });
    } catch (error) {
        logger.error("❌ Error fetching API:", error);
        res.status(500).json({ error: "Failed to fetch API details" });
    }
};

/**
 * ✅ Add a New API to the Marketplace
 * @route POST /api/marketplace/addons
 */
export const addAPI = async (req, res) => {
    try {
        const { name, description, type, api_url, username, password } = req.body;
        const added_by = req.user.cognito_id;

        if (!name || !description || !type) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const query = `
            INSERT INTO marketplace_addons (name, description, type, api_url, username, password, added_by, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *;
        `;

        const result = await dbClient.query(query, [
            name,
            description,
            type,
            api_url || null,
            username || null,
            password || null,
            added_by
        ]);

        res.status(201).json({ message: "API added successfully", data: result.rows[0] });
    } catch (error) {
        logger.error("❌ Error adding API:", error);
        res.status(500).json({ error: "Failed to add API to marketplace" });
    }
};

/**
 * ✅ Update an API in the Marketplace
 * @route PUT /api/marketplace/addons/:id
 */
export const updateAPI = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type, api_url, username, password } = req.body;
        const updated_by = req.user.cognito_id;

        const result = await dbClient.query(
            `UPDATE marketplace_addons SET name = $1, description = $2, type = $3, api_url = $4, username = $5, 
             password = $6, updated_by = $7, updated_at = NOW() WHERE id = $8 RETURNING *;`,
            [name, description, type, api_url || null, username || null, password || null, updated_by, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "API not found" });
        }

        res.json({ message: "API updated successfully", data: result.rows[0] });
    } catch (error) {
        logger.error("❌ Error updating API:", error);
        res.status(500).json({ error: "Failed to update API" });
    }
};

/**
 * ✅ Delete an API from the Marketplace
 * @route DELETE /api/marketplace/addons/:id
 */
export const deleteAPI = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await dbClient.query("DELETE FROM marketplace_addons WHERE id = $1 RETURNING *;", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "API not found" });
        }

        res.json({ message: "API deleted successfully" });
    } catch (error) {
        logger.error("❌ Error deleting API:", error);
        res.status(500).json({ error: "Failed to delete API" });
    }
};

/**
 * ✅ Purchase an API
 * @route POST /api/marketplace/addons/:id/purchase
 */
export const purchaseAPI = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.cognito_id;

        // Check if the API exists
        const apiExists = await dbClient.query("SELECT * FROM marketplace_addons WHERE id = $1", [id]);
        if (apiExists.rows.length === 0) {
            return res.status(404).json({ error: "API not found" });
        }

        // Insert into purchases table
        const query = `
            INSERT INTO user_purchases (user_id, addon_id, purchased_at)
            VALUES ($1, $2, NOW()) RETURNING *;
        `;
        const result = await dbClient.query(query, [user_id, id]);

        res.status(201).json({ message: "API purchased successfully!", data: result.rows[0] });
    } catch (error) {
        logger.error("❌ Error purchasing API:", error);
        res.status(500).json({ error: "Failed to complete purchase" });
    }
};

/**
 * ✅ Rate an API
 * @route POST /api/marketplace/addons/:id/review
 */
export const rateAPI = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, review } = req.body;
        const user_id = req.user.cognito_id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Invalid rating. Must be between 1 and 5." });
        }

        const query = `
            INSERT INTO marketplace_reviews (addon_id, user_id, rating, review, created_at)
            VALUES ($1, $2, $3, $4, NOW()) RETURNING *;
        `;

        const result = await dbClient.query(query, [id, user_id, rating, review || null]);

        res.status(201).json({ message: "Review submitted successfully", data: result.rows[0] });
    } catch (error) {
        logger.error("❌ Error submitting review:", error);
        res.status(500).json({ error: "Failed to submit review" });
    }
};
