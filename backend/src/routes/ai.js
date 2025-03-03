import express from "express";
import { processAIRequest, fetchAIHistory, deleteAIHistory } from "../controllers/aiController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ AI Processing Routes
router.post("/process", requireAuth, processAIRequest);  // Process AI Request
router.get("/history", requireAuth, fetchAIHistory);     // Fetch AI Query History
router.delete("/history/:id", requireAuth, deleteAIHistory); // Delete AI Query History

export default router;
