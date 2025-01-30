// File Path: backend/config/db.js

const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose"); // MongoDB connection
require("dotenv").config();

// Validate critical environment variables
["JWT_SECRET", "DB_CONNECTION_STRING", "USER_POOL_ID", "AWS_REGION"].forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing critical environment variable: ${key}`);
    process.exit(1);
  }
});

// Initialize AWS Cognito
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION,
});

console.log("✅ AWS Cognito initialized successfully.");

// MongoDB Connection
mongoose
  .connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1); // Exit process if DB connection fails
  });

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
    console.error("❌ Error verifying token:", error);
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
    UserPoolId: process.env.USER_POOL_ID,
    Username: userId,
  };

  try {
    const response = await cognito.adminGetUser(params).promise();
    console.log("✅ User details fetched from Cognito:", response);
    return response;
  } catch (error) {
    console.error("❌ Error fetching user details from Cognito:", error);
    throw new Error("Failed to fetch user details");
  }
};

// Testing Cognito Connection (Optional)
const testCognitoConnection = () => {
  cognito.listUserPools({ MaxResults: 10 }, (err, data) => {
    if (err) {
      console.error("❌ Error connecting to Cognito:", err);
      process.exit(1);
    } else {
      console.log("✅ Successfully connected to Cognito:", data);
    }
  });
};

testCognitoConnection();

module.exports = {
  verifyToken,
  getUserDetailsFromCognito,
};
