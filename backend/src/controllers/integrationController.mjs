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

// CREATE INTEGRATION
export const createIntegration = async (req, res) => {
    try {
        const { name, description, type, config, addedBy } = req.body;

        if (!name || !description || !type || !config || !addedBy) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const query = `
            INSERT INTO integrations (id, name, description, type, config, added_by, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), name, description, type, JSON.stringify(config), addedBy]);

        res.json({ message: "Integration created successfully", integration: result.rows[0] });
    } catch (error) {
        console.error("❌ Integration Creation Error:", error.message);
        res.status(500).json({ error: "Failed to create integration" });
    }
};

// FETCH ALL INTEGRATIONS
export const getAllIntegrations = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM integrations ORDER BY created_at DESC");
        res.json({ integrations: result.rows });
    } catch (error) {
        console.error("❌ Fetch Integrations Error:", error.message);
        res.status(500).json({ error: "Failed to fetch integrations" });
    }
};

// FETCH A SINGLE INTEGRATION BY ID
export const getIntegrationById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("SELECT * FROM integrations WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Integration not found" });
        }

        res.json({ integration: result.rows[0] });
    } catch (error) {
        console.error("❌ Fetch Integration Error:", error.message);
        res.status(500).json({ error: "Failed to fetch integration" });
    }
};

// UPDATE INTEGRATION
export const updateIntegration = async (req, res) => {
    const { id } = req.params;
    const { name, description, type, config, updatedBy } = req.body;
    try {
        const query = `
            UPDATE integrations 
            SET name = $1, description = $2, type = $3, config = $4, updated_by = $5, updated_at = NOW()
            WHERE id = $6 
            RETURNING *;
        `;

        const result = await dbClient.query(query, [name, description, type, JSON.stringify(config), updatedBy, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Integration not found" });
        }

        res.json({ message: "Integration updated successfully", integration: result.rows[0] });
    } catch (error) {
        console.error("❌ Update Integration Error:", error.message);
        res.status(500).json({ error: "Failed to update integration" });
    }
};

// DELETE INTEGRATION
export const deleteIntegration = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("DELETE FROM integrations WHERE id = $1 RETURNING *;", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Integration not found" });
        }

        res.json({ message: "Integration deleted successfully", integration: result.rows[0] });
    } catch (error) {
        console.error("❌ Delete Integration Error:", error.message);
        res.status(500).json({ error: "Failed to delete integration" });
    }
};

// ENABLE INTEGRATION
export const enableIntegration = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query(
            "UPDATE integrations SET enabled = true WHERE id = $1 RETURNING *;",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Integration not found" });
        }

        res.json({ message: "Integration enabled successfully", integration: result.rows[0] });
    } catch (error) {
        console.error("❌ Enable Integration Error:", error.message);
        res.status(500).json({ error: "Failed to enable integration" });
    }
};

// DISABLE INTEGRATION
export const disableIntegration = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query(
            "UPDATE integrations SET enabled = false WHERE id = $1 RETURNING *;",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Integration not found" });
        }

        res.json({ message: "Integration disabled successfully", integration: result.rows[0] });
    } catch (error) {
        console.error("❌ Disable Integration Error:", error.message);
        res.status(500).json({ error: "Failed to disable integration" });
    }
};
