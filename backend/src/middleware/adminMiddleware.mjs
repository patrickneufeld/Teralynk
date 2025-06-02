import jwt from "jsonwebtoken";
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import redis from "redis";
import dotenv from "dotenv";

dotenv.config();

// ✅ Initialize Redis client for caching admin role checks
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

// ✅ Initialize AWS Cognito Client
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

// ✅ Middleware to verify if a user is an admin
export const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // ✅ Verify JWT Token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: "Forbidden: Invalid token" });
    }

    const { sub: userId } = decodedToken;
    if (!userId) {
      return res.status(403).json({ error: "Forbidden: Invalid user" });
    }

    // ✅ Check Redis Cache for Admin Role
    redisClient.get(`user:${userId}:role`, async (err, cachedRole) => {
      if (err) {
        console.error("❌ Redis Read Error:", err);
      }
      
      if (cachedRole === "admin") {
        req.user = { id: userId, role: "admin" };
        return next();
      }

      // ✅ If not cached, fetch from AWS Cognito
      try {
        const userCommand = new GetUserCommand({ AccessToken: token });
        const userData = await cognitoClient.send(userCommand);

        const isAdmin = userData.UserAttributes.some(attr => attr.Name === "custom:role" && attr.Value === "admin");

        if (!isAdmin) {
          return res.status(403).json({ error: "Forbidden: Admin access required" });
        }

        // ✅ Cache admin role for future requests (expires in 1 hour)
        redisClient.setex(`user:${userId}:role`, 3600, "admin");

        req.user = { id: userId, role: "admin" };
        next();
      } catch (error) {
        console.error("❌ AWS Cognito Error:", error);
        res.status(500).json({ error: "Internal Server Error: Cognito validation failed" });
      }
    });

  } catch (error) {
    console.error("❌ Admin Middleware Error:", error);
    res.status(500).json({ error: "Internal Server Error: Unable to validate admin access" });
  }
};

// ✅ Middleware to verify role-based access (RBAC)
export const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== requiredRole) {
        return res.status(403).json({ error: `Forbidden: ${requiredRole} access required` });
      }
      next();
    } catch (error) {
      console.error("❌ Role-Based Middleware Error:", error);
      res.status(500).json({ error: "Internal Server Error: Unable to verify role" });
    }
  };
};

// ✅ Optional: Middleware for Custom Role Validation (e.g., validateAdmin)
export const validateAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin privileges required" });
    }
    next();
  } catch (error) {
    console.error("❌ Validation Error:", error);
    res.status(500).json({ error: "Internal Server Error: Unable to validate admin role" });
  }
};
