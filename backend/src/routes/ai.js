// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/ai.js

const express = require("express");
const { processAIRequest, fetchAIHistory } = require("../controllers/aiController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ AI Processing Routes
router.post("/process", requireAuth, processAIRequest);  // Process AI Request
router.get("/history", requireAuth, fetchAIHistory);     // Fetch AI Query History

module.exports = router;
