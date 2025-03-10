import express from "express";

const router = express.Router();

/**
 * ✅ GET /api/secrets/teralynk/env
 * Public route to expose selected frontend-safe environment variables.
 */
router.get("/teralynk/env", (req, res) => {
  try {
    const allowedEnv = {
      VITE_API_URL: process.env.VITE_API_URL || "http://localhost:5001",
      FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
      VITE_AWS_REGION: process.env.AWS_REGION,
      VITE_COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
      VITE_COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
      VITE_XAI_API_KEY: process.env.XAI_API_KEY || "", // Safe only if usage is client-authorized
    };

    res.status(200).json(allowedEnv);
  } catch (err) {
    console.error("❌ Failed to return frontend secrets:", err);
    res.status(500).json({ error: "Failed to fetch environment variables." });
  }
});

export default router;
