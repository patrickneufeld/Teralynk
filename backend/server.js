// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/server.js

import express from "express"; // Use import for express
import dotenv from "dotenv"; // Use dotenv to load environment variables
import cors from "cors"; // Use cors for enabling cross-origin requests
import cookieParser from "cookie-parser"; // Use cookie-parser for handling cookies
import helmet from "helmet"; // Use helmet for basic security
import morgan from "morgan"; // Use morgan for logging requests
import formidable from "formidable"; // Use formidable for file uploads
import fs from "fs"; // Use fs to work with files
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"; // Use AWS Secrets Manager to manage secrets
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider"; // Use AWS Cognito
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // Use AWS S3 for file uploads
import pkg from 'pg'; const { Client } = pkg;
import rateLimit from "express-rate-limit"; // Use express-rate-limit for rate limiting
import { requireAuth } from "./src/middleware/authMiddleware.js"; // Corrected import for requireAuth middleware
import { getStorageClient } from "./src/config/dynamicStorageManager.js"; // Correct import for dynamicStorageManager

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5001; // Set port to the value in .env or fallback to 5001

// Load Secrets from AWS Secrets Manager
const secretsManagerClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

async function loadSecrets() {
    try {
        const secretResponse = await secretsManagerClient.send(
            new GetSecretValueCommand({ SecretId: process.env.SECRET_NAME })
        );
        const secrets = JSON.parse(secretResponse.SecretString);
        Object.assign(process.env, secrets); // Assign secrets to process.env
        console.log("✅ Secrets Loaded from AWS Secrets Manager.");
    } catch (error) {
        console.error("❌ AWS Secrets Manager Error:", error);
        process.exit(1);
    }
}

(async () => {
    await loadSecrets();
    console.log("✅ ENV Variables Loaded in Server.js");

    // ✅ Check required ENV variables
    const requiredEnvVars = [
        "AWS_REGION",
        "S3_BUCKET_NAME",
        "JWT_SECRET",
        "COGNITO_USER_POOL_ID",
        "COGNITO_CLIENT_ID",
        "DB_HOST",
        "DB_USER",
        "DB_PASSWORD",
        "DB_NAME",
    ];

    requiredEnvVars.forEach((key) => {
        if (!process.env[key]) {
            console.error(`❌ Missing ENV Variable: ${key}`);
            process.exit(1);
        }
    });

    // ✅ AWS Cognito and S3 initialization
    const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    console.log("✅ AWS Cognito and S3 initialized successfully.");

    // ✅ PostgreSQL Database connection
    const dbClient = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432,
        ssl: { rejectUnauthorized: false, require: true },
    });

    await dbClient.connect()
        .then(() => console.log(`✅ PostgreSQL Connected Successfully at: ${new Date().toISOString()}`))
        .catch((err) => {
            console.error("❌ PostgreSQL Connection Failed:", err.message);
            process.exit(1);
        });

    // ✅ Middleware configuration
    app.use(cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
    }));
    app.use(express.json());
    app.use(cookieParser());
    app.use(morgan("dev"));
    app.use(helmet());

    // ✅ Route Files
    const { default: authRoutes } = await import("./src/routes/auth.js");
    const { default: aiRoutes } = await import("./src/routes/ai.js");
    const { default: adminRoutes } = await import("./src/routes/adminRoutes.js");
    const { default: troubleshootingRoutes } = await import("./src/routes/troubleshooting.js");
    const { default: marketplaceRoutes } = await import("./src/routes/marketplace.js");
    const { default: storageRoutes } = await import("./src/routes/storageRoutes.js");

    // ✅ Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/ai", requireAuth, aiRoutes);
    app.use("/api/admin", requireAuth, adminRoutes);
    app.use("/api/troubleshoot", requireAuth, troubleshootingRoutes);
    app.use("/api/storage", requireAuth, storageRoutes); // Updated to use storageRoutes
    app.use("/api/marketplace", requireAuth, marketplaceRoutes);

    console.log("✅ Routes Loaded: [Auth, AI, Admin, Troubleshooting, Storage, Marketplace]");

    // ✅ File Upload Route
    app.post("/api/files/upload", requireAuth, (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("❌ Form Parsing Error:", err);
                return res.status(400).json({ error: "Form parsing error." });
            }

            const file = files.file[0];
            const fileStream = fs.createReadStream(file.filepath);
            const uploadParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: file.originalFilename,
                Body: fileStream,
                ContentType: file.mimetype,
            };

            try {
                await s3Client.send(new PutObjectCommand(uploadParams));
                res.status(200).json({ message: "File uploaded successfully." });
            } catch (error) {
                console.error("❌ File upload failed:", error);
                res.status(500).json({ error: "File upload failed." });
            }
        });
    });

    // ✅ Basic Health Check Route
    app.get("/", (req, res) => {
        res.status(200).json({ message: "🚀 Teralynk Backend Running Successfully!" });
    });

    // ✅ 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: "Endpoint not found" });
    });

    // ✅ Global Error Handler
    app.use((err, req, res, next) => {
        console.error(`❌ Unexpected Error: ${err.message}`, { stack: err.stack });
        res.status(500).json({ error: "An unexpected server error occurred." });
    });

    // ✅ Server Initialization
    app.listen(process.env.PORT, () => {
        console.log(`🚀 Server running on ${process.env.FRONTEND_URL}`);
    });

    // ✅ PostgreSQL connection verification
    try {
        await dbClient.query('SELECT NOW()');
        console.log("✅ PostgreSQL Connected and Verified Successfully");
    } catch (error) {
        console.error("❌ PostgreSQL Verification Error:", error);
        process.exit(1);
    }
})();

export default app; // Use ES module export for app
