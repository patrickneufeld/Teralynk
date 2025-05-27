// ================================================
// 🟢 Complete server.mjs - Part 1: Core Setup and Imports
// File: /backend/server.mjs
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
import pkg from 'pg';
const { Pool } = pkg;
import Redis from 'ioredis';
import { debugLog } from './src/utils/debug.mjs';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables immediately
dotenv.config();

/**
 * Enhanced module importer with better error handling
 */
const importModule = async (name, path) => {
  try {
    debugLog('Import', `📥 Importing module: ${name}`);
    const modulePath = join(__dirname, path);
    const module = await import(modulePath);
    
    if (module?.default) {
      debugLog('Import', `✅ Successfully loaded module: ${name}`);
      return module.default;
    } else if (module) {
      debugLog('Import', `✅ Successfully loaded module: ${name}`);
      return module;
    }
    throw new Error(`Module ${name} has no valid exports`);
  } catch (error) {
    debugLog('Import', `❌ Failed to load module: ${name}`, error);
    throw error;
  }
};

/**
 * Configuration initialization with validation
 */
const initializeConfig = () => {
  debugLog('Config', 'Loading environment variables...');

  const requiredVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'OPENAI_API_KEY',
    'SUNO_API_KEY',
    'X_AI_API_KEY'
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    PORT: parseInt(process.env.PORT, 10) || 5001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_PROD: process.env.NODE_ENV === 'production',
    CLUSTER_ENABLED: process.env.CLUSTER_ENABLED === 'true',
    CPU_COUNT: os.cpus().length,
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000,
      MAX_REQUESTS: process.env.NODE_ENV === 'production' ? 100 : 1000,
    },
    CORS: {
      ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      CREDENTIALS: true,
    },
    COMPRESSION: {
      LEVEL: 6,
      THRESHOLD: 1024,
    },
    SECURITY: {
      TRUSTED_PROXIES: process.env.TRUSTED_PROXIES?.split(',') || [],
      JWT_SECRET: process.env.JWT_SECRET,
      COOKIE_SECRET: process.env.COOKIE_SECRET,
      CSRF_SECRET: process.env.CSRF_SECRET,
    },
    REDIS: {
      HOST: process.env.REDIS_HOST || 'localhost',
      PORT: parseInt(process.env.REDIS_PORT, 10) || 6379,
      PASSWORD: process.env.REDIS_PASSWORD,
      DB: parseInt(process.env.REDIS_DB, 10) || 0,
    },
    DB: {
      HOST: process.env.DB_HOST,
      USER: process.env.DB_USER,
      PASSWORD: process.env.DB_PASSWORD,
      NAME: process.env.DB_NAME,
      PORT: parseInt(process.env.DB_PORT, 10) || 5432,
      MAX_POOL: parseInt(process.env.DB_MAX_POOL, 10) || 20,
      IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
      CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000,
    }
  };
};

/**
 * Module initialization with proper error handling
 */
const initializeModules = async () => {
  debugLog('AppImports', 'Starting application module imports...');
  
  try {
    const moduleImports = {
      mountAllRoutes: ['routes/index', './src/routes/index.mjs'],
      aiRoutes: ['routes/aiRoutes', './src/routes/aiRoutes.mjs'],
      aiFileNamingRoutes: ['routes/aiFileNamingRoutes', './src/ai/aiFileNamingRoutes.mjs'],
      authMiddleware: ['middleware/authMiddleware', './src/middleware/authMiddleware.mjs'],
      validationMiddleware: ['middleware/validationMiddleware', './src/middleware/validationMiddleware.mjs'],
      aiStorage: ['aiStorageOptimizer', './src/ai/aiStorageOptimizer.mjs'],
      secretManager: ['utils/secretManager', './src/utils/secretManager.mjs']
    };

    const modules = {};
    
    for (const [key, [name, path]] of Object.entries(moduleImports)) {
      try {
        const module = await importModule(name, path);
        modules[key] = module;
      } catch (error) {
        debugLog('Import', `Failed to load ${name}`, error);
        if (key !== 'contextValidationMiddleware') { // Skip if it's the problematic middleware
          throw error;
        }
      }
    }

    debugLog('AppImports', '✅ All application modules loaded successfully');
    return {
      ...modules,
      AUTH_CONFIG: modules.authMiddleware.AUTH_CONFIG,
      initAIStorage: modules.aiStorage.initAIStorage,
      injectSecretsToEnv: modules.secretManager.injectSecretsToEnv
    };
  } catch (error) {
    debugLog('AppImports', '❌ Failed to initialize modules', error);
    throw error;
  }
};

