//Users/patrick/Projects/Teralynk_Old/backend/src/controllers/fileController.js
import { v4 as uuidv4 } from "uuid";  // For unique IDs
import pkg from 'pg';  // PostgreSQL Client
const { Client } = pkg;  // Destructure Client from 'pg'
import dotenv from "dotenv";  // Environment variables
import fs from 'fs';  // File system module
import path from 'path';  // Path module for file paths
import multer from 'multer';  // Middleware for handling file uploads
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";  // AWS S3 Client

dotenv.config();

// Initialize PostgreSQL Client
const dbClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false, require: true },
});

dbClient.connect().catch(err => {
    console.error("❌ PostgreSQL Connection Error:", err.message);
});

// Initialize S3 Client
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Multer Storage Setup for Local Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Upload File to S3
const uploadFileToS3 = async (file) => {
    const fileStream = fs.createReadStream(file.path);
    const uploadParams = {
        Bucket: process.env.S3_BUCKET,
        Key: file.filename,
        Body: fileStream,
    };
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    fs.unlinkSync(file.path);  // Remove file from local storage after upload
};

// Download File from S3
const downloadFileFromS3 = async (fileKey) => {
    const downloadParams = {
        Bucket: process.env.S3_BUCKET,
        Key: fileKey,
    };
    const command = new GetObjectCommand(downloadParams);
    const { Body } = await s3Client.send(command);
    return Body;
};

// UPLOAD FILE
export const uploadFile = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        await uploadFileToS3(file);

        const query = `
            INSERT INTO files (id, filename, path, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, filename, created_at;
        `;
        const result = await dbClient.query(query, [uuidv4(), file.filename, file.path]);

        res.json({ message: "File uploaded successfully", file: result.rows[0] });
    } catch (error) {
        console.error("❌ File Upload Error:", error.message);
        res.status(500).json({ error: "File upload failed" });
    }
};

// DOWNLOAD FILE
export const downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbClient.query("SELECT filename, path FROM files WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "File not found" });
        }

        const file = result.rows[0];
        const fileStream = await downloadFileFromS3(file.path);

        res.setHeader('Content-Disposition', `attachment; filename=${file.filename}`);
        fileStream.pipe(res);
    } catch (error) {
        console.error("❌ File Download Error:", error.message);
        res.status(500).json({ error: "File download failed" });
    }
};

// DELETE FILE
export const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbClient.query("SELECT path FROM files WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "File not found" });
        }

        const file = result.rows[0];
        const deleteParams = {
            Bucket: process.env.S3_BUCKET,
            Key: file.path,
        };
        const command = new DeleteObjectCommand(deleteParams);
        await s3Client.send(command);

        await dbClient.query("DELETE FROM files WHERE id = $1", [id]);

        res.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("❌ File Deletion Error:", error.message);
        res.status(500).json({ error: "File deletion failed" });
    }
};

// SEARCH FILES
export const searchFiles = async (req, res) => {
    try {
        const { query } = req.body;
        const result = await dbClient.query(
            "SELECT id, filename, created_at FROM files WHERE filename ILIKE $1 ORDER BY created_at DESC",
            [`%${query}%`]
        );

        res.json({ files: result.rows });
    } catch (error) {
        console.error("❌ File Search Error:", error.message);
        res.status(500).json({ error: "File search failed" });
    }
};

// MANAGE FILE VERSIONING
export const manageVersioning = async (req, res) => {
    try {
        const { file_id, new_version_data } = req.body;
        const query = `
            INSERT INTO file_versions (id, file_id, version_data, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, file_id, created_at;
        `;
        const result = await dbClient.query(query, [uuidv4(), file_id, new_version_data]);

        res.json({ message: "File version created successfully", version: result.rows[0] });
    } catch (error) {
        console.error("❌ File Versioning Error:", error.message);
        res.status(500).json({ error: "File versioning failed" });
    }
};

// ADD FILE TAGS
export const addTags = async (req, res) => {
    try {
        const { file_id, tags } = req.body;
        const query = `
            INSERT INTO file_tags (id, file_id, tags, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, file_id, tags, created_at;
        `;
        const result = await dbClient.query(query, [uuidv4(), file_id, JSON.stringify(tags)]);

        res.json({ message: "Tags added successfully", tags: result.rows[0] });
    } catch (error) {
        console.error("❌ Adding Tags Error:", error.message);
        res.status(500).json({ error: "Failed to add tags" });
    }
};

// REMOVE FILE TAGS
export const removeTags = async (req, res) => {
    try {
        const { file_id, tag_id } = req.body;
        const query = `
            DELETE FROM file_tags WHERE file_id = $1 AND id = $2 RETURNING *;
        `;
        const result = await dbClient.query(query, [file_id, tag_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Tag not found" });
        }

        res.json({ message: "Tag removed successfully" });
    } catch (error) {
        console.error("❌ Removing Tags Error:", error.message);
        res.status(500).json({ error: "Failed to remove tag" });
    }
};
