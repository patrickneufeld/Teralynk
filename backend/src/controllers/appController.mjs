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

// CREATE APP
export const createApp = async (req, res) => {
    try {
        const { name, description, category, url, createdBy } = req.body;

        if (!name || !description || !category || !url || !createdBy) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const query = `
            INSERT INTO apps (id, name, description, category, url, created_by, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), name, description, category, url, createdBy]);

        res.json({ message: "App created successfully", app: result.rows[0] });
    } catch (error) {
        console.error("❌ App Creation Error:", error.message);
        res.status(500).json({ error: "Failed to create app" });
    }
};

// FETCH ALL APPS
export const getApps = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM apps ORDER BY created_at DESC");
        res.json({ apps: result.rows });
    } catch (error) {
        console.error("❌ Fetch Apps Error:", error.message);
        res.status(500).json({ error: "Failed to fetch apps" });
    }
};

// FETCH A SINGLE APP BY ID
export const getAppById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("SELECT * FROM apps WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "App not found" });
        }

        res.json({ app: result.rows[0] });
    } catch (error) {
        console.error("❌ Fetch App Error:", error.message);
        res.status(500).json({ error: "Failed to fetch app" });
    }
};

// UPDATE APP
export const updateApp = async (req, res) => {
    const { id } = req.params;
    const { name, description, category, url, updatedBy } = req.body;
    try {
        const query = `
            UPDATE apps 
            SET name = $1, description = $2, category = $3, url = $4, updated_by = $5, updated_at = NOW()
            WHERE id = $6 
            RETURNING *;
        `;

        const result = await dbClient.query(query, [name, description, category, url, updatedBy, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "App not found" });
        }

        res.json({ message: "App updated successfully", app: result.rows[0] });
    } catch (error) {
        console.error("❌ Update App Error:", error.message);
        res.status(500).json({ error: "Failed to update app" });
    }
};

// DELETE APP
export const deleteApp = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("DELETE FROM apps WHERE id = $1 RETURNING *;", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "App not found" });
        }

        res.json({ message: "App deleted successfully", app: result.rows[0] });
    } catch (error) {
        console.error("❌ Delete App Error:", error.message);
        res.status(500).json({ error: "Failed to delete app" });
    }
};

// DEPLOY APP
export const deployApp = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("SELECT * FROM apps WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "App not found" });
        }

        const app = result.rows[0];
        // Assuming a function deployToMarketplace exists to handle app deployment
        const deploymentResult = await deployToMarketplace(app);

        res.json({ message: "App deployed successfully", result: deploymentResult });
    } catch (error) {
        console.error("❌ Deploy App Error:", error.message);
        res.status(500).json({ error: "Failed to deploy app" });
    }
};

// MANAGE APP VERSIONING
export const manageVersioning = async (req, res) => {
    try {
        const { app_id, new_version_data } = req.body;

        const query = `
            INSERT INTO app_versions (id, app_id, version_data, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), app_id, new_version_data]);

        res.json({ message: "App version created successfully", version: result.rows[0] });
    } catch (error) {
        console.error("❌ Manage Versioning Error:", error.message);
        res.status(500).json({ error: "Failed to manage app versioning" });
    }
};

// SUBMIT APP FEEDBACK
export const submitFeedback = async (req, res) => {
    try {
        const { app_id, user_id, feedback } = req.body;

        if (!app_id || !user_id || !feedback) {
            return res.status(400).json({ error: "App ID, user ID, and feedback are required" });
        }

        const query = `
            INSERT INTO app_feedback (id, app_id, user_id, feedback, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), app_id, user_id, feedback]);

        res.json({ message: "Feedback submitted successfully", feedback: result.rows[0] });
    } catch (error) {
        console.error("❌ Submit Feedback Error:", error.message);
        res.status(500).json({ error: "Failed to submit feedback" });
    }
};

// Assuming function deployToMarketplace exists for app deployment
const deployToMarketplace = async (app) => {
    // Placeholder function for deploying an app to the marketplace
    return { deployed: true, app_id: app.id };
};
