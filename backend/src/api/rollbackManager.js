// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/api/rollbackManager.js

import fs from "fs";
import path from "path";

/**
 * ✅ Store Previous Version of a File Before Updating
 * @param {string} filePath - The file to back up
 */
export const storePreviousVersion = (filePath) => {
  try {
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`📁 Backup created: ${backupPath}`);
  } catch (error) {
    console.error("❌ Error storing previous file version:", error.message);
  }
};

/**
 * ✅ Rollback to Last Stable Version
 * @param {string} filePath - The file to restore
 */
export const rollbackToLastStable = (filePath) => {
  try {
    const backupPath = `${filePath}.backup`;
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
      console.log(`🔄 Rolled back to last stable version: ${filePath}`);
    } else {
      console.warn(`⚠️ No backup found for rollback: ${filePath}`);
    }
  } catch (error) {
    console.error("❌ Error rolling back file:", error.message);
  }
};
