// ✅ Load AWS Secrets **BEFORE ANYTHING ELSE**
import getSecrets from "./src/config/config.js";

console.log("🔍 Fetching AWS Secrets from Secrets Manager...");
let secrets;

try {
  secrets = await getSecrets();
  if (!secrets || typeof secrets !== "object") {
    throw new Error("AWS Secrets Manager returned invalid data");
  }
} catch (error) {
  console.error("❌ Failed to load AWS Secrets:", error.message);
  process.exit(1);
}

// ✅ Assign Secrets to `process.env` and Handle Missing Keys
Object.keys(secrets).forEach((key) => {
  process.env[key] = secrets[key];
});

// ✅ Log Environment Variables After Secrets Are Loaded
console.log("🔍 ENV AFTER LOADING SECRETS:", {
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || "❌ MISSING",
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || "❌ MISSING",
  COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET ? "✔️ Loaded" : "❌ MISSING",
  PORT: process.env.PORT || "❌ MISSING",
  NODE_ENV: process.env.NODE_ENV || "❌ MISSING",
  AWS_REGION: process.env.AWS_REGION || "❌ MISSING",
  DB_HOST: process.env.DB_HOST || "❌ MISSING",
  DB_NAME: process.env.DB_NAME || "❌ MISSING",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✔️ Loaded" : "❌ MISSING",
});

// ✅ Categorize Environment Variables
const requiredEnvVars = [
  "PORT", "NODE_ENV", "AWS_REGION", "DB_HOST", "DB_NAME", "DB_USER",
  "DB_PASSWORD", "DB_PORT", "COGNITO_USER_POOL_ID", "COGNITO_CLIENT_ID",
  "COGNITO_CLIENT_SECRET", "JWT_SECRET"
];

const optionalEnvVars = [
  "VITE_API_URL", "FRONTEND_URL", "BUCKET_NAME", "DB_CONNECTION_STRING",
  "REDIS_URL", "RABBITMQ_URL", "ENABLE_RATE_LIMITING", "LOG_LEVEL",
  "LOG_STORAGE", "DEBUG", "AI_MODEL_NAME", "AI_PERFORMANCE_LOGGING",
  "AI_ERROR_TRACKING", "AI_SELF_OPTIMIZATION", "AI_LOGGING_STORAGE",
  "OPENAI_API_KEY", "EMAIL_NOTIFICATIONS_ENABLED", "NOTIFICATION_STORAGE",
  "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "S3_STORAGE_BUCKET",
  "S3_REGION", "FRONTEND_BASE_URL", "BACKEND_BASE_URL", "TROUBLESHOOTING_AI_URL",
  "TROUBLESHOOTING_AI_KEY", "CORS_ALLOWED_ORIGINS", "SECRET_NAME"
];

// ✅ Log Missing Required Keys
const missingKeys = [];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    missingKeys.push(key);
  }
});

if (missingKeys.length > 0) {
  console.warn(`⚠️ Missing Required ENV Variables: ${missingKeys.join(", ")}`);
  console.warn("⚠️ Proceeding with missing variables. Application behavior may be affected.");
} else {
  console.log("✅ All required API keys are loaded successfully.");
}

// ✅ Log Missing Optional Keys
optionalEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`ℹ️ Optional ENV Variable Missing: ${key}`);
  }
});

// ✅ Import Dependencies AFTER Loading Secrets
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import winston from "winston";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import pkg from "pg";
import rateLimit from "express-rate-limit";
import { requireAuth } from "./src/middleware/authMiddleware.js";
import formidable from "formidable";
import fs from "fs";

// ✅ Initialize Express App
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

// ✅ AWS Cognito Initialization
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
console.log(`✅ Cognito Connected. Using Client ID: ${process.env.COGNITO_CLIENT_ID}`);

// ✅ AWS S3 Client
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// ✅ PostgreSQL Database Connection
const { Client } = pkg;
const dbClient = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false, require: true },
});

try {
  await dbClient.connect();
  console.log(`✅ PostgreSQL Connected Successfully at: ${new Date().toISOString()}`);
} catch (err) {
  console.error("❌ PostgreSQL Connection Failed:", err.message);
  process.exit(1);
}

// ✅ Set up a basic rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});

// ✅ Create Winston Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log", level: "info" }),
  ],
});

// ✅ Middleware Configuration
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// ✅ Load Routes
const { default: authRoutes } = await import("./src/routes/authRoutes.js");
const { default: aiRoutes } = await import("./src/routes/aiRoutes.js");
const { default: adminRoutes } = await import("./src/routes/adminRoutes.js");
const { default: troubleshootingRoutes } = await import("./src/routes/troubleshootingRoutes.js");
const { default: marketplaceRoutes } = await import("./src/routes/marketplaceRoutes.js");
const { default: storageRoutes } = await import("./src/routes/storageRoutes.js");

// ✅ Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", requireAuth, aiRoutes);
app.use("/api/admin", requireAuth, adminRoutes);
app.use("/api/troubleshoot", requireAuth, troubleshootingRoutes);
app.use("/api/storage", requireAuth, storageRoutes);
app.use("/api/marketplace", requireAuth, marketplaceRoutes);

console.log("✅ Routes Loaded: [Auth, AI, Admin, Troubleshooting, Storage, Marketplace]");

// ✅ Basic Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "🚀 Teralynk Backend Running Successfully!" });
});

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error(`❌ Unexpected Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: "An unexpected server error occurred." });
});

// ✅ Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on ${process.env.FRONTEND_URL || `http://localhost:${PORT}`}`);
});

// ✅ Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down gracefully...");
  server.close(() => {
    dbClient.end();
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  server.close(() => {
    dbClient.end();
    process.exit(0);
  });
});
