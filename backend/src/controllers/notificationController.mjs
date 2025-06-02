import { v4 as uuidv4 } from "uuid";  // For unique IDs
import pkg from 'pg';  // PostgreSQL Client
const { Client } = pkg;  // Destructure Client from 'pg'
import dotenv from "dotenv";  // Environment variables

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

// CREATE NOTIFICATION
export const createNotification = async (req, res) => {
    try {
        const { title, message, type, user_id } = req.body;

        if (!title || !message || !type || !user_id) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const query = `
            INSERT INTO notifications (id, title, message, type, user_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id, title, message, type, user_id, created_at;
        `;
        const result = await dbClient.query(query, [uuidv4(), title, message, type, user_id]);

        res.json({ message: "Notification created successfully", notification: result.rows[0] });
    } catch (error) {
        console.error("❌ Notification Creation Error:", error.message);
        res.status(500).json({ error: "Failed to create notification" });
    }
};

// FETCH NOTIFICATIONS
export const getNotifications = async (req, res) => {
    try {
        const { user_id } = req.query;

        const query = `
            SELECT id, title, message, type, user_id, created_at FROM notifications
            WHERE user_id = $1 ORDER BY created_at DESC;
        `;
        const result = await dbClient.query(query, [user_id]);

        res.json({ notifications: result.rows });
    } catch (error) {
        console.error("❌ Fetch Notifications Error:", error.message);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

// UPDATE NOTIFICATION
export const updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, type } = req.body;

        const query = `
            UPDATE notifications
            SET title = $1, message = $2, type = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING id, title, message, type, user_id, created_at, updated_at;
        `;
        const result = await dbClient.query(query, [title, message, type, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ message: "Notification updated successfully", notification: result.rows[0] });
    } catch (error) {
        console.error("❌ Update Notification Error:", error.message);
        res.status(500).json({ error: "Failed to update notification" });
    }
};

// DELETE NOTIFICATION
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            DELETE FROM notifications WHERE id = $1 RETURNING *;
        `;
        const result = await dbClient.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("❌ Delete Notification Error:", error.message);
        res.status(500).json({ error: "Failed to delete notification" });
    }
};

// SUBSCRIBE TO NOTIFICATIONS
export const subscribe = async (req, res) => {
    try {
        const { user_id, topic } = req.body;

        const query = `
            INSERT INTO subscriptions (id, user_id, topic, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, user_id, topic, created_at;
        `;
        const result = await dbClient.query(query, [uuidv4(), user_id, topic]);

        res.json({ message: "Subscribed to notifications successfully", subscription: result.rows[0] });
    } catch (error) {
        console.error("❌ Subscription Error:", error.message);
        res.status(500).json({ error: "Failed to subscribe to notifications" });
    }
};

// UNSUBSCRIBE FROM NOTIFICATIONS
export const unsubscribe = async (req, res) => {
    try {
        const { user_id, topic } = req.body;

        const query = `
            DELETE FROM subscriptions WHERE user_id = $1 AND topic = $2 RETURNING *;
        `;
        const result = await dbClient.query(query, [user_id, topic]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        res.json({ message: "Unsubscribed from notifications successfully" });
    } catch (error) {
        console.error("❌ Unsubscription Error:", error.message);
        res.status(500).json({ error: "Failed to unsubscribe from notifications" });
    }
};
