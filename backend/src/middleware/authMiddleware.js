// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/middleware/authMiddleware.js

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { promisify } from "util";
import rateLimit from "express-rate-limit";

// ✅ Ensure Required Environment Variables Are Loaded
const { COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID, AWS_REGION } = process.env;
if (!COGNITO_CLIENT_ID || !COGNITO_USER_POOL_ID || !AWS_REGION) {
  console.error("❌ ERROR: Missing required Cognito environment variables.");
  process.exit(1);
}

// ✅ Constants for Cognito JWT Verification
const JWT_AUDIENCE = COGNITO_CLIENT_ID;
const COGNITO_POOL_ID = COGNITO_USER_POOL_ID;
const COGNITO_REGION = AWS_REGION;

// ✅ JWKS URL for Cognito
const JWKS_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}/.well-known/jwks.json`;

// ✅ Token Blacklist (Prevents Reuse of Revoked Tokens)
const tokenBlacklist = new Set();

// ✅ Setup JWKS Client with Caching and Rate Limits
const jwksClientInstance = jwksClient({
  jwksUri: JWKS_URL,
  cache: true,
  rateLimit: true,
  cacheMaxEntries: 20, // Increase cache limit
  cacheMaxAge: 1800000, // Cache keys for 30 minutes
});

/**
 * Retrieves Cognito Signing Key and Verifies JWT Token
 * @param {string} token - JWT Token
 * @returns {Promise<Object>} - Decoded Token
 */
const verifyToken = async (token) => {
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

  return await promisify(jwt.verify)(token, signingKey, {
    audience: JWT_AUDIENCE,
    issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}`,
    algorithms: ["RS256"],
  });
};

/**
 * Middleware to Protect API Routes (Requires Valid Token)
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ error: "Unauthorized: Token revoked" });
    }

    const decodedToken = await verifyToken(token);

    // ✅ Attach Decoded User Information
    req.user = {
      id: decodedToken.sub,
      email: decodedToken.email || "",
      role: decodedToken["cognito:groups"]?.[0] || "Viewer",
      permissions: decodedToken.scope ? decodedToken.scope.split(" ") : [],
    };

    next();
  } catch (error) {
    console.error(`❌ Authentication Error from IP ${req.ip}:`, error.message);
    res.status(401).json({ error: "Unauthorized: Invalid or expired token." });
  }
};

/**
 * Logs Out User and Revokes Token
 */
const logout = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    tokenBlacklist.add(token);
  }
  res.json({ message: "Logout successful. Token revoked." });
};

/**
 * ✅ Rate Limiting Middleware (Prevents Excessive Requests)
 */
const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Limit each IP to 15 requests per window
  message: "Too many authentication attempts. Please try again later.",
});

/**
 * ✅ Security Headers Middleware (Prevents CSRF & XSS)
 */
const setSecurityHeaders = (req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
};

/**
 * Admin Middleware (Protects Routes for Admin Only)
 * This middleware checks if the user has an "Admin" role.
 */
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    return next();
  } else {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
};

export { requireAuth, logout, authRateLimiter, setSecurityHeaders, requireAdmin };
