// ================================================
// ✅ Storage Controller
// File: /backend/src/controllers/storageController.mjs
// ================================================

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Client } from "pg";
import fs from "fs";
import path from "path";
import logger from "../config/logger.mjs";

// ✅ Initialize PostgreSQL Client
const dbClient = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false, require: true },
});

dbClient.connect().catch(err => {
  logger.error("❌ PostgreSQL Connection Error:", err.message);
});

// ✅ Initialize S3 Client
const s3Client = new S3Client({ region: process.env.AWS_REGION });

/**
 * ✅ Upload a File to Storage
 * @route POST /api/storage/upload
 */
export const uploadFile = async (req, res) => {
  try {
    const { userId } = req.auth;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const fileKey = `users/${userId}/${Date.now()}_${file.originalname}`;
    const uploadParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    await dbClient.query(
      "INSERT INTO user_files (user_id, file_name, file_key, created_at) VALUES ($1, $2, $3, NOW())",
      [userId, file.originalname, fileKey]
    );

    res.status(201).json({ message: "File uploaded successfully", fileKey });
  } catch (error) {
    logger.error("❌ File Upload Error:", error);
    res.status(500).json({ error: "File upload failed." });
  }
};

/**
 * ✅ List All User Files
 * @route GET /api/storage/files
 */
export const listUserFiles = async (req, res) => {
  try {
    const { userId } = req.auth;

    const result = await dbClient.query(
      "SELECT id, file_name, file_key, created_at FROM user_files WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json({ files: result.rows });
  } catch (error) {
    logger.error("❌ Error Fetching Files:", error);
    res.status(500).json({ error: "Failed to fetch files." });
  }
};

/**
 * ✅ Generate Secure Download Link for a File
 * @route GET /api/storage/download/:fileId
 */
export const getDownloadLink = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { fileId } = req.params;

    const result = await dbClient.query(
      "SELECT file_key FROM user_files WHERE id = $1 AND user_id = $2",
      [fileId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found." });
    }

    const fileKey = result.rows[0].file_key;

    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ downloadUrl: signedUrl });
  } catch (error) {
    logger.error("❌ Error Generating Download Link:", error);
    res.status(500).json({ error: "Failed to generate download link." });
  }
};

/**
 * ✅ Delete a File from Storage
 * @route DELETE /api/storage/delete/:fileId
 */
export const deleteFile = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { fileId } = req.params;

    const result = await dbClient.query(
      "SELECT file_key FROM user_files WHERE id = $1 AND user_id = $2",
      [fileId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found." });
    }

    const fileKey = result.rows[0].file_key;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileKey,
      })
    );

    await dbClient.query("DELETE FROM user_files WHERE id = $1", [fileId]);

    res.json({ message: "File deleted successfully." });
  } catch (error) {
    logger.error("❌ Error Deleting File:", error);
    res.status(500).json({ error: "Failed to delete file." });
  }
};

/**
 * ✅ Organize User Files (AI-Driven)
 * @route POST /api/storage/organize
 */
export const organizeFiles = async (req, res) => {
  try {
    const { userId } = req.auth;

    const files = await dbClient.query(
      "SELECT id, file_name FROM user_files WHERE user_id = $1",
      [userId]
    );

    if (files.rows.length === 0) {
      return res.status(404).json({ error: "No files found." });
    }

    // Placeholder for AI-driven categorization logic
    const organizedFiles = files.rows.map(file => ({
      id: file.id,
      fileName: file.file_name,
      category: "General", // AI determines the category dynamically
    }));

    res.json({ message: "Files organized successfully", organizedFiles });
  } catch (error) {
    logger.error("❌ Error Organizing Files:", error);
    res.status(500).json({ error: "Failed to organize files." });
  }
};
