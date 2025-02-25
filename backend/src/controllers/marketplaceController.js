// ✅ FILE PATH: /Users/patrick/Projects/Teralynk/backend/src/controllers/marketplaceController.js

const { Client } = require("pg");

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
 * ✅ Fetch All APIs Available in the Marketplace
 * @route GET /api/marketplace/addons
 */
const getAllAPIs = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM marketplace_addons ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching APIs:", error);
        res.status(500).json({ message: "Error fetching APIs." });
    }
};

/**
 * ✅ Add a New API to the Marketplace
 * @route POST /api/marketplace/addons
 */
const addAPI = async (req, res) => {
    try {
        const { name, description, type, api_url, username, password } = req.body;
        const added_by = req.user.cognito_id;

        if (!name || !description || !type) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const query = `
            INSERT INTO marketplace_addons (name, description, type, api_url, username, password, added_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
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

        res.status(201).json({ message: "Add-on created successfully", addon: result.rows[0] });
    } catch (error) {
        console.error("❌ Error adding API:", error);
        res.status(500).json({ message: "Error adding API. Please try again." });
    }
};

/**
 * ✅ Purchase an API
 * @route POST /api/marketplace/addons/:id/purchase
 */
const purchaseAPI = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.cognito_id;

        // Check if the API exists
        const apiExists = await dbClient.query(
            "SELECT * FROM marketplace_addons WHERE id = $1",
            [id]
        );
        if (apiExists.rows.length === 0) {
            return res.status(404).json({ message: "API not found." });
        }

        // Insert into purchases table
        const query = `
            INSERT INTO user_purchases (user_id, addon_id)
            VALUES ($1, $2) RETURNING *;
        `;
        const result = await dbClient.query(query, [user_id, id]);

        res.status(201).json({ message: "API purchased successfully!", purchase: result.rows[0] });
    } catch (error) {
        console.error("❌ Error purchasing API:", error);
        res.status(500).json({ message: "Error purchasing API." });
    }
};

/**
 * ✅ Rate an API
 * @route POST /api/marketplace/addons/:id/review
 */
const rateAPI = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, review } = req.body;
        const user_id = req.user.cognito_id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Invalid rating. Must be between 1 and 5." });
        }

        const query = `
            INSERT INTO marketplace_reviews (addon_id, user_id, rating, review)
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;

        const result = await dbClient.query(query, [id, user_id, rating, review || null]);

        res.status(201).json({ message: "Review added successfully", review: result.rows[0] });
    } catch (error) {
        console.error("❌ Error rating API:", error);
        res.status(500).json({ message: "Error rating API." });
    }
};

module.exports = { getAllAPIs, addAPI, purchaseAPI, rateAPI };
