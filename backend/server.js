// Load environment variables
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const formidable = require("formidable");
const fs = require("fs");
const mongoose = require("mongoose");
const winston = require("winston");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("./config/db");
const { getStorageClient } = require("./config/dynamicStorageManager");
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Import AI performance tracking & troubleshooting APIs
const troubleshootingRoutes = require("./src/routes/troubleshootingRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const { evaluateAIPerformance, getAverageErrors } = require("./src/api/aiPerformance");

// Debug: Log critical environment variables (optional)
console.log("✅ ENV Variables Loaded");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("PORT:", process.env.PORT);

// Validate critical environment variables
[
  "AWS_REGION",
  "BUCKET_NAME",
  "JWT_SECRET",
  "PORT",
  "FRONTEND_URL",
  "DB_CONNECTION_STRING",
].forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing critical environment variable: ${key}`);
    process.exit(1);
  }
});

// Initialize MongoDB connection
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
app.use(express.json());

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

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

// Rate Limiting Configuration
if (process.env.ENABLE_RATE_LIMITING === "true") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: "Too many requests, please try again later.",
  });
  app.use(limiter);
}

// Middleware: JWT Authentication
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send("Unauthorized: No token provided");
  }
  try {
    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    logger.error("Invalid token:", err);
    res.status(401).send("Unauthorized: Invalid token");
  }
};

// AI Routes
app.use("/api/ai", aiRoutes);

// Troubleshooting Routes
app.use("/api/troubleshoot", troubleshootingRoutes);

// File Upload Endpoint
app.post("/api/files/upload", authenticate, (req, res, next) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      logger.error("File upload error:", err);
      return res.status(400).send("Error parsing upload form.");
    }

    const { userId } = req.user;
    const file = files.file;

    if (!file) {
      return res.status(400).send("No file provided.");
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).send("Invalid file type. Allowed: JPEG, PNG, PDF.");
    }

    const provider = fields.provider || "s3";
    const storageClient = getStorageClient(provider);

    const params = {
      Bucket: BUCKET_NAME,
      Key: `users/${userId}/${file.originalFilename}`,
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

// Generate Signed URL for File Download
app.post("/api/files/generate-link", authenticate, async (req, res, next) => {
  const { fileName, expiresIn = 3600 } = req.body;

  const params = {
    Bucket: BUCKET_NAME,
    Key: `users/${req.user.userId}/${fileName}`,
  };

  try {
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    res.send({ url });
  } catch (error) {
    logger.error("Error generating signed URL:", error);
    next(error);
  }
});

// List Files in S3
app.get("/api/files/list", authenticate, async (req, res, next) => {
  const { continuationToken, maxKeys = 10 } = req.query;

  const params = {
    Bucket: BUCKET_NAME,
    Prefix: `users/${req.user.userId}/`,
    MaxKeys: parseInt(maxKeys, 10),
    ContinuationToken: continuationToken || undefined,
  };

  try {
    const data = await s3Client.send(new ListObjectsV2Command(params));
    const files = data.Contents?.map((item) => item.Key.replace(`users/${req.user.userId}/`, "")) || [];

    res.send({
      files,
      continuationToken: data.NextContinuationToken || null,
    });
  } catch (error) {
    logger.error("Error listing files:", error);
    next(error);
  }
});

// AI Performance API Routes
app.post("/api/ai/evaluate", async (req, res) => {
  const { y_true, y_pred } = req.body;

  if (!y_true || !y_pred || y_true.length !== y_pred.length) {
    return res.status(400).json({ error: "Invalid input: y_true and y_pred must have the same length" });
  }

  const result = await evaluateAIPerformance(y_true, y_pred);

  if (result) {
    return res.json(result);
  } else {
    return res.status(500).json({ error: "AI Performance Evaluation Failed" });
  }
});

app.get("/api/ai/average-errors", async (req, res) => {
  const result = await getAverageErrors();

  if (result) {
    return res.json(result);
  } else {
    return res.status(500).json({ error: "Failed to fetch AI error statistics" });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`Error on ${req.method} ${req.originalUrl}: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).send({ error: "An unexpected error occurred" });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`🚀 Teralynk backend running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

module.exports = app;
