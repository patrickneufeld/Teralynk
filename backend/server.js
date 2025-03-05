import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import formidable from "formidable";
import fs from "fs";
import compression from "compression";
import winston from "winston";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import pkg from "pg";
import rateLimit from "express-rate-limit";
import Joi from "joi";
import { requireAuth } from "./src/middleware/authMiddleware.js";
import { getStorageClient } from "./src/config/dynamicStorageManager.js";

const { Client } = pkg;

// ✅ Load environment variables
dotenv.config();

// ✅ Validate environment variables
const envSchema = Joi.object({
  AWS_REGION: Joi.string().required(),
  BUCKET_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  COGNITO_USER_POOL_ID: Joi.string().required(),
  COGNITO_CLIENT_ID: Joi.string().required(),
  COGNITO_CLIENT_SECRET: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  PORT: Joi.number().default(5001),
  FRONTEND_URL: Joi.string().default("http://localhost:3000"),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}
process.env = { ...process.env, ...envVars };

// ✅ AWS Secrets Manager Configuration
const secretsManagerClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

/**
 * ✅ Load AWS Secrets from AWS Secrets Manager
 */
async function loadSecrets() {
  try {
    console.log("🔍 Fetching secrets from AWS Secrets Manager...");

    // Fetch database, JWT, and Cognito secrets
    const [postgresSecret, jwtSecret, cognitoSecret] = await Promise.all([
      secretsManagerClient.send(new GetSecretValueCommand({ SecretId: "postgres" })),
      secretsManagerClient.send(new GetSecretValueCommand({ SecretId: "jwt_secret" })),
      secretsManagerClient.send(new GetSecretValueCommand({ SecretId: "cognito_credentials" }))
    ]);

    // ✅ Parse secrets and load them into process.env
    const postgresData = JSON.parse(postgresSecret.SecretString);
    const jwtData = JSON.parse(jwtSecret.SecretString);
    const cognitoData = JSON.parse(cognitoSecret.SecretString);

    Object.assign(process.env, postgresData, jwtData, cognitoData);

    console.log("✅ AWS Secrets Loaded Successfully.");
    console.log("🔍 Cognito ENV Variables Loaded:", {
      AWS_REGION: process.env.AWS_REGION,
      COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
      COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
      COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET ? "✔️ Loaded" : "❌ Missing",
    });

  } catch (error) {
    console.error("❌ AWS Secrets Manager Error:", error);
    process.exit(1);
  }
}

// 🔥 Load secrets before starting the server
await loadSecrets();

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Set up a basic rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
});

// Create a Winston logger
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

// ✅ Apply Winston for logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// ✅ Check Required ENV Variables
const requiredEnvVars = [
  "AWS_REGION",
  "BUCKET_NAME",
  "JWT_SECRET",
  "COGNITO_USER_POOL_ID",
  "COGNITO_CLIENT_ID",
  "COGNITO_CLIENT_SECRET",  // ✅ Ensure Cognito Client Secret is included
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

// ✅ PostgreSQL Database Connection
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

// ✅ Load Routes (Ensure file names are correct)
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

// ✅ File Upload Route
app.post("/api/files/upload", requireAuth, (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("❌ Form Parsing Error:", err);
      return res.status(400).json({ error: "Form parsing error." });
    }

    const file = files.file?.[0] || files.file;  // Ensure correct file selection
    if (!file) {
      return res.status(400).json({ error: "No file provided." });
    }

    const fileStream = fs.createReadStream(file.filepath);
    const uploadParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: file.originalFilename || file.newFilename,
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
  
  // ✅ PostgreSQL Connection Verification
  try {
    await dbClient.query("SELECT NOW()");
    console.log("✅ PostgreSQL Connected and Verified Successfully");
  } catch (error) {
    console.error("❌ PostgreSQL Verification Error:", error);
    process.exit(1);
  }
  
  // ✅ Graceful Shutdown
  const gracefulShutdown = () => {
    console.log("Shutting down gracefully...");
    server.close(async () => {
      console.log("Closed out remaining connections.");
      await dbClient.end();
      process.exit(0);
    });
  
    // Forcefully shut down after 10 seconds
    setTimeout(() => {
      console.error("Forcing shut down...");
      process.exit(1);
    }, 10000);
  };
  
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
  
  export default app;
  