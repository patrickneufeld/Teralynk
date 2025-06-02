// ================================================
// ✅ FILE: /backend/server.mjs
// Enterprise Backend Entrypoint for Teralynk
// ================================================

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cluster from 'cluster';
import os from 'os';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import pkg from 'pg';
const { Pool } = pkg;
import { debugLog } from './src/utils/debug.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// ================================================
// 🔧 Load Config
// ================================================

const initializeConfig = () => {
  debugLog('Config', '📦 Loading environment variables');

  const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'OPENAI_API_KEY'];
  const missing = required.filter(v => !process.env[v]);
  if (missing.length) throw new Error(`Missing ENV vars: ${missing.join(', ')}`);

  return {
    PORT: parseInt(process.env.PORT || '5001'),
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_PROD: process.env.NODE_ENV === 'production',
    CLUSTER_ENABLED: process.env.CLUSTER_ENABLED === 'true',
    CORS: {
      ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
      CREDENTIALS: true,
    },
    REDIS: {
      HOST: process.env.REDIS_HOST || 'localhost',
      PORT: parseInt(process.env.REDIS_PORT || '6379'),
      PASSWORD: process.env.REDIS_PASSWORD,
      DB: parseInt(process.env.REDIS_DB || '0'),
    },
    DB: {
      HOST: process.env.DB_HOST,
      USER: process.env.DB_USER,
      PASSWORD: process.env.DB_PASSWORD,
      NAME: process.env.DB_NAME,
      PORT: parseInt(process.env.DB_PORT || '5432'),
      MAX_POOL: 20,
      IDLE_TIMEOUT: 30000,
      CONNECTION_TIMEOUT: 2000,
    }
  };
};

// ================================================
// 🛢️ Redis + PG Initialization
// ================================================

const initializeDatabases = async (CONFIG) => {
  const redis = new Redis(CONFIG.REDIS);

  redis.on('connect', () => debugLog('Redis', '✅ Connected'));
  redis.on('error', err => debugLog('Redis', '❌ Redis error', err));

  const dbPool = new Pool({
    host: CONFIG.DB.HOST,
    user: CONFIG.DB.USER,
    password: CONFIG.DB.PASSWORD,
    database: CONFIG.DB.NAME,
    port: CONFIG.DB.PORT,
    max: CONFIG.DB.MAX_POOL,
    idleTimeoutMillis: CONFIG.DB.IDLE_TIMEOUT,
    connectionTimeoutMillis: CONFIG.DB.CONNECTION_TIMEOUT
  });

  const client = await dbPool.connect();
  const result = await client.query('SELECT NOW()');
  client.release();
  debugLog('Postgres', `✅ Connected at ${result.rows[0].now}`);

  return { redis, dbPool };
};

// ================================================
// 🧩 Middleware
// ================================================

const applyMiddleware = (app, CONFIG) => {
  app.use((req, res, next) => {
    if (req.url.endsWith('.mjs')) res.type('application/javascript; charset=utf-8');
    next();
  });

  // ✅ CORS Fix — placed early
  // ✅ CORS config in your Express server (server.mjs or similar)

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With', // ✅ <--- Add this
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));


  app.options('*', cors()); // 🔁 Allow preflight for all

  app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(morgan('dev'));
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());
};

// ================================================
// 📦 Dynamic Module Import
// ================================================

const importModule = async (name, relativePath) => {
  const modulePath = join(__dirname, relativePath);
  try {
    const mod = await import(modulePath);
    debugLog('Import', `✅ Loaded module: ${name}`);
    return mod?.default || mod;
  } catch (err) {
    debugLog('Import', `❌ Failed to load ${name}`, err);
    throw err;
  }
};

// ================================================
// 🚏 Route Mounting
// ================================================

const mountRoutes = async (app) => {
  // ✅ Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      pid: process.pid,
    });
  });

  // ✅ Auth verify endpoint for frontend token validation
  app.get('/api/auth/verify', (req, res) => {
    debugLog('Auth', `🔒 Verify ping from origin: ${req.headers.origin}`);
    debugLog('Auth', `🔐 Headers received: ${JSON.stringify(req.headers, null, 2)}`);

    res.status(200).json({
      success: true,
      message: 'Auth verification successful',
      timestamp: Date.now(),
    });
  });

  try {
    const telemetry = await importModule('telemetry', './src/api/telemetry.mjs');
    app.use('/api/telemetry', telemetry);

    const logs = await importModule('logs', './src/routes/logsRoutes.mjs');
    app.use('/api/logs', logs);

    const aiRoutes = await importModule('ai', './src/routes/aiRoutes.mjs');
    app.use('/api/ai', aiRoutes);

    const naming = await importModule('naming', './src/ai/aiFileNamingRoutes.mjs');
    app.use('/api/ai/naming', naming);

    const fallbackRoutes = await importModule('routes/index', './src/routes/index.mjs');
    await fallbackRoutes(app);
  } catch (err) {
    debugLog('Mounting', '❌ Failed to mount one or more route modules', err);
    throw err;
  }

  // ✅ Catch unmatched routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });

  // ✅ Global error handler
  app.use((err, req, res, next) => {
    debugLog('Error', '❌ Unhandled error', err);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
  });

  debugLog('Routes', '✅ All routes mounted');
};


// ================================================
// 🚀 Application Bootstrap
// ================================================

const initializeApplication = async () => {
  const CONFIG = initializeConfig();
  const { redis, dbPool } = await initializeDatabases(CONFIG);

  const app = express();
  applyMiddleware(app, CONFIG);
  await mountRoutes(app);

  return { app, CONFIG, redis, dbPool };
};

// ================================================
// 🏁 Server Lifecycle
// ================================================

const startServer = async () => {
  const { app, CONFIG, redis, dbPool } = await initializeApplication();

  const server = app.listen(CONFIG.PORT, () => {
    debugLog('Server', `🚀 Listening on port ${CONFIG.PORT}`);
  });

  const shutdown = async (signal) => {
    debugLog('Shutdown', `Received ${signal}. Cleaning up...`);
    server.close(async () => {
      await dbPool.end();
      await redis.quit();
      debugLog('Shutdown', '✅ Cleanup complete. Exiting...');
      process.exit(0);
    });

    setTimeout(() => {
      debugLog('Shutdown', '⚠️ Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', err => {
    debugLog('Fatal', 'Uncaught exception', err);
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', reason => {
    debugLog('Fatal', 'Unhandled rejection', reason);
    shutdown('unhandledRejection');
  });
};

// ================================================
// 🔁 Cluster Aware Boot
// ================================================

const initializeCluster = async () => {
  const CONFIG = initializeConfig();

  if (cluster.isPrimary && CONFIG.CLUSTER_ENABLED && CONFIG.IS_PROD) {
    debugLog('Cluster', `👷 Spawning ${os.cpus().length} workers`);
    for (let i = 0; i < os.cpus().length; i++) {
      cluster.fork();
    }
    cluster.on('exit', (worker) => {
      debugLog('Cluster', `❌ Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
  } else {
    await startServer();
  }
};

initializeCluster().catch(err => {
  debugLog('Fatal', '❌ Failed to start application', err);
  process.exit(1);
});

export default {
  initializeApplication,
  startServer,
  initializeCluster
};
