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

// FETCH PERFORMANCE METRICS
export const fetchPerformanceMetrics = async (req, res) => {
    try {
        const query = `
            SELECT metric_name, metric_value, created_at
            FROM performance_metrics
            ORDER BY created_at DESC;
        `;
        const result = await dbClient.query(query);

        res.json({ metrics: result.rows });
    } catch (error) {
        console.error("❌ Fetch Performance Metrics Error:", error.message);
        res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
};

// LOG PERFORMANCE DATA
export const logPerformanceData = async (req, res) => {
    try {
        const { metric_name, metric_value } = req.body;

        if (!metric_name || !metric_value) {
            return res.status(400).json({ error: "Metric name and value are required" });
        }

        const query = `
            INSERT INTO performance_metrics (id, metric_name, metric_value, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), metric_name, metric_value]);

        res.json({ message: "Performance data logged successfully", metric: result.rows[0] });
    } catch (error) {
        console.error("❌ Log Performance Data Error:", error.message);
        res.status(500).json({ error: "Failed to log performance data" });
    }
};

// FETCH PERFORMANCE LOGS
export const fetchPerformanceLogs = async (req, res) => {
    try {
        const query = `
            SELECT id, metric_name, metric_value, created_at
            FROM performance_metrics
            ORDER BY created_at DESC;
        `;
        const result = await dbClient.query(query);

        res.json({ logs: result.rows });
    } catch (error) {
        console.error("❌ Fetch Performance Logs Error:", error.message);
        res.status(500).json({ error: "Failed to fetch performance logs" });
    }
};

// FETCH ANALYTICS DATA
export const fetchAnalyticsData = async (req, res) => {
    try {
        const query = `
            SELECT event_name, event_count, created_at
            FROM analytics_events
            ORDER BY created_at DESC;
        `;
        const result = await dbClient.query(query);

        res.json({ analytics: result.rows });
    } catch (error) {
        console.error("❌ Fetch Analytics Data Error:", error.message);
        res.status(500).json({ error: "Failed to fetch analytics data" });
    }
};

// LOG ANALYTICS EVENT
export const logAnalyticsEvent = async (req, res) => {
    try {
        const { event_name, event_count } = req.body;

        if (!event_name || !event_count) {
            return res.status(400).json({ error: "Event name and count are required" });
        }

        const query = `
            INSERT INTO analytics_events (id, event_name, event_count, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *;
        `;
        const result = await dbClient.query(query, [uuidv4(), event_name, event_count]);

        res.json({ message: "Analytics event logged successfully", event: result.rows[0] });
    } catch (error) {
        console.error("❌ Log Analytics Event Error:", error.message);
        res.status(500).json({ error: "Failed to log analytics event" });
    }
};
