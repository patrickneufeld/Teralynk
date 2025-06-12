// File Path: backend/src/api/aiOptimizationAPI.mjs

import express from "express";
import { optimizeAI } from "../ai/aiAutoOptimizer.mjs";
const router = express.Router();

router.post("/optimize", (req, res) => {
    const { mse, mae, rse } = req.body;
    optimizeAI(mse, mae, rse);
    res.json({ message: "AI Optimization triggered" });
});

export default router;