/**
 * Database initialization with enhanced error handling and connection pooling
 */
const initializeDatabases = async (CONFIG) => {
  debugLog('Redis', 'Initializing Redis connection...');
  const redis = new Redis({
    host: CONFIG.REDIS.HOST,
    port: CONFIG.REDIS.PORT,
    password: CONFIG.REDIS.PASSWORD,
    db: CONFIG.REDIS.DB,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      debugLog('Redis', `Retrying connection in ${delay}ms...`);
      return delay;
    },
    maxRetriesPerRequest: 3
  });

  redis.on('connect', () => debugLog('Redis', '✅ Redis connected successfully'));
  redis.on('error', (err) => debugLog('Redis', '❌ Redis connection error', err));
  redis.on('reconnecting', () => debugLog('Redis', '🔄 Redis reconnecting...'));

  debugLog('Database', 'Initializing PostgreSQL connection...');
  const dbPool = new Pool({
    host: CONFIG.DB.HOST,
    user: CONFIG.DB.USER,
    password: CONFIG.DB.PASSWORD,
    database: CONFIG.DB.NAME,
    port: CONFIG.DB.PORT,
    max: CONFIG.DB.MAX_POOL,
    idleTimeoutMillis: CONFIG.DB.IDLE_TIMEOUT,
    connectionTimeoutMillis: CONFIG.DB.CONNECTION_TIMEOUT,
    application_name: 'teralynk-backend'
  });

  dbPool.on('error', (err, client) => {
    debugLog('Database', '❌ Unexpected error on idle client', err);
  });

  try {
    const client = await dbPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    debugLog('Database', `✅ PostgreSQL connected successfully at ${result.rows[0].now}`);
  } catch (error) {
    debugLog('Database', '❌ Failed to connect to PostgreSQL', error);
    throw error;
  }

  return { redis, dbPool };
};
/**
 * Enhanced middleware application with security features
 */
const applyCoreMiddleware = (app, CONFIG) => {
  debugLog('Middleware', 'Applying core middleware...');
  
  // MIME type handling
  app.use((req, res, next) => {
    if (req.url.endsWith('.mjs')) {
      res.type('application/javascript; charset=utf-8');
    }
    next();
  });

  // Request parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => { req.rawBody = buf }
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // Logging middleware
  app.use(morgan('dev'));
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: CONFIG.IS_PROD,
    crossOriginEmbedderPolicy: CONFIG.IS_PROD,
    crossOriginOpenerPolicy: CONFIG.IS_PROD,
    crossOriginResourcePolicy: CONFIG.IS_PROD,
    dnsPrefetchControl: true,
    frameguard: true,
    hidePoweredBy: true,
    hsts: CONFIG.IS_PROD,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: true,
    xssFilter: true
  }));

  // CORS configuration
  app.use(cors({ 
    origin: CONFIG.CORS.ORIGINS, 
    credentials: CONFIG.CORS.CREDENTIALS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // 10 minutes
  }));

  // Additional middleware
  app.use(cookieParser(CONFIG.SECURITY.COOKIE_SECRET));
  app.use(compression({
    ...CONFIG.COMPRESSION,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
  
  debugLog('Middleware', '✅ Core middleware applied');
};

/**
 * Enhanced route application with error handling
 */
const applyRoutes = async (app, modules) => {
  debugLog('Routes', 'Mounting application routes...');

  try {
    // Health check endpoint with detailed system info
    app.get('/health', (req, res) => {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        env: process.env.NODE_ENV,
        version: process.version,
        pid: process.pid
      };
      res.json(healthData);
    });

    // Import and mount routes
    const routes = {
      logs: await importModule('routes/logs', './src/routes/logsRoutes.mjs'),
      // Add other routes as needed
    };

    // API routes
    app.use('/api/logs', routes.logs);
    app.use('/api/ai', modules.aiRoutes);
    app.use('/api/ai/naming', modules.aiFileNamingRoutes);
    
    // Mount all other routes
    await modules.mountAllRoutes(app);

    // 404 handler
    app.use((req, res, next) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      debugLog('Error', 'Unhandled request error', err);
      
      const statusCode = err.statusCode || 500;
      const errorResponse = {
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal Server Error' 
          : err.message,
        requestId: req.id,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      };

      if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
        errorResponse.details = err.details || {};
      }

      res.status(statusCode).json(errorResponse);
    });

    debugLog('Routes', '✅ All routes mounted successfully');
  } catch (error) {
    debugLog('Routes', '❌ Error mounting routes', error);
    throw error;
  }
};

/**
 * Enhanced application initialization
 */
const initializeApplication = async () => {
  debugLog('Init', 'Starting application initialization...');
  
  try {
    const CONFIG = initializeConfig();
    const modules = await initializeModules();
    await modules.injectSecretsToEnv();
    
    const CONFIG_WITH_SECRETS = initializeConfig();
    const { redis, dbPool } = await initializeDatabases(CONFIG_WITH_SECRETS);
    
    const app = express();
    applyCoreMiddleware(app, CONFIG_WITH_SECRETS);
    await applyRoutes(app, modules);
    await modules.initAIStorage();
    
    return { app, CONFIG: CONFIG_WITH_SECRETS, redis, dbPool, modules };
  } catch (error) {
    debugLog('Init', '❌ Application initialization failed', error);
    throw error;
  }
};

/**
 * Enhanced server startup with graceful shutdown
 */
const startServer = async () => {
  const { app, CONFIG, redis, dbPool } = await initializeApplication();

  const server = app.listen(CONFIG.PORT, () => {
    debugLog('Server', `✅ Server started on port ${CONFIG.PORT} in ${CONFIG.NODE_ENV} mode`);
  });

  const shutdown = async (signal) => {
    debugLog('Server', `Received ${signal}. Initiating graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(async () => {
      try {
        // Close all active connections
        await Promise.all([
          dbPool.end(),
          redis.quit(),
          new Promise(resolve => setTimeout(resolve, 1000))
        ]);
        debugLog('Server', '✅ Shutdown complete');
        process.exit(0);
      } catch (error) {
        debugLog('Server', '❌ Error during shutdown', error);
        process.exit(1);
      }
    });

    // Force shutdown after timeout
    setTimeout(() => {
      debugLog('Server', '❌ Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    debugLog('Error', '❌ Uncaught exception', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    debugLog('Error', '❌ Unhandled rejection', { reason, promise });
    shutdown('UNHANDLED_REJECTION');
  });
  
  return server;
};

/**
 * Enhanced cluster initialization
 */
const initializeCluster = async () => {
  const CONFIG = initializeConfig();
  
  if (cluster.isPrimary && CONFIG.CLUSTER_ENABLED && CONFIG.IS_PROD) {
    debugLog('Cluster', `Starting ${CONFIG.CPU_COUNT} cluster workers...`);
    
    // Cluster event handlers
    cluster.on('exit', (worker, code, signal) => {
      debugLog('Cluster', `Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
      cluster.fork();
    });

    cluster.on('error', (error) => {
      debugLog('Cluster', `Cluster error: ${error.message}`);
    });

    cluster.on('disconnect', (worker) => {
      debugLog('Cluster', `Worker ${worker.process.pid} disconnected`);
    });

    // Fork workers
    for (let i = 0; i < CONFIG.CPU_COUNT; i++) {
      cluster.fork();
    }
  } else {
    await startServer();
  }
};

// Application entrypoint
initializeCluster().catch((error) => {
  debugLog('Fatal', '❌ Application failed to start', error);
  console.error('Fatal error:', error);
  process.exit(1);
});

export default {
  initializeApplication,
  startServer,
  initializeCluster,
};
