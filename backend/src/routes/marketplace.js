// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/marketplaceRoutes.js

import express from "express";
import { Pool } from "pg";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// ✅ Initialize PostgreSQL Connection Pool
const dbPool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false, require: true },
});

// ✅ Ensure DB Connection
dbPool.connect()
    .then(() => console.log("✅ PostgreSQL Connected (Marketplace Routes)"))
    .catch(err => {
        console.error("❌ PostgreSQL Connection Error:", err.message);
        process.exit(1);
    });

/**
 * ✅ GET: Fetch All Marketplace Add-ons
 */
router.get("/addons", async (req, res) => {
    try {
        const result = await dbPool.query("SELECT * FROM marketplace_addons ORDER BY created_at DESC");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching marketplace add-ons:", error);
        res.status(500).json({ error: "Failed to retrieve add-ons." });
    }
});

/**
 * ✅ POST: Add a New Marketplace Add-on (Authenticated)
 */
router.post("/addons", requireAuth, async (req, res) => {
    try {
        const { name, description, type, api_url, username, password } = req.body;
        const added_by = req.user?.id || "unknown_user";

        if (!name || !description || !type) {
            return res.status(400).json({ error: "Missing required fields: name, description, or type." });
        }

        const result = await dbPool.query(
            `INSERT INTO marketplace_addons (name, description, type, api_url, username, password, added_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, description, type, api_url || null, username || null, password || null, added_by]
        );

        res.status(201).json({ message: "Add-on created successfully!", addon: result.rows[0] });
    } catch (error) {
        console.error("❌ Error adding marketplace add-on:", error);
        res.status(500).json({ error: "Failed to create add-on." });
    }
});

/**
 * ✅ GET: Fetch a Single Add-on by ID
 */
router.get("/addons/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbPool.query("SELECT * FROM marketplace_addons WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Add-on not found." });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("❌ Error fetching add-on:", error);
        res.status(500).json({ error: "Failed to retrieve add-on." });
    }
});

/**
 * ✅ GET: Fetch Reviews for a Specific Add-on
 */
router.get("/addons/:id/reviews", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbPool.query(
            "SELECT * FROM marketplace_reviews WHERE addon_id = $1 ORDER BY created_at DESC",
            [id]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching reviews:", error);
        res.status(500).json({ error: "Failed to retrieve reviews." });
    }
});

/**
 * ✅ GET: Fetch All Reviews for All Add-ons
 */
router.get("/reviews", async (req, res) => {
    try {
        const result = await dbPool.query("SELECT * FROM marketplace_reviews ORDER BY created_at DESC");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching all reviews:", error);
        res.status(500).json({ error: "Failed to retrieve reviews." });
    }
});

/**
 * ✅ POST: Submit a Review for an Add-on (Authenticated)
 */
router.post("/addons/:id/reviews", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, review } = req.body;
        const user_id = req.user?.id || "unknown_user";

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Invalid rating. Must be between 1 and 5." });
        }

        const result = await dbPool.query(
            `INSERT INTO marketplace_reviews (addon_id, user_id, rating, review)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [id, user_id, rating, review || null]
        );

        res.status(201).json({ message: "Review added successfully!", review: result.rows[0] });
    } catch (error) {
        console.error("❌ Error submitting review:", error);
        res.status(500).json({ error: "Failed to add review." });
    }
});

/**
 * ✅ DELETE: Remove an Add-on (Admin Only)
 */
router.delete("/addons/:id", requireAuth, validateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await dbPool.query("DELETE FROM marketplace_addons WHERE id = $1 RETURNING *", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Add-on not found." });
        }

        res.status(200).json({ message: "Add-on removed successfully." });
    } catch (error) {
        console.error("❌ Error deleting add-on:", error);
        res.status(500).json({ error: "Failed to delete add-on." });
    }
});

/**
 * ✅ DELETE: Remove a Review (Admin Only)
 */
router.delete("/reviews/:id", requireAuth, validateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await dbPool.query("DELETE FROM marketplace_reviews WHERE id = $1 RETURNING *", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Review not found." });
        }

        res.status(200).json({ message: "Review deleted successfully." });
    } catch (error) {
        console.error("❌ Error deleting review:", error);
        res.status(500).json({ error: "Failed to delete review." });
    }
});

export default router;
