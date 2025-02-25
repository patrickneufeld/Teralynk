// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { promisify } = require("util");

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

// ✅ Setup JWKS Client with Caching and Rate Limits
const jwksClientInstance = jwksClient({
  jwksUri: JWKS_URL,
  cache: true,
  rateLimit: true,
  cacheMaxEntries: 10, // Allow more cached keys
  cacheMaxAge: 900000, // Cache keys for 15 minutes
});

// ✅ Fetch Cognito Signing Key and Verify Token
const getSigningKey = async (kid) => {
  return new Promise((resolve, reject) => {
    jwksClientInstance.getSigningKey(kid, (err, key) => {
      if (err) {
        console.error("❌ JWKS Key Fetch Error:", err);
        return reject(new Error("Failed to retrieve JWKS signing key"));
      }
      resolve(key.publicKey || key.rsaPublicKey);
    });
  });
};

const verifyToken = async (token) => {
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header?.kid) {
    throw new Error("Invalid token format or missing key ID (kid).");
  }

  // Retrieve and validate signing key
  const signingKey = await getSigningKey(decodedHeader.header.kid);

  return await promisify(jwt.verify)(token, signingKey, {
    audience: JWT_AUDIENCE,
    issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}`,
    algorithms: ["RS256"],
  });
};

// ✅ Middleware for Protecting API Routes
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
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
    console.error("❌ Authentication Error:", error.message);
    res.status(401).json({ error: "Unauthorized: Invalid or expired token." });
  }
};

module.exports = { requireAuth };
