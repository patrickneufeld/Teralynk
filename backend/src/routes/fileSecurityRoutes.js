// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/fileSecurityRoutes.js

import express from "express";
const { authenticate } = require("../middleware/authMiddleware");
import aiFileSecurity from "../ai/aiFileSecurity";
import aiLearningManager from "../ai/aiLearningManager";

const router = express.Router();

/**
 * Route: POST /api/files/set-permissions
 * Description: AI dynamically assigns file permissions based on roles & activity.
 */
router.post("/set-permissions", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId, permissions } = req.body;

  if (!fileId || !permissions) {
    return res.status(400).json({ error: "File ID and permissions are required." });
  }

  try {
    console.log(`🔐 AI Managing Permissions for File: ${fileId}`);

    // AI dynamically sets file access permissions
    const updatedPermissions = await aiFileSecurity.setFilePermissions(userId, fileId, permissions);

    // Log AI learning from permission updates
    await aiLearningManager.logAILearning(userId, "file_permissions_updated", { fileId, updatedPermissions });

    res.status(200).json({ message: "File permissions updated successfully", updatedPermissions });
  } catch (error) {
    console.error("Error setting file permissions:", error.message);
    res.status(500).json({ error: "Failed to update file permissions." });
  }
});

/**
 * Route: GET /api/files/get-permissions
 * Description: Retrieve current file permissions.
 */
router.get("/get-permissions", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`🔍 AI Fetching Permissions for File: ${fileId}`);

    // AI retrieves the current file access permissions
    const filePermissions = await aiFileSecurity.getFilePermissions(userId, fileId);

    res.status(200).json({ message: "File permissions retrieved successfully", filePermissions });
  } catch (error) {
    console.error("Error retrieving file permissions:", error.message);
    res.status(500).json({ error: "Failed to retrieve file permissions." });
  }
});

/**
 * Route: POST /api/files/encrypt
 * Description: AI encrypts a file for enhanced security.
 */
router.post("/encrypt", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`🔒 AI Encrypting File: ${fileId}`);

    // AI encrypts the file for secure storage & sharing
    const encryptionInfo = await aiFileSecurity.encryptFile(userId, fileId);

    // Log AI learning from encryption
    await aiLearningManager.logAILearning(userId, "file_encrypted", { fileId, encryptionInfo });

    res.status(200).json({ message: "File encrypted successfully", encryptionInfo });
  } catch (error) {
    console.error("Error encrypting file:", error.message);
    res.status(500).json({ error: "Failed to encrypt file." });
  }
});

/**
 * Route: POST /api/files/decrypt
 * Description: AI decrypts a file for authorized access.
 */
router.post("/decrypt", authenticate, async (req, res) => {
  const { userId } = req.user;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required." });
  }

  try {
    console.log(`🔓 AI Decrypting File: ${fileId}`);

    // AI decrypts the file for authorized access
    const decryptionInfo = await aiFileSecurity.decryptFile(userId, fileId);

    res.status(200).json({ message: "File decrypted successfully", decryptionInfo });
  } catch (error) {
    console.error("Error decrypting file:", error.message);
    res.status(500).json({ error: "Failed to decrypt file." });
  }
});

/**
 * Route: GET /api/files/detect-anomalies
 * Description: AI scans for unusual access patterns and security risks.
 */
router.get("/detect-anomalies", authenticate, async (req, res) => {
  const { userId } = req.user;

  try {
    console.log(`🚨 AI Scanning for File Access Anomalies`);

    // AI detects anomalies in file access behavior
    const anomalyReport = await aiFileSecurity.detectAnomalies(userId);

    res.status(200).json({ message: "Anomaly detection completed", anomalyReport });
  } catch (error) {
    console.error("Error detecting anomalies:", error.message);
    res.status(500).json({ error: "Failed to detect anomalies." });
  }
});

module.exports = router;
