// File: /Users/patrick/Projects/Teralynk/backend/src/api/rollback_manager.mjs

import express from "express";
import { MongoClient } from "mongodb.js";
import fs from "fs";
import path from "path";

const router = express.Router();
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = "teralynk_ai";
const client = new MongoClient(mongoUri);

let db, rollbackCollection;

// Connect to MongoDB
(async () => {
  await client.connect();
  db = client.db(dbName);
  rollbackCollection = db.collection("rollback_versions");
})();

/**
 * Get a list of past versions of modified files
 */
router.get("/rollback-versions", async (req, res) => {
  try {
    const versions = await rollbackCollection.find().sort({ timestamp: -1 }).toArray();
    res.json(versions);
  } catch (error) {
    console.error("Error fetching rollback versions:", error);
    res.status(500).json({ error: "Failed to retrieve rollback versions." });
  }
});

/**
 * Restore a past version of a file
 */
router.post("/rollback", async (req, res) => {
  const { filePath, timestamp } = req.body;

  try {
    const previousVersion = await rollbackCollection.findOne({ filePath, timestamp });

    if (!previousVersion) {
      return res.status(404).json({ error: "Rollback version not found." });
    }

    // Restore the previous content
    fs.writeFileSync(filePath, previousVersion.content, "utf-8");
    console.log(`🔄 Restored ${filePath} to version from ${timestamp}`);

    res.json({ success: true, message: `File restored successfully.` });
  } catch (error) {
    console.error("Error restoring rollback version:", error);
    res.status(500).json({ error: "Failed to restore rollback version." });
  }
});

export default router;
