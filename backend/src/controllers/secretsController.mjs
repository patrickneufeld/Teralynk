// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/controllers/secretsController.js

/**
 * Safely fetch frontend-facing secrets for the client app (e.g., OAuth, URLs).
 * This prevents exposure of any sensitive or backend-only credentials.
 */
export const fetchFrontendSecrets = async (req, res) => {
    try {
      // ✅ Whitelist of frontend-safe secrets
      const safeSecrets = {
        FRONTEND_URL: process.env.FRONTEND_URL,
        BACKEND_BASE_URL: process.env.BACKEND_BASE_URL,
        VITE_API_URL: process.env.API_URL,
        GOOGLE_DRIVE_CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID,
        GOOGLE_DRIVE_REDIRECT_URI: process.env.GOOGLE_DRIVE_REDIRECT_URI,
        DROPBOX_APP_KEY: process.env.DROPBOX_APP_KEY,
        COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
        COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
        COGNITO_AUTH_DOMAIN: process.env.COGNITO_AUTH_DOMAIN,
      };
  
      // ✅ Log any missing keys (but don't crash)
      const missingKeys = Object.entries(safeSecrets)
        .filter(([, value]) => !value)
        .map(([key]) => key);
  
      if (missingKeys.length > 0) {
        console.warn(
          `⚠️ Missing frontend secrets: ${missingKeys.join(", ")}`
        );
      }
  
      res.status(200).json(safeSecrets);
    } catch (error) {
      console.error("❌ Failed to fetch frontend secrets:", error);
      res.status(500).json({ error: "Secrets API failed" });
    }
  };
  