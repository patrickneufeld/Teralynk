// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/troubleshootingRoutes.js

const express = require("express");
const aiTroubleshooter = require("../ai/aiTroubleshooter");
const troubleshootingLogger = require('../../utils/troubleshootingLogger');
const { requireAuth } = require("../middleware/authMiddleware");


const router = express.Router();

/**
 * ✅ Route: POST /api/troubleshoot/project
 * Description: AI analyzes an entire project directory and identifies issues.
 */
router.post("/project", requireAuth, async (req, res) => {
  const { projectPath, description } = req.body;

  if (!projectPath) {
    return res.status(400).json({ error: "Project path is required." });
  }

  try {
    const debugResult = await aiTroubleshooter.debugCode({ projectPath, description });

    troubleshootingLogger.logTroubleshooting("Project troubleshooting completed.", {
      projectPath,
      debugResult,
    });

    res.status(200).json({ message: "Project debugging completed successfully.", result: debugResult });
  } catch (err) {
    troubleshootingLogger.logTroubleshootingError("Error during project debugging", { error: err.message });
    res.status(500).json({ error: "AI debugging failed.", details: err.message });
  }
});

/**
 * ✅ Route: POST /api/troubleshoot/file
 * Description: AI analyzes and debugs a single file.
 */
router.post("/file", requireAuth, async (req, res) => {
  const { filePath, codeContent, description } = req.body;

  if (!filePath || !codeContent) {
    return res.status(400).json({ error: "File path and code content are required." });
  }

  try {
    const debugResult = await aiTroubleshooter.debugFile({ filePath, codeContent, description });

    troubleshootingLogger.logTroubleshooting("File troubleshooting completed.", {
      filePath,
      debugResult,
    });

    res.status(200).json({ message: "File debugging completed successfully.", result: debugResult });
  } catch (err) {
    troubleshootingLogger.logTroubleshootingError("Error during file debugging", { error: err.message });
    res.status(500).json({ error: "AI file debugging failed.", details: err.message });
  }
});

/**
 * ✅ Route: GET /api/troubleshoot/logs
 * Description: Retrieve all troubleshooting logs.
 */
router.get("/logs", requireAuth, async (req, res) => {
  try {
    const logs = await troubleshootingLogger.getTroubleshootingLogs();
    res.status(200).json({ message: "Troubleshooting logs retrieved successfully.", logs });
  } catch (err) {
    troubleshootingLogger.logTroubleshootingError("Error retrieving logs", { error: err.message });
    res.status(500).json({ error: "Failed to retrieve logs.", details: err.message });
  }
});

/**
 * ✅ Route: GET /api/troubleshoot/errors
 * Description: Retrieve all troubleshooting error logs.
 */
router.get("/errors", requireAuth, async (req, res) => {
  try {
    const logs = await troubleshootingLogger.getTroubleshootingErrorLogs();
    res.status(200).json({ message: "Troubleshooting error logs retrieved successfully.", logs });
  } catch (err) {
    troubleshootingLogger.logTroubleshootingError("Error retrieving error logs", { error: err.message });
    res.status(500).json({ error: "Failed to retrieve error logs.", details: err.message });
  }
});

/**
 * ✅ Route: GET /api/troubleshoot/ai-insights
 * Description: Retrieve AI-powered insights based on past logs.
 */
router.get("/ai-insights", requireAuth, async (req, res) => {
  try {
    const logs = await troubleshootingLogger.getTroubleshootingLogs();
    const insights = await troubleshootingLogger.getAIInsights(logs.join("\n"));

    res.status(200).json({ message: "AI insights retrieved successfully.", insights });
  } catch (err) {
    troubleshootingLogger.logTroubleshootingError("Error retrieving AI insights", { error: err.message });
    res.status(500).json({ error: "Failed to retrieve AI insights.", details: err.message });
  }
});

/**
 * ✅ Route: DELETE /api/troubleshoot/clear
 * Description: Clears all troubleshooting logs (admin-only action).
 */
router.delete("/clear", requireAuth, async (req, res) => {
  try {
    troubleshootingLogger.clearLogs();
    res.status(200).json({ message: "All troubleshooting logs cleared successfully." });
  } catch (err) {
    troubleshootingLogger.logTroubleshootingError("Error clearing logs", { error: err.message });
    res.status(500).json({ error: "Failed to clear logs.", details: err.message });
  }
});

/**
 * ✅ Route: GET /api/troubleshoot/test
 * Description: Simple test route to ensure troubleshooting API is working.
 */
router.get("/test", (req, res) => {
  res.status(200).json({ message: "✅ Troubleshooting API is working correctly!" });
});

module.exports = router;
