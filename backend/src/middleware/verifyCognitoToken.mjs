// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/middleware/verifyCognitoToken.js

import { CognitoJwtVerifier } from "aws-jwt-verify";
import { isTokenRevoked } from "../utils/tokenUtils.mjs";

// 📌 Singleton verifier initialized once after env vars are loaded
let verifierInstance = null;

/**
 * 🔐 Initializes Cognito verifier with strict configuration
 */
const initVerifier = () => {
  const { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } = process.env;

  if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
    console.error("[verifyCognitoToken] ❌ Missing Cognito environment variables", {
      COGNITO_USER_POOL_ID,
      COGNITO_CLIENT_ID,
    });
    throw new Error("Cognito environment configuration is incomplete.");
  }

  verifierInstance = CognitoJwtVerifier.create({
    userPoolId: COGNITO_USER_POOL_ID,
    clientId: COGNITO_CLIENT_ID,
    tokenUse: "access", // Enforces correct token type (access)
    scope: "aws.cognito.signin.user.admin", // Optional: tighten scope
  });

  console.log("✅ [verifyCognitoToken] Cognito JWT verifier initialized.");
};

/**
 * 🛡️ Enterprise-grade token validation middleware
 */
export const verifyCognitoToken = async (req, res, next) => {
  try {
    // ⏳ Lazy initialize verifier once
    if (!verifierInstance) {
      initVerifier();
    }

    // 🔍 Extract Authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        detail: "Missing or malformed Authorization header",
      });
    }

    const token = authHeader.split(" ")[1].trim();

    // 🚫 Block revoked tokens (logout, admin invalidation, etc.)
    if (isTokenRevoked(token)) {
      console.warn("[verifyCognitoToken] ❌ Revoked token attempt");
      return res.status(401).json({
        error: "Unauthorized",
        detail: "Token has been revoked",
      });
    }

    // ✅ Verify and extract payload
    const payload = await verifierInstance.verify(token);

    // 🎯 Attach decoded user info in consistent structure
    req.user = {
      id: payload.sub,
      email: payload.email || null,
      username: payload.username || null,
      role: payload["cognito:groups"]?.[0]?.toLowerCase() || "user",
      permissions: payload.scope?.split(" ") || [],
      exp: payload.exp,
      iss: payload.iss,
      aud: payload.client_id,
    };

    // 🧠 Optional: log high-privilege access attempts
    if (req.user.role === "admin") {
      console.info(`[verifyCognitoToken] 🔐 Admin token accepted: ${req.user.email}`);
    }

    return next();
  } catch (err) {
    console.error("[verifyCognitoToken] ❌ Token verification failed", {
      message: err.message,
      ip: req.ip,
      path: req.originalUrl,
      time: new Date().toISOString(),
    });

    return res.status(401).json({
      error: "Unauthorized",
      detail: "Token invalid or expired",
    });
  }
};
