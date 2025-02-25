// File Path: backend/src/api/aiOptimizationAPI.js

const express = require("express");
const { optimizeAI } = require("../ai/aiAutoOptimizer");
const router = express.Router();

router.post("/optimize", (req, res) => {
    const { mse, mae, rse } = req.body;
    optimizeAI(mse, mae, rse);
    res.json({ message: "AI Optimization triggered" });
});

module.exports = router;
