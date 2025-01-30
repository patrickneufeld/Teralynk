// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/troubleshootingRoutes.js

const express = require("express");
const aiTroubleshooter = require("../ai/aiTroubleshooter");

const router = express.Router();

/**
 * Route: POST /api/troubleshoot/project
 * Description: Debug an entire project directory
 */
router.post("/project", async (req, res) => {
  const { projectPath, description } = req.body;

  if (!projectPath) {
    return res.status(400).json({ error: "Project path is required." });
  }

  try {
    // Call the AI troubleshooter to debug the project
    const result = await aiTroubleshooter.debugCode({ projectPath, description });
    res.status(200).json({ result });
  } catch (err) {
    console.error("Error during project debugging:", err.message);
    res.status(500).json({ error: "AI debugging failed." });
  }
});

/**
 * Route: GET /api/troubleshoot/test
 * Description: Test the troubleshooting API
 */
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Troubleshooting routes are working correctly!" });
});

module.exports = router;
