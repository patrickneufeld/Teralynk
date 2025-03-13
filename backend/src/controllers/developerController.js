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

// REGISTER DEVELOPER
export const registerDeveloper = async (req, res) => {
    try {
        const { name, email, apiKey } = req.body;

        if (!name || !email || !apiKey) {
            return res.status(400).json({ error: "Name, email, and API key are required" });
        }

        const query = `
            INSERT INTO developers (id, name, email, api_key, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), name, email, apiKey]);

        res.json({ message: "Developer registered successfully", developer: result.rows[0] });
    } catch (error) {
        console.error("❌ Register Developer Error:", error.message);
        res.status(500).json({ error: "Failed to register developer" });
    }
};

// FETCH ALL DEVELOPERS
export const getDevelopers = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM developers ORDER BY created_at DESC");
        res.json({ developers: result.rows });
    } catch (error) {
        console.error("❌ Fetch Developers Error:", error.message);
        res.status(500).json({ error: "Failed to fetch developers" });
    }
};

// FETCH A SINGLE DEVELOPER BY ID
export const getDeveloperById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("SELECT * FROM developers WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Developer not found" });
        }

        res.json({ developer: result.rows[0] });
    } catch (error) {
        console.error("❌ Fetch Developer Error:", error.message);
        res.status(500).json({ error: "Failed to fetch developer" });
    }
};

// UPDATE DEVELOPER
export const updateDeveloper = async (req, res) => {
    const { id } = req.params;
    const { name, email, apiKey } = req.body;
    try {
        const query = `
            UPDATE developers 
            SET name = $1, email = $2, api_key = $3, updated_at = NOW()
            WHERE id = $4 
            RETURNING *;
        `;

        const result = await dbClient.query(query, [name, email, apiKey, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Developer not found" });
        }

        res.json({ message: "Developer updated successfully", developer: result.rows[0] });
    } catch (error) {
        console.error("❌ Update Developer Error:", error.message);
        res.status(500).json({ error: "Failed to update developer" });
    }
};

// DELETE DEVELOPER
export const deleteDeveloper = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("DELETE FROM developers WHERE id = $1 RETURNING *;", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Developer not found" });
        }

        res.json({ message: "Developer deleted successfully", developer: result.rows[0] });
    } catch (error) {
        console.error("❌ Delete Developer Error:", error.message);
        res.status(500).json({ error: "Failed to delete developer" });
    }
};
