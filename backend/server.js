import dotenv from "dotenv";
dotenv.config();

import getSecrets from "./src/config/config.js";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import winston from "winston";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { S3Client } from "@aws-sdk/client-s3";
import pkg from "pg";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import https from "https";
import { fileURLToPath } from "url";
import corsMiddleware from "./src/middleware/corsMiddleware.js";
import cors from "cors";

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // Initialize app before using it
const PORT = process.env.PORT || 5001;
const HTTPS_ENABLED = process.env.ENABLE_HTTPS === "true";

// ✅ Allow frontend to reach backend
app.use(
  cors({
    origin: "http://localhost:5173", // or "*" during testing
    credentials: true,
  })
);

// 🔐 Load Secrets from AWS Secrets Manager
console.log("🔍 Fetching AWS Secrets from Secrets Manager...");
let secrets;

try {
  secrets = await getSecrets();
  if (!secrets || typeof secrets !== "object") {
    throw new Error("AWS Secrets Manager returned invalid data");
  }
  console.log("✅ Successfully fetched secrets:", secrets);
} catch (error) {
  console.error("❌ Failed to load AWS Secrets:", error.message);
  process.exit(1);
}

// ✅ Inject secrets into process.env
Object.entries(secrets).forEach(([key, value]) => {
  process.env[key] = value;
});

// ✅ Check for required env vars
const requiredEnvVars = [
  "PORT", "NODE_ENV", "AWS_REGION", "DB_HOST", "DB_NAME", "DB_USER",
  "DB_PASSWORD", "DB_PORT", "COGNITO_USER_POOL_ID", "COGNITO_CLIENT_ID",
  "COGNITO_CLIENT_SECRET", "JWT_SECRET"
];

const missingKeys = requiredEnvVars.filter((key) => !process.env[key]);
if (missingKeys.length > 0) {
  console.error(`❌ Missing Required ENV Variables: ${missingKeys.join(", ")}`);
  process.exit(1);
}

// ✅ Confirm loaded ENV
console.log("🔍 ENV AFTER LOADING SECRETS:", {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  AWS_REGION: process.env.AWS_REGION,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✔️ Loaded" : "❌ Missing",
});

// ✅ PostgreSQL Connection
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
  console.log(`✅ PostgreSQL connected: ${process.env.DB_NAME} at ${process.env.DB_HOST}`);
} catch (err) {
  console.error("❌ PostgreSQL connection failed:", err.message);
  process.exit(1);
}

// ✅ Cognito & S3 Clients
const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// ✅ Logger Setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log", level: "info" }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

// ✅ Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
      fontSrc: ["'self'", "https:"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, try again later." },
}));

// ✅ Dynamic Route Loader
const dynamicRouteLoader = async (filePath, routePath) => {
  try {
    const { default: route } = await import(filePath);
    app.use(routePath, route);
    console.log(`✅ Route loaded: ${routePath}`);
  } catch (err) {
    logger.error(`❌ Failed to load route ${routePath}: ${err.message}`);
  }
};

// ✅ Load Routes
await dynamicRouteLoader("./src/routes/secrets.js", "/api/secrets");
await dynamicRouteLoader("./src/routes/authRoutes.js", "/api/auth");
await dynamicRouteLoader("./src/routes/aiRoutes.js", "/api/ai");
await dynamicRouteLoader("./src/routes/adminRoutes.js", "/api/admin");
await dynamicRouteLoader("./src/routes/storageRoutes.js", "/api/storage");
await dynamicRouteLoader("./src/routes/marketplaceRoutes.js", "/api/marketplace");

// ✅ Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", uptime: process.uptime() });
});

// ✅ API 404 Handler
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// ✅ Serve Frontend (Static)
app.use(express.static(path.join(__dirname, "../frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// ✅ Error Handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: "An unexpected server error occurred." });
});

// ✅ Start Server (HTTPS disabled explicitly)
if (HTTPS_ENABLED) {
  const httpsOptions = {
    key: fs.readFileSync("./path/to/your-key.pem"),
    cert: fs.readFileSync("./path/to/your-cert.pem"),
  };
  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🚀 HTTPS Server running on https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
  });
}

// ✅ Graceful Shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 SIGTERM received. Closing DB connection...");
  await dbClient.end();
  process.exit(0);
});
process.on("SIGINT", async () => {
  console.log("🔄 SIGINT received. Closing DB connection...");
  await dbClient.end();
  process.exit(0);
});
