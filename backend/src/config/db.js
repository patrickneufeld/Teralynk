import pkg from "pg";
const { Client } = pkg;
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// ✅ Create a Secrets Manager Client
const secretsManager = new SecretsManagerClient({ region: "us-east-1" });

// ✅ Function to fetch the database credentials from AWS Secrets Manager
const getDbCredentials = async () => {
    const secretName = "postgres"; // Ensure this matches your AWS secret name

    try {
        console.log("🔍 Fetching database credentials from AWS Secrets Manager...");
        const secretResponse = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretName }));

        if (!secretResponse.SecretString) {
            throw new Error("❌ No secret string found in AWS Secrets Manager response");
        }

        const credentials = JSON.parse(secretResponse.SecretString);
        console.log("✅ Database credentials loaded successfully.");
        return credentials;
    } catch (error) {
        console.error("❌ Error fetching database credentials:", error.message);
        process.exit(1);
    }
};

// ✅ Initialize PostgreSQL client with AWS Secrets Manager credentials
const initializeDbConnection = async () => {
    const credentials = await getDbCredentials();

    const client = new Client({
        user: credentials.username,
        host: credentials.host,
        database: credentials.dbInstanceIdentifier, // ✅ Use the correct database identifier
        password: credentials.password,
        port: credentials.port || 5432, // Default PostgreSQL port
        ssl: { rejectUnauthorized: false }, // Allow SSL connection
    });

    try {
        await client.connect();
        console.log("✅ PostgreSQL Connected Successfully at:", new Date().toISOString());
    } catch (error) {
        console.error("❌ PostgreSQL Connection Failed:", error.message);
        process.exit(1);
    }

    return client;
};

// ✅ Persistent PostgreSQL Client
export const db = await initializeDbConnection();

// ✅ Example Query Function: Get Recent Interactions
export const getRecentInteractions = async () => {
    try {
        const result = await db.query("SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 10");
        return result.rows;
    } catch (error) {
        console.error("❌ Error fetching recent interactions:", error.message);
        return [];
    }
};

// ✅ Example Function: Log User Interactions
export const logInteraction = async ({ userId, action, details, timestamp }) => {
    try {
        const query = "INSERT INTO interactions (user_id, action, details, timestamp) VALUES ($1, $2, $3, $4)";
        await db.query(query, [userId, action, JSON.stringify(details), timestamp]);
    } catch (error) {
        console.error("❌ Error logging interaction:", error.message);
    }
};

// ✅ Export the Database Client for Use in Other Files
export default db;
