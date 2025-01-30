// File Path: backend/api/chatFileRoutes.js

const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const openai = require("../config/openaiConfig");
const { validateFilePath, rateLimiter } = require("../middleware/commonMiddleware"); // Add reusable middleware
const router = express.Router();

// Directory containing files
const FILES_DIR = path.join(__dirname, "../files");

/**
 * Route: Search, Update, and Rename Files
 */
router.post(
  "/search-update",
  rateLimiter, // Apply rate limiting
  async (req, res, next) => {
    const { query, replaceText, newText, newFileName, aiGroup } = req.body;

    if (!query || !replaceText || !newText || !newFileName) {
      return res.status(400).json({
        success: false,
        error: "Query, replaceText, newText, and newFileName are required.",
      });
    }

    try {
      // Step 1: List all files in the directory
      const files = await fs.readdir(FILES_DIR);

      // Step 2: Use ChatGPT or AI group to search for matching files
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an assistant that helps find files based on their content or metadata.",
          },
          {
            role: "user",
            content: `Find files matching this query: "${query}". Available files: ${JSON.stringify(
              files
            )}. Querying AI Group: ${aiGroup || "default"}.`,
          },
        ],
      });

      const matchingFileName = response.data.choices[0].message.content.trim();

      if (!matchingFileName) {
        return res.status(404).json({ success: false, error: "No matching files found." });
      }

      const matchingFilePath = path.join(FILES_DIR, matchingFileName);

      // Step 3: Read the content of the matching file
      const fileContent = await fs.readFile(matchingFilePath, "utf-8");

      // Step 4: Replace text in the file content
      const updatedContent = fileContent.replace(new RegExp(replaceText, "g"), newText);

      // Step 5: Save the updated file with a new name
      const newFilePath = path.join(FILES_DIR, newFileName);
      await fs.writeFile(newFilePath, updatedContent, "utf-8");

      res.status(200).json({
        success: true,
        message: "File updated and saved successfully.",
        data: {
          matchingFile: matchingFileName,
          newFile: newFileName,
          newFilePath,
          metadata: {
            size: Buffer.byteLength(updatedContent, "utf8"),
            modified: new Date(),
          },
        },
      });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ success: false, error: "An error occurred while processing the file." });
    }
  }
);

module.exports = router;
