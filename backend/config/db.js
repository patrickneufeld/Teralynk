// ✅ FILE: backend/config/db.js

const { CognitoIdentityProviderClient, AdminGetUserCommand, ListUserPoolsCommand } = require("@aws-sdk/client-cognito-identity-provider");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg"); // PostgreSQL connection
require("dotenv").config();

// ✅ Validate Critical Environment Variables
const requiredEnvVars = [
  "JWT_SECRET",
  "DB_CONNECTION_STRING",
  "COGNITO_USER_POOL_ID",
  "AWS_REGION"
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing critical environment variable: ${key}`);
    process.exit(1);
  }
});

// ✅ Initialize AWS Cognito (SDK v3)
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
console.log("✅ AWS Cognito initialized successfully.");

// ✅ PostgreSQL Connection (Using Pool for Efficient Querying)
const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout after 5s if a connection is not established
});

// ✅ Test PostgreSQL Connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("✅ PostgreSQL Connected Successfully at:", res.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    process.exit(1);
  }
};
connectDB();

/**
 * Gracefully Disconnect from DB (for server shutdown)
 */
const disconnectDB = async () => {
  try {
    await pool.end();
    console.log("✅ PostgreSQL Disconnected Successfully.");
  } catch (err) {
    console.error("❌ Error disconnecting PostgreSQL:", err.message);
  }
};

/**
 * Verify JWT Token
 * @param {string} token - JWT Token from the client
 * @returns {Promise<object>} - Decoded token object if valid
 */
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified successfully:", decoded);
    return decoded;
  } catch (error) {
    console.error("❌ Error verifying token:", error.message);
    throw new Error("Invalid token");
  }
};

/**
 * Fetch User Details from Cognito
 * @param {string} userId - User identifier (sub) from JWT
 * @returns {Promise<object>} - User details from Cognito
 */
const getUserDetailsFromCognito = async (userId) => {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: userId,
  };

  try {
    const response = await cognito.send(new AdminGetUserCommand(params));
    console.log("✅ User details fetched from Cognito:", response);
    return response;
  } catch (error) {
    console.error("❌ Error fetching user details from Cognito:", error.message);
    throw new Error("Failed to fetch user details");
  }
};

// ✅ Testing Cognito Connection (Optional)
if (process.env.NODE_ENV !== "production") {
  const testCognitoConnection = async () => {
    try {
      const response = await cognito.send(new ListUserPoolsCommand({ MaxResults: 10 }));
      console.log("✅ Successfully connected to Cognito:", response);
    } catch (err) {
      console.error("❌ Error connecting to Cognito:", err.message);
    }
  };
  testCognitoConnection();
}

module.exports = {
  pool, // PostgreSQL connection pool
  connectDB,
  disconnectDB,
  verifyToken,
  getUserDetailsFromCognito,
};
