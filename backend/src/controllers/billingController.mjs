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

// SUBSCRIBE TO PLAN
export const subscribeToPlan = async (req, res) => {
    try {
        const { user_id, plan_id, start_date, end_date } = req.body;

        if (!user_id || !plan_id || !start_date || !end_date) {
            return res.status(400).json({ error: "User ID, plan ID, start date, and end date are required" });
        }

        const query = `
            INSERT INTO subscriptions (id, user_id, plan_id, start_date, end_date, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), user_id, plan_id, start_date, end_date]);

        res.json({ message: "Subscribed to plan successfully", subscription: result.rows[0] });
    } catch (error) {
        console.error("❌ Subscribe to Plan Error:", error.message);
        res.status(500).json({ error: "Failed to subscribe to plan" });
    }
};

// FETCH SUBSCRIPTIONS
export const fetchSubscriptions = async (req, res) => {
    try {
        const { user_id } = req.query;

        const query = `
            SELECT * FROM subscriptions
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        const result = await dbClient.query(query, [user_id]);

        res.json({ subscriptions: result.rows });
    } catch (error) {
        console.error("❌ Fetch Subscriptions Error:", error.message);
        res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
};

// PROCESS PAYMENT
export const processPayment = async (req, res) => {
    try {
        const { user_id, amount, payment_method, transaction_id } = req.body;

        if (!user_id || !amount || !payment_method || !transaction_id) {
            return res.status(400).json({ error: "User ID, amount, payment method, and transaction ID are required" });
        }

        const query = `
            INSERT INTO payments (id, user_id, amount, payment_method, transaction_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), user_id, amount, payment_method, transaction_id]);

        res.json({ message: "Payment processed successfully", payment: result.rows[0] });
    } catch (error) {
        console.error("❌ Process Payment Error:", error.message);
        res.status(500).json({ error: "Failed to process payment" });
    }
};

// FETCH PAYMENT HISTORY
export const fetchPaymentHistory = async (req, res) => {
    try {
        const { user_id } = req.query;

        const query = `
            SELECT * FROM payments
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        const result = await dbClient.query(query, [user_id]);

        res.json({ payments: result.rows });
    } catch (error) {
        console.error("❌ Fetch Payment History Error:", error.message);
        res.status(500).json({ error: "Failed to fetch payment history" });
    }
};

// CANCEL SUBSCRIPTION
export const cancelSubscription = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbClient.query("DELETE FROM subscriptions WHERE id = $1 RETURNING *;", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        res.json({ message: "Subscription canceled successfully", subscription: result.rows[0] });
    } catch (error) {
        console.error("❌ Cancel Subscription Error:", error.message);
        res.status(500).json({ error: "Failed to cancel subscription" });
    }
};
