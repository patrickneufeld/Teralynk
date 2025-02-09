// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/server.js

const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

console.log("✅ ENV Variables Loaded in Server.js");
console.log("COGNITO_USER_POOL_ID:", process.env.COGNITO_USER_POOL_ID || "❌ Not Loaded");

// Import dependencies
const cors = require("cors");
const formidable = require("formidable");
const fs = require("fs");
const mongoose = require("mongoose");
const winston = require("winston");
const rateLimit = require("express-rate-limit");
const { verifyToken } = require("./config/db");
const { getStorageClient } = require("./config/dynamicStorageManager");
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Import Routes
const troubleshootingRoutes = require("./src/routes/troubleshootingRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

// ✅ Debug Log for Route Imports
console.log("✅ Routes Loaded: [ AI, Troubleshooting, Admin ]");

// Validate Required Environment Variables
[
  "AWS_REGION",
  "BUCKET_NAME",
  "JWT_SECRET",
  "PORT",
  "FRONTEND_URL",
  "DB_CONNECTION_STRING",
  "COGNITO_USER_POOL_ID",
  "COGNITO_CLIENT_ID",
  "COGNITO_CLIENT_SECRET"
].forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing critical environment variable: ${key}`);
    process.exit(1);
  }
});

// Initialize MongoDB Connection
mongoose
  .connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

// Initialize AWS S3 Client
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Configure CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Setup Logger using Winston
const logger = winston.createLogger({
  level: process.env.DEBUG === "true" ? "debug" : "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.DEBUG === "true") {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// Rate Limiting Middleware
if (process.env.ENABLE_RATE_LIMITING === "true") {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: "Too many requests, please try again later.",
    })
  );
}

// Middleware: JWT Authentication
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  try {
    req.user = await verifyToken(token);
    next();
  } catch (err) {
    logger.error("Invalid token:", err);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// ✅ Register Routes in Correct Order
app.use("/api/ai", aiRoutes);
app.use("/api/troubleshoot", troubleshootingRoutes);
app.use("/api/admin", adminRoutes);

// ✅ File Upload Endpoint
app.post("/api/files/upload", authenticate, (req, res, next) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      logger.error("File upload error:", err);
      return res.status(400).send("Error parsing upload form.");
    }

    const file = files.file;
    if (!file) return res.status(400).send("No file provided.");

    const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).send("Invalid file type.");
    }

    const storageClient = getStorageClient(fields.provider || "s3");
    const params = {
      Bucket: BUCKET_NAME,
      Key: `users/${req.user.userId}/${file.originalFilename}`,
      Body: fs.createReadStream(file.filepath),
      ContentType: file.mimetype,
    };

    storageClient.client
      .send(new PutObjectCommand(params))
      .then(() => res.send({ message: "File uploaded successfully" }))
      .catch((error) => {
        logger.error("File upload error:", error);
        next(error);
      });
  });
});

// ✅ List S3 Files
app.get("/api/files/list", authenticate, async (req, res, next) => {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: `users/${req.user.userId}/`,
    MaxKeys: 10,
  };

  try {
    const data = await s3Client.send(new ListObjectsV2Command(params));
    const files = data.Contents?.map((item) => item.Key.replace(`users/${req.user.userId}/`, "")) || [];
    res.send({ files, continuationToken: data.NextContinuationToken || null });
  } catch (error) {
    logger.error("Error listing files:", error);
    next(error);
  }
});

// ✅ AI Performance Tracking
app.post("/api/ai/evaluate", async (req, res) => {
  const { y_true, y_pred } = req.body;
  if (!y_true || !y_pred || y_true.length !== y_pred.length) {
    return res.status(400).json({ error: "Invalid input: y_true and y_pred must have the same length" });
  }
  res.json(await evaluateAIPerformance(y_true, y_pred));
});

// ✅ Global Error Handler (Placed Last)
app.use((err, req, res, next) => {
  logger.error(`Error on ${req.method} ${req.originalUrl}: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({ error: "An unexpected error occurred" });
});

// ✅ Start Server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
