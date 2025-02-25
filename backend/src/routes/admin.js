// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/admin.js

const express = require("express");
const { fetchUsers, disableUser, enableUser, fetchSystemStatus, fetchMetrics, requireAdmin } = require("../controllers/adminController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Admin Management Routes
router.get("/users", requireAuth, requireAdmin, fetchUsers);         // Get list of users
router.post("/users/disable", requireAuth, requireAdmin, disableUser); // Disable a user
router.post("/users/enable", requireAuth, requireAdmin, enableUser);   // Enable a user

// ✅ System Status & Metrics
router.get("/system-status", requireAuth, requireAdmin, fetchSystemStatus); // Fetch system status
router.get("/metrics", requireAuth, requireAdmin, fetchMetrics);            // Fetch AI/Performance Metrics

module.exports = router;
