// ✅ FILE: /backend/src/services/auth/auth.js

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import dotenv from "dotenv";

dotenv.config();

// ✅ Ensure Required Environment Variables Are Loaded
const { COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID, AWS_REGION, JWT_SECRET } = process.env;
if (!COGNITO_CLIENT_ID || !COGNITO_USER_POOL_ID || !AWS_REGION || !JWT_SECRET) {
  console.error("❌ ERROR: Missing required environment variables for authentication.");
  process.exit(1);
}

// ✅ Cognito Configuration
const JWT_AUDIENCE = COGNITO_CLIENT_ID;
const COGNITO_POOL_ID = COGNITO_USER_POOL_ID;
const COGNITO_REGION = AWS_REGION;

// ✅ JWKS URL for Cognito
const JWKS_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}/.well-known/jwks.json`;

// ✅ Setup JWKS Client for Verifying JWT Tokens
const jwksClientInstance = jwksClient({
  jwksUri: JWKS_URL,
  cache: true,
  rateLimit: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 900000, // 15 minutes
});

// ✅ Token Blacklist (Prevents Reuse of Revoked Tokens)
const tokenBlacklist = new Set();

/**
 * ✅ Retrieves Cognito Signing Key and Verifies JWT Token
 * @param {string} token - JWT Token
 * @returns {Promise<Object>} - Decoded Token
 */
const verifyToken = async (token) => {
  if (tokenBlacklist.has(token)) {
    throw new Error("Token is revoked.");
  }

  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header?.kid) {
    throw new Error("Invalid token format or missing key ID (kid).");
  }

  const signingKey = await new Promise((resolve, reject) => {
    jwksClientInstance.getSigningKey(decodedHeader.header.kid, (err, key) => {
      if (err) {
        console.error("❌ JWKS Key Fetch Error:", err);
        return reject(new Error("Failed to retrieve JWKS signing key"));
      }
      resolve(key.publicKey || key.rsaPublicKey);
    });
  });

  return jwt.verify(token, signingKey, {
    audience: JWT_AUDIENCE,
    issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}`,
    algorithms: ["RS256"],
  });
};

/**
 * ✅ Generates a New Access Token
 * @param {Object} userData - User Data for Token Payload
 * @returns {string} - New JWT Access Token
 */
const generateAccessToken = (userData) => {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: "1h" });
};

/**
 * ✅ Handles Token Refresh Logic
 * @param {string} refreshToken - Refresh Token from Cookie
 * @returns {Object} - New Access Token
 */
const refreshToken = async (refreshToken) => {
  if (!refreshToken || tokenBlacklist.has(refreshToken)) {
    throw new Error("Invalid or revoked refresh token.");
  }

  const decodedToken = jwt.verify(refreshToken, JWT_SECRET);
  const newAccessToken = generateAccessToken({ id: decodedToken.id, email: decodedToken.email });

  return { accessToken: newAccessToken };
};

/**
 * ✅ Blacklists a Token (Used for Logout)
 * @param {string} token - JWT Token to Revoke
 */
const revokeToken = (token) => {
  tokenBlacklist.add(token);
};

/**
 * ✅ Extracts User Role from JWT
 * @param {Object} decodedToken - Decoded JWT Token
 * @returns {string} - User Role
 */
const getUserRole = (decodedToken) => {
  return decodedToken["cognito:groups"]?.[0] || "Viewer";
};

/**
 * ✅ Middleware for Role-Based Access Control
 * @param {Array} allowedRoles - Array of Allowed Roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ error: "Access Denied: No role assigned." });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: "Access Denied: Insufficient permissions." });
      }
      next();
    } catch (error) {
      console.error("❌ Role Verification Error:", error);
      res.status(500).json({ error: "Failed to verify role." });
    }
  };
};

export { verifyToken, generateAccessToken, refreshToken, revokeToken, getUserRole, requireRole };
