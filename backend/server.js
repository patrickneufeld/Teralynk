// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/server.js

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const winston = require("winston");
const cookieParser = require("cookie-parser");
const formidable = require("formidable");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { CognitoIdentityProviderClient } = require("@aws-sdk/client-cognito-identity-provider");
const { Client } = require("pg");
const path = require("path");
const { requireAuth } = require("./src/middleware/authMiddleware");
const { getStorageClient } = require("./src/config/dynamicStorageManager");

// ✅ Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Load AWS Secrets Manager Configuration
const secretsManagerClient = new SecretsManagerClient({ region: "us-east-1" });

async function loadSecrets() {
    try {
        const data = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: "teralynk/env" }));
        const secrets = JSON.parse(data.SecretString);
        process.env = { ...process.env, ...secrets };
        console.log("✅ Secrets Loaded from AWS Secrets Manager.");
    } catch (err) {
        console.error("❌ ERROR: Failed to load secrets from AWS Secrets Manager.", err);
        process.exit(1);
    }
}

// ✅ Ensure secrets are loaded before starting the app
(async () => {
    await loadSecrets();

    // ✅ Validate Required Environment Variables
    console.log("✅ ENV Variables Loaded in Server.js");

    const requiredEnvVars = [
        "AWS_REGION",
        "BUCKET_NAME",
        "JWT_SECRET",
        "PORT",
        "FRONTEND_URL",
        "DB_HOST",
        "DB_USER",
        "DB_PASSWORD",
        "DB_NAME",
        "COGNITO_USER_POOL_ID",
        "COGNITO_CLIENT_ID",
        "COGNITO_CLIENT_SECRET",
    ];

    requiredEnvVars.forEach((key) => {
        if (!process.env[key]) {
            console.error(`❌ ERROR: Missing required environment variable: ${key}`);
            process.exit(1);
        }
    });

    // ✅ Initialize AWS Services
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
    console.log("✅ AWS Cognito and S3 initialized successfully.");

    // ✅ Initialize PostgreSQL Connection
    const dbClient = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432,
        ssl: { rejectUnauthorized: false, require: true },
    });

    dbClient.connect()
        .then(() => console.log(`✅ PostgreSQL Connected Successfully at: ${new Date().toISOString()}`))
        .catch((err) => {
            console.error("❌ PostgreSQL Connection Failed:", err.message);
            process.exit(1);
        });

    // ✅ Middleware
    app.use(cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }));

    app.use(express.json());
    app.use(morgan("dev"));
    app.use(helmet());
    app.use(cookieParser()); // ✅ Ensure cookie parser is used

    // ✅ Set Up Logging with Winston
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

    // ✅ Rate Limiting Middleware
    if (process.env.ENABLE_RATE_LIMITING === "true") {
        app.use(
            rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 100,
                message: "Too many requests, please try again later.",
            })
        );
    }

    // ✅ Import API Routes
    const authRoutes = require("./src/routes/auth");
    const aiRoutes = require("./src/routes/ai");
    const adminRoutes = require("./src/routes/admin");
    const troubleshootingRoutes = require("./src/routes/troubleshootingRoutes");
    const storageRoutes = require("./src/routes/storage");
    const marketplaceRoutes = require("./src/routes/marketplace");

    // ✅ Register API Endpoints
    app.use("/api/auth", authRoutes);
    app.use("/api/ai", requireAuth, aiRoutes);
    app.use("/api/admin", requireAuth, adminRoutes);
    app.use("/api/troubleshoot", requireAuth, troubleshootingRoutes);
    app.use("/api/storage", requireAuth, storageRoutes);
    app.use("/api/marketplace", requireAuth, marketplaceRoutes);

    console.log("✅ Routes Loaded: [ Auth, AI, Admin, Troubleshooting, Storage, Marketplace ]");

    // ✅ File Upload Endpoint
    app.post("/api/files/upload", requireAuth, (req, res, next) => {
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
                Bucket: process.env.BUCKET_NAME,
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

    // ✅ Health Check Endpoint
    app.get("/", (req, res) => {
        res.status(200).json({ message: "Teralynk Backend is Running 🚀" });
    });

    // ✅ Catch-All for Unhandled Routes
    app.use((req, res) => {
        console.error(`❌ 404 ERROR: Route not found - ${req.method} ${req.url}`);
        res.status(404).json({ message: "Endpoint not found" });
    });

    // ✅ Global Error Handler
    app.use((err, req, res, next) => {
        logger.error(`Error on ${req.method} ${req.originalUrl}: ${err.message}`, { stack: err.stack });
        res.status(err.status || 500).json({ error: "An unexpected error occurred" });
    });

    // ✅ Start Server
    app.listen(PORT, () => {
        logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });

    module.exports = app;
})();
