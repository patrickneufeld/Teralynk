// File: /backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// JWT decoding for AWS Cognito
const verifyToken = promisify(jwt.verify);

// AWS Cognito User Pool Public Key URL
const COGNITO_POOL_ID = 'your-cognito-pool-id'; // Replace with your User Pool ID
const COGNITO_REGION = 'your-cognito-region';   // Replace with your AWS region

// Middleware to authenticate and extract the userId from the token
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token is required for authentication.' });
    }

    // Decode and verify JWT using Cognito's public keys
    const decoded = await verifyToken(token, COGNITO_POOL_ID);

    // Attach user details to the request object
    req.userId = decoded.sub; // Use Cognito's 'sub' field (unique user ID)
    req.role = decoded['cognito:groups'] || 'Viewer'; // Fetch user role from Cognito groups if available

    next(); // Continue to next middleware (RBAC)
  } catch (error) {
    console.error('Authentication Error:', error);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authenticateUser;
