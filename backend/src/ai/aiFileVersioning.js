// File Path: /Users/patrick/Projects/Teralynk/backend/src/ai/aiFileVersioning.js

const fs = require("fs");
const axios = require("axios");
const aiLearningManager = require("./aiLearningManager");

/**
 * Creates a new version of a file when changes are detected.
 * @param {string} userId - The user performing the versioning.
 * @param {string} fileId - The file being versioned.
 * @param {string} newContent - The new file content.
 */
const createFileVersion = async (userId, fileId, newContent) => {
  const versionId = `${fileId}-${Date.now()}`;

  // Save versioned file (this would typically be in a database)
  fs.writeFileSync(`./file_versions/${versionId}.txt`, newContent, "utf-8");

  // AI logs versioning event
  await aiLearningManager.logAILearning(userId, "file_versioned", {
    fileId,
    versionId,
  });

  return { versionId, message: "New version created successfully" };
};

/**
 * Retrieves a file's version history.
 * @param {string} userId - The user requesting history.
 * @param {string} fileId - The file ID.
 */
const getFileHistory = async (userId, fileId) => {
  // Mocked file history data (would be pulled from DB)
  return [
    { versionId: `${fileId}-1700000000000`, timestamp: "2025-01-01 12:00:00" },
    { versionId: `${fileId}-1700010000000`, timestamp: "2025-01-02 15:30:00" },
  ];
};

/**
 * Restores a file to a previous version.
 * @param {string} userId - The user restoring the file.
 * @param {string} fileId - The file ID.
 * @param {string} versionId - The version to restore.
 */
const restoreFileVersion = async (userId, fileId, versionId) => {
  const filePath = `./file_versions/${versionId}.txt`;

  if (!fs.existsSync(filePath)) {
    throw new Error("Version not found.");
  }

  const restoredContent = fs.readFileSync(filePath, "utf-8");

  // AI logs restoration event
  await aiLearningManager.logAILearning(userId, "file_restored", {
    fileId,
    versionId,
  });

  return { fileId, versionId, restoredContent };
};

/**
 * Compares two versions of a file and provides AI-driven insights.
 * @param {string} userId - The user comparing versions.
 * @param {string} fileId - The file ID.
 * @param {string} versionId1 - The first version ID.
 * @param {string} versionId2 - The second version ID.
 */
const compareFileVersions = async (userId, fileId, versionId1, versionId2) => {
  const filePath1 = `./file_versions/${versionId1}.txt`;
  const filePath2 = `./file_versions/${versionId2}.txt`;

  if (!fs.existsSync(filePath1) || !fs.existsSync(filePath2)) {
    throw new Error("One or both versions not found.");
  }

  const content1 = fs.readFileSync(filePath1, "utf-8");
  const content2 = fs.readFileSync(filePath2, "utf-8");

  // AI generates a comparison of the two versions
  const response = await axios.post(
    "https://api.openai.com/v1/completions",
    {
      model: "gpt-4",
      prompt: `Compare the following two versions of a file and summarize the key differences:\n\nVersion 1:\n${content1}\n\nVersion 2:\n${content2}`,
      max_tokens: 500,
      temperature: 0.3,
    },
    {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    }
  );

  // AI logs comparison event
  await aiLearningManager.logAILearning(userId, "file_compared", {
    fileId,
    versionId1,
    versionId2,
  });

  return { comparison: response.data.choices[0].text.trim() };
};

/**
 * AI automatically merges two file versions.
 * @param {string} userId - The user merging versions.
 * @param {string} fileId - The file ID.
 * @param {string} versionId1 - The first version ID.
 * @param {string} versionId2 - The second version ID.
 */
const mergeFileVersions = async (userId, fileId, versionId1, versionId2) => {
  const filePath1 = `./file_versions/${versionId1}.txt`;
  const filePath2 = `./file_versions/${versionId2}.txt`;

  if (!fs.existsSync(filePath1) || !fs.existsSync(filePath2)) {
    throw new Error("One or both versions not found.");
  }

  const content1 = fs.readFileSync(filePath1, "utf-8");
  const content2 = fs.readFileSync(filePath2, "utf-8");

  // AI merges the versions
  const response = await axios.post(
    "https://api.openai.com/v1/completions",
    {
      model: "gpt-4",
      prompt: `Merge the following two versions of a file into a single, clean version that includes the best content from both:\n\nVersion 1:\n${content1}\n\nVersion 2:\n${content2}`,
      max_tokens: 1000,
      temperature: 0.3,
    },
    {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    }
  );

  const mergedContent = response.data.choices[0].text.trim();
  const newVersionId = `${fileId}-${Date.now()}`;

  // Save the merged version
  fs.writeFileSync(`./file_versions/${newVersionId}.txt`, mergedContent, "utf-8");

  // AI logs merging event
  await aiLearningManager.logAILearning(userId, "file_merged", {
    fileId,
    versionId1,
    versionId2,
    newVersionId,
  });

  return { newVersionId, mergedContent };
};

module.exports = {
  createFileVersion,
  getFileHistory,
  restoreFileVersion,
  compareFileVersions,
  mergeFileVersions,
};
