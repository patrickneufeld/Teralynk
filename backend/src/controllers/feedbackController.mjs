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

// SUBMIT FEEDBACK
export const submitFeedback = async (req, res) => {
    try {
        const { user_id, feedback } = req.body;

        if (!user_id || !feedback) {
            return res.status(400).json({ error: "User ID and feedback are required" });
        }

        const query = `
            INSERT INTO feedback (id, user_id, feedback, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), user_id, feedback]);

        res.json({ message: "Feedback submitted successfully", feedback: result.rows[0] });
    } catch (error) {
        console.error("❌ Submit Feedback Error:", error.message);
        res.status(500).json({ error: "Failed to submit feedback" });
    }
};

// FETCH FEEDBACK
export const fetchFeedback = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM feedback ORDER BY created_at DESC");
        res.json({ feedback: result.rows });
    } catch (error) {
        console.error("❌ Fetch Feedback Error:", error.message);
        res.status(500).json({ error: "Failed to fetch feedback" });
    }
};

// SUBMIT CONTACT REQUEST
export const submitContactRequest = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "Name, email, and message are required" });
        }

        const query = `
            INSERT INTO contact_requests (id, name, email, message, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), name, email, message]);

        res.json({ message: "Contact request submitted successfully", contactRequest: result.rows[0] });
    } catch (error) {
        console.error("❌ Submit Contact Request Error:", error.message);
        res.status(500).json({ error: "Failed to submit contact request" });
    }
};

// FETCH CONTACT REQUESTS
export const fetchContactRequests = async (req, res) => {
    try {
        const result = await dbClient.query("SELECT * FROM contact_requests ORDER BY created_at DESC");
        res.json({ contactRequests: result.rows });
    } catch (error) {
        console.error("❌ Fetch Contact Requests Error:", error.message);
        res.status(500).json({ error: "Failed to fetch contact requests" });
    }
};

// DELETE FEEDBACK
export const deleteFeedback = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("DELETE FROM feedback WHERE id = $1 RETURNING *;", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Feedback not found" });
        }

        res.json({ message: "Feedback deleted successfully", feedback: result.rows[0] });
    } catch (error) {
        console.error("❌ Delete Feedback Error:", error.message);
        res.status(500).json({ error: "Failed to delete feedback" });
    }
};

// DELETE CONTACT REQUEST
export const deleteContactRequest = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("DELETE FROM contact_requests WHERE id = $1 RETURNING *;", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Contact request not found" });
        }

        res.json({ message: "Contact request deleted successfully", contactRequest: result.rows[0] });
    } catch (error) {
        console.error("❌ Delete Contact Request Error:", error.message);
        res.status(500).json({ error: "Failed to delete contact request" });
    }
};
