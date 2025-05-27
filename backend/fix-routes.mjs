import fs from 'fs';

const files = {
    'adminRoutes.mjs': `// File: /backend/src/routes/adminRoutes.mjs

import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.mjs';
import * as adminController from '../controllers/adminController.mjs';
import {
  exportLogsToCSV,
  pruneOldLogs,
  searchLogs,
} from '../controllers/logController.mjs';
import { validateRequestContext } from '../middleware/contextValidationMiddleware.mjs';

const router = express.Router();

// Required controller functions
const requiredAdminFunctions = [
  'fetchAIOptimizations',
  'approveOptimization',
  'rejectOptimization',
  'deleteOptimization',
  'fetchAILogs',
  'fetchLatestAILogs',
  'fetchUsers',
  'disableUser',
  'enableUser',
  'fetchSystemStatus',
  'fetchMetrics',
  'fetchAIPersonas',
  'fetchUserNamingHistory',
  'deletePersonaTemplate',
  'updatePersonaTemplate',
];

const requiredLogFunctions = ['exportLogsToCSV', 'pruneOldLogs', 'searchLogs'];

// Validate existence of controllers
const validateFunctions = (controller, required, label) => {
  for (const fn of required) {
    if (typeof controller[fn] !== 'function') {
      throw new Error(\`Missing function: \${label}.\${fn}\`);
    }
  }
};

try {
  validateFunctions(adminController, requiredAdminFunctions, 'adminController');
  validateFunctions({ exportLogsToCSV, pruneOldLogs, searchLogs }, requiredLogFunctions, 'logController');
} catch (err) {
  console.error('Route validation failed:', err.message);
  process.exit(1);
}

// AI Optimization Routes
router.get('/ai-optimizations', requireAdmin, validateRequestContext, adminController.fetchAIOptimizations);
router.post('/ai-optimizations/approve', requireAdmin, validateRequestContext, adminController.approveOptimization);
router.post('/ai-optimizations/reject', requireAdmin, validateRequestContext, adminController.rejectOptimization);
router.delete('/ai-optimizations/:id', requireAdmin, validateRequestContext, adminController.deleteOptimization);

// Log Management Routes
router.get('/logs', requireAdmin, validateRequestContext, adminController.fetchAILogs);
router.get('/logs/latest', requireAdmin, validateRequestContext, adminController.fetchLatestAILogs);
router.get('/logs/export', requireAdmin, validateRequestContext, exportLogsToCSV);
router.delete('/logs/prune/:days', requireAdmin, validateRequestContext, pruneOldLogs);
router.post('/logs/search', requireAdmin, validateRequestContext, searchLogs);

// User Account Admin Routes
router.get('/users', requireAdmin, validateRequestContext, adminController.fetchUsers);
router.post('/users/disable', requireAdmin, validateRequestContext, adminController.disableUser);
router.post('/users/enable', requireAdmin, validateRequestContext, adminController.enableUser);

// System Monitoring Routes
router.get('/system-status', requireAdmin, validateRequestContext, adminController.fetchSystemStatus);
router.get('/metrics', requireAdmin, validateRequestContext, adminController.fetchMetrics);

// AI File Naming Admin Utilities
router.get('/ai-personas', requireAdmin, validateRequestContext, adminController.fetchAIPersonas);
router.get('/ai-user-naming/:userId', requireAdmin, validateRequestContext, adminController.fetchUserNamingHistory);
router.delete('/ai-persona-template', requireAdmin, validateRequestContext, adminController.deletePersonaTemplate);
router.patch('/ai-persona-template', requireAdmin, validateRequestContext, adminController.updatePersonaTemplate);

export default router;`,

    'storageRoutes.mjs': `// File: /backend/src/routes/storageRoutes.mjs

import express from 'express';
import formidable from 'formidable';
import fs from 'fs';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { getStorageClient, listAvailableStorageProviders } from '../config/storageConfig.mjs';
import { analyzeFileContent } from '../ai/aiFileManager.mjs';
import { 
  determineBestStorageProvider, 
  migrateFileToAvailableStorage, 
  analyzeStorageEfficiency, 
  improveStorageAI 
} from '../ai/aiStorageOptimizer.mjs';
import { logAILearning } from '../ai/aiLearningManager.mjs';

const router = express.Router();

router.post('/upload', requireAuth, async (req, res) => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing file upload:', err);
        return res.status(400).json({ error: 'Error parsing file upload form.' });
      }

      const { userId } = req.user;
      const file = files.file?.[0];
      const preferredProviders = fields.preferredProviders || ['s3', 'googleDrive', 'dropbox'];

      if (!file) {
        return res.status(400).json({ error: 'No file provided.' });
      }

      const bestProvider = await determineBestStorageProvider(userId, file.size, preferredProviders);
      if (!bestProvider) {
        return res.status(500).json({ error: 'No storage provider available with enough space.' });
      }

      const storageClient = getStorageClient(bestProvider);
      const params = {
        Bucket: storageClient.bucket,
        Key: \`users/\${userId}/\${file.originalFilename}\`,
        Body: fs.createReadStream(file.filepath),
        ContentType: file.mimetype,
      };

      await storageClient.client.send(new PutObjectCommand(params));

      const aiMetadata = await analyzeFileContent(bestProvider, file.originalFilename);

      await logAILearning(userId, 'file_uploaded', {
        fileName: file.originalFilename,
        provider: bestProvider,
        aiMetadata,
      });

      res.status(200).json({ message: 'File uploaded successfully', provider: bestProvider, aiMetadata });
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file.' });
  }
});

router.post('/migrate', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { fileName, currentProvider } = req.body;

    if (!fileName || !currentProvider) {
      return res.status(400).json({ error: 'File name and current provider are required.' });
    }

    const newProvider = await migrateFileToAvailableStorage(userId, fileName, currentProvider);
    if (!newProvider) {
      return res.status(500).json({ error: 'No available storage provider to migrate to.' });
    }

    res.status(200).json({ message: \`File migrated to \${newProvider}.\` });
  } catch (error) {
    console.error('Error migrating file:', error);
    res.status(500).json({ error: 'Failed to migrate file.' });
  }
});

router.get('/providers', requireAuth, async (req, res) => {
  try {
    const providers = listAvailableStorageProviders();
    res.status(200).json({ providers });
  } catch (error) {
    console.error('Error listing storage providers:', error);
    res.status(500).json({ error: 'Failed to list storage providers.' });
  }
});

router.post('/improve', requireAuth, async (req, res) => {
  try {
    await improveStorageAI();
    res.status(200).json({ message: 'AI storage optimization improved successfully.' });
  } catch (error) {
    console.error('Error improving storage AI:', error);
    res.status(500).json({ error: 'Failed to improve storage AI.' });
  }
});

export default router;`,

    'fileShareRoutes.mjs': `// File: /backend/src/routes/fileShareRoutes.mjs

import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getSharedUsers,
  shareFile,
  updateShareRole,
  revokeShare,
  getAuditLogs,
  suggestUsers
} from '../controllers/fileShareController.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { handleValidationErrors } from '../middleware/inputValidationMiddleware.mjs';

const router = express.Router();

const VALID_ROLES = ['viewer', 'editor', 'admin'];

router.get('/:fileKey', requireAuth,
  param('fileKey')
    .exists({ checkFalsy: true }).withMessage('File key is required')
    .isString().withMessage('File key must be a string'),
  handleValidationErrors,
  getSharedUsers
);

router.post('/', requireAuth,
  body('fileKey')
    .exists({ checkFalsy: true }).withMessage('File key is required')
    .isString().withMessage('File key must be a string'),
  body('email')
    .exists({ checkFalsy: true }).withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address'),
  body('role')
    .exists({ checkFalsy: true }).withMessage('Role is required')
    .isIn(VALID_ROLES).withMessage(\`Role must be one of: \${VALID_ROLES.join(', ')}\`),
  body('expiresAt')
    .optional()
    .isISO8601().withMessage('Expiration must be a valid ISO8601 date'),
  handleValidationErrors,
  shareFile
);

router.put('/:shareId', requireAuth,
  param('shareId')
    .exists({ checkFalsy: true }).withMessage('Share ID is required')
    .isUUID().withMessage('Share ID must be a valid UUID'),
  body('role')
    .exists({ checkFalsy: true }).withMessage('Role is required')
    .isIn(VALID_ROLES).withMessage(\`Role must be one of: \${VALID_ROLES.join(', ')}\`),
  handleValidationErrors,
  updateShareRole
);

router.delete('/:shareId', requireAuth,
  param('shareId')
    .exists({ checkFalsy: true }).withMessage('Share ID is required')
    .isUUID().withMessage('Share ID must be a valid UUID'),
  handleValidationErrors,
  revokeShare
);

router.get('/audit/:fileKey', requireAuth,
  param('fileKey')
    .exists({ checkFalsy: true }).withMessage('File key is required')
    .isString().withMessage('File key must be a string'),
  handleValidationErrors,
  getAuditLogs
);

router.get('/suggest', requireAuth,
  query('query')
    .exists({ checkFalsy: true }).withMessage('Search query is required')
    .isString().withMessage('Search query must be a string')
    .isLength({ min: 2 }).withMessage('Query must be at least 2 characters long'),
  handleValidationErrors,
  suggestUsers
);

export default router;`,

    'workflowRoutes.mjs': `// File: /backend/src/routes/workflowRoutes.mjs

import express from 'express';
import rateLimit from 'express-rate-limit';
import workflowApiRouter from '../api/workflows.mjs';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { rbacMiddleware } from '../middleware/rbacMiddleware.mjs';
import { logWarn } from '../utils/logging/index.mjs';

const router = express.Router();

const workflowRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        error: 'Too many requests to workflow routes. Please try again later.',
        code: 'WORKFLOW_RATE_LIMIT'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(
    '/workflows',
    workflowRateLimiter,
    requireAuth,
    rbacMiddleware('user')
);

router.use('/workflows', workflowApiRouter);

router.use('/workflows/*', (req, res) => {
    logWarn('Workflow route not found', { path: req.originalUrl });

    res.status(404).json({
        success: false,
        error: 'Workflow route not found.',
        code: 'WORKFLOW_ROUTE_NOT_FOUND'
    });
});

export default router;`
};

for (const [filename, content] of Object.entries(files)) {
    const filePath = `/Users/patrick/Projects/Teralynk/backend/src/routes/${filename}`;
    const backupPath = `/Users/patrick/Projects/Teralynk/backend/src/routes/backup/${filename}`;
    
    // Backup existing file
    if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
    }
    
    // Write new content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filename}`);
}
