import pkg from 'pg';  // Import the whole module
const { Client } = pkg;  // Destructure the Client from the imported module

import AWS from "aws-sdk";

// Create a Secrets Manager client
const secretsManager = new AWS.SecretsManager({
  region: "us-east-1",  // Replace with your region
});

// Function to fetch the database credentials from Secrets Manager
const getDbCredentials = async () => {
  const secretName = "your-secret-name"; // Replace with the secret name in AWS Secrets Manager

  try {
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();

    if (data.SecretString) {
      const secret = JSON.parse(data.SecretString);
      return secret; // Returns the secret (username, password, host, db name, etc.)
    } else {
      const buff = Buffer.from(data.SecretBinary, "base64");
      return JSON.parse(buff.toString("ascii"));
    }
  } catch (err) {
    console.error("Error fetching secret from Secrets Manager:", err);
    throw err; // Throw an error if the secret fetching fails
  }
};

// Initialize PostgreSQL client with the fetched credentials
const initializeDbConnection = async () => {
  const credentials = await getDbCredentials(); // Get credentials from Secrets Manager

  const client = new Client({
    user: credentials.username,
    host: credentials.host,
    database: credentials.dbname,
    password: credentials.password,
    port: 5432, // Default PostgreSQL port
  });

  await client.connect();

  return client;
};

// Example query function to get recent interactions from the database
export const getRecentInteractions = async () => {
  const client = await initializeDbConnection();
  try {
    const result = await client.query("SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 10");
    return result.rows;
  } catch (error) {
    console.error("❌ Error fetching recent interactions:", error.message);
    return [];
  } finally {
    await client.end();  // Close the database connection
  }
};

// Example of another function to log interactions (if needed)
export const logInteraction = async ({ userId, action, details, timestamp }) => {
  const client = await initializeDbConnection();
  try {
    const query = "INSERT INTO interactions (user_id, action, details, timestamp) VALUES ($1, $2, $3, $4)";
    await client.query(query, [userId, action, JSON.stringify(details), timestamp]);
  } catch (error) {
    console.error("❌ Error logging interaction:", error.message);
  } finally {
    await client.end();  // Close the database connection
  }
};
