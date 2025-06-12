// File: /frontend/src/api/admin.js

/**
 * Middleware to verify if the user has admin privileges.
 * Applies strict checks to ensure only authorized admins proceed.
 */

export function verifyAdmin(req, res, next) {
    try {
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. No user context found.",
        });
      }
  
      // Validate user role
      if (!req.user.role || req.user.role.toLowerCase() !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }
  
      // All checks passed
      next();
    } catch (error) {
      console.error("🔒 Admin verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during admin verification.",
      });
    }
  }
  