// At the top of storageRoutes.mjs, after the imports
import express from 'express';
import formidable from 'formidable';
import fs from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { getStorageClient, listAvailableStorageProviders } from '../config/storageConfig.mjs';
import { logInfo, logError } from '../utils/logging/index.mjs';

const router = express.Router();

// Service initialization state
let aiFileManager = null;
let aiStorageOptimizer = null;
let logAILearning = async () => {};
let isInitialized = false;

// Required functions validation
const requiredFileManagerFunctions = [
  'analyzeFileContent',
  'autoOrganizeFiles',
  'registerNewStorageProvider',
  'getUserFiles',
  'deleteFile',
];

const requiredStorageOptimizerFunctions = [
  'determineBestStorageProvider',
  'migrateFileToAvailableStorage',
  'improveStorageAI',
];

// Validation helper
async function validateFunctions(controller, required, label) {
  for (const fn of required) {
    if (typeof controller[fn] !== 'function') {
      throw new Error(`Missing ${label} function: ${fn}`);
    }
  }
}

// Initialize controllers with better error handling
async function initializeControllers() {
  try {
    // Import modules
    const fileManagerModule = await import('../ai/aiFileManager.mjs').catch(error => {
      throw new Error(`Failed to import aiFileManager: ${error.message}`);
    });

    const optimizerModule = await import('../ai/aiStorageOptimizer.mjs').catch(error => {
      throw new Error(`Failed to import aiStorageOptimizer: ${error.message}`);
    });

    const learningModule = await import('../ai/aiLearningManager.mjs').catch(() => ({
      logAILearning: async () => {} // Fallback if learning manager fails
    }));

    // Validate file manager
    await validateFunctions(fileManagerModule, requiredFileManagerFunctions, 'aiFileManager');
    aiFileManager = fileManagerModule;

    // Validate storage optimizer
    await validateFunctions(optimizerModule, requiredStorageOptimizerFunctions, 'aiStorageOptimizer');
    aiStorageOptimizer = optimizerModule;

    // Set up learning
    logAILearning = learningModule.logAILearning || (async () => {});

    isInitialized = true;
    logInfo('✅ Storage services initialized successfully');
    return true;
  } catch (error) {
    const errorMessage = error.message || 'Unknown initialization error';
    logError('Failed to initialize storage services', { 
      error: errorMessage,
      stack: error.stack 
    });
    
    // Reset services
    aiFileManager = null;
    aiStorageOptimizer = null;
    logAILearning = async () => {};
    isInitialized = false;

    // Set up fallback route
    router.use('*', (req, res) => {
      res.status(503).json({
        error: 'Storage services unavailable',
        details: errorMessage,
        code: 'STORAGE_SERVICES_UNAVAILABLE'
      });
    });

    return false;
  }
}

// Initialize before setting up routes
await initializeControllers().catch(error => {
  logError('Critical initialization error', { error });
});

// [Rest of your routes remain the same...]
// -------------------- ROUTES --------------------

// Middleware to check service availability
const checkServices = async (req, res, next) => {
  if (!isInitialized || !aiFileManager || !aiStorageOptimizer) {
    logError('Service unavailable during request', { path: req.path });
    return res.status(503).json({
      error: 'Storage services unavailable',
      code: 'SERVICES_UNAVAILABLE'
    });
  }
  next();
};

router.post('/upload', requireAuth, checkServices, async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(400).json({ error: 'Error parsing file upload form.' });

      const { userId } = req.user;
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const preferredProviders = fields.preferredProviders || ['s3', 'googleDrive', 'dropbox'];

      if (!file) return res.status(400).json({ error: 'No file provided.' });

      const bestProvider = await aiStorageOptimizer.determineBestStorageProvider({ userId }, { fileSize: file.size });
      if (!bestProvider) return res.status(500).json({ error: 'No storage provider available with enough space.' });

      const storageClient = getStorageClient(bestProvider);
      const params = {
        Bucket: storageClient.bucket,
        Key: `users/${userId}/${file.originalFilename}`,
        Body: fs.createReadStream(file.filepath),
        ContentType: file.mimetype,
      };

      await storageClient.client.send(new PutObjectCommand(params));
      const aiMetadata = await aiFileManager.analyzeFileContent(bestProvider, file.originalFilename);

      await logAILearning(userId, 'file_uploaded', {
        fileName: file.originalFilename,
        provider: bestProvider,
        aiMetadata,
      });

      res.status(200).json({ 
        message: 'File uploaded successfully', 
        provider: bestProvider, 
        metadata: aiMetadata 
      });
    });
  } catch (error) {
    logError('❌ Upload error', { error });
    res.status(500).json({ error: 'Failed to upload file.' });
  }
});

router.post('/migrate', requireAuth, checkServices, async (req, res) => {
  try {
    const { userId } = req.user;
    const { fileName, currentProvider } = req.body;

    if (!fileName || !currentProvider) {
      return res.status(400).json({ error: 'File name and current provider are required.' });
    }

    const result = await aiStorageOptimizer.migrateFileToAvailableStorage(userId, fileName, currentProvider);
    if (!result) return res.status(500).json({ error: 'No available storage provider to migrate to.' });

    await logAILearning(userId, 'file_migrated', {
      fileName,
      fromProvider: currentProvider,
      toProvider: result.targetProvider
    });

    res.status(200).json({ 
      message: `File migrated to ${result.targetProvider}`,
      result 
    });
  } catch (error) {
    logError('❌ Migrate error', { error });
    res.status(500).json({ error: 'Failed to migrate file.' });
  }
});

router.get('/organize', requireAuth, checkServices, async (req, res) => {
  try {
    const { userId } = req.user;
    const organizationResult = await aiFileManager.autoOrganizeFiles(userId);
    
    await logAILearning(userId, 'files_organized', { 
      result: organizationResult 
    });

    res.status(200).json({ 
      message: 'Files organized successfully', 
      result: organizationResult 
    });
  } catch (error) {
    logError('❌ Organize error', { error });
    res.status(500).json({ error: 'Failed to organize files.' });
  }
});

router.get('/providers', requireAuth, async (req, res) => {
  try {
    const providers = listAvailableStorageProviders();
    res.status(200).json({ providers });
  } catch (error) {
    logError('❌ Providers list error', { error });
    res.status(500).json({ error: 'Failed to list storage providers.' });
  }
});

router.post('/add-provider', requireAuth, checkServices, async (req, res) => {
  try {
    const { providerName, apiUrl, credentials } = req.body;
    if (!providerName || !apiUrl || !credentials) {
      return res.status(400).json({ error: 'Provider name, API URL, and credentials are required.' });
    }

    const result = await aiFileManager.registerNewStorageProvider(providerName, apiUrl, credentials);
    await logAILearning('platform', 'provider_added', { providerName });

    res.status(200).json({ 
      message: 'Storage provider added successfully', 
      result 
    });
  } catch (error) {
    logError('❌ Add provider error', { error });
    res.status(500).json({ error: 'Failed to add storage provider.' });
  }
});

router.get('/user-files', requireAuth, checkServices, async (req, res) => {
  try {
    const { userId } = req.user;
    const files = await aiFileManager.getUserFiles(userId);
    res.status(200).json({ files });
  } catch (error) {
    logError('❌ Get user files error', { error });
    res.status(500).json({ error: 'Failed to fetch user files.' });
  }
});

router.delete('/delete', requireAuth, checkServices, async (req, res) => {
  try {
    const { userId } = req.user;
    const { fileName, provider } = req.body;

    if (!fileName || !provider) {
      return res.status(400).json({ error: 'File name and provider are required.' });
    }

    const deleteResult = await aiFileManager.deleteFile(userId, fileName, provider);
    if (!deleteResult.success) {
      return res.status(500).json({ error: 'Failed to delete file.' });
    }

    await logAILearning(userId, 'file_deleted', { fileName, provider });
    res.status(200).json({ message: 'File deleted successfully.' });
  } catch (error) {
    logError('❌ Delete file error', { error });
    res.status(500).json({ error: 'Failed to delete file.' });
  }
});

router.post('/improve', requireAuth, checkServices, async (req, res) => {
  try {
    await aiStorageOptimizer.improveStorageAI();
    await logAILearning('system', 'storage_ai_improved', {
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ 
      message: 'Storage AI optimization improved successfully' 
    });
  } catch (error) {
    logError('❌ Improve AI error', { error });
    res.status(500).json({ error: 'Failed to improve storage AI.' });
  }
});

router.get('/health', async (req, res) => {
  const providers = listAvailableStorageProviders();
  const status = {
    initialized: isInitialized,
    services: {
      fileManager: !!aiFileManager,
      storageOptimizer: !!aiStorageOptimizer,
      aiLearning: typeof logAILearning === 'function'
    },
    providers,
    timestamp: new Date().toISOString()
  };

  res.json({
    status: isInitialized ? 'healthy' : 'degraded',
    details: status
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  logError('Storage route error', { 
    error, 
    path: req.path, 
    method: req.method 
  });
  
  res.status(500).json({ 
    error: 'Internal storage service error',
    message: error.message
  });
});

export default router;
