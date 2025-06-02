// FILE: /backend/src/routes/fileShareRoutes.mjs

import express from 'express';
import { body, param, query } from 'express-validator';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { handleValidationErrors } from '../middleware/inputValidationMiddleware.mjs';
import { logInfo, logWarn, logError } from '../utils/logging/index.mjs';

const router = express.Router();

let fileShareController = null;

const VALID_ROLES = ['viewer', 'editor', 'admin'];

const requiredFileShareFunctions = [
  'getSharedUsers',
  'shareFile',
  'updateShareRole',
  'revokeShare',
  'getAuditLogs',
  'suggestUsers',
];

function validateFunctions(controller, required, label) {
  for (const fn of required) {
    if (typeof controller[fn] !== 'function') {
      logError(`Missing function: ${label}.${fn}`);
      throw new Error(`Missing function: ${label}.${fn}`);
    }
  }
}

async function initializeFileShareController() {
  try {
    const module = await import('../controllers/fileShareController.mjs');
    fileShareController = module;

    validateFunctions(fileShareController, requiredFileShareFunctions, 'fileShareController');
    logInfo('✅ File share controller loaded successfully');
  } catch (error) {
    logError('❌ Failed to load file share controller', {
      error: error.message,
      stack: error.stack,
    });

    // fallback route when controller can't load
    router.use('*', (req, res) => {
      logError('File share API unavailable - fallback triggered', { path: req.originalUrl });
      res.status(503).json({
        error: 'File share API unavailable',
        code: 'FILE_SHARE_API_UNAVAILABLE',
      });
    });

    return;
  }

  // Define routes only after validation passes

  router.get(
    '/:fileKey',
    requireAuth,
    param('fileKey').exists({ checkFalsy: true }).isString().withMessage('File key must be a string'),
    handleValidationErrors,
    fileShareController.getSharedUsers
  );

  router.post(
    '/',
    requireAuth,
    body('fileKey').exists({ checkFalsy: true }).isString().withMessage('File key is required'),
    body('email').exists({ checkFalsy: true }).isEmail().withMessage('Must be a valid email address'),
    body('role').exists({ checkFalsy: true }).isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
    body('expiresAt').optional().isISO8601().withMessage('Expiration must be a valid ISO8601 date'),
    handleValidationErrors,
    fileShareController.shareFile
  );

  router.put(
    '/:shareId',
    requireAuth,
    param('shareId').exists({ checkFalsy: true }).isUUID().withMessage('Share ID must be a valid UUID'),
    body('role').exists({ checkFalsy: true }).isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
    handleValidationErrors,
    fileShareController.updateShareRole
  );

  router.delete(
    '/:shareId',
    requireAuth,
    param('shareId').exists({ checkFalsy: true }).isUUID().withMessage('Share ID must be a valid UUID'),
    handleValidationErrors,
    fileShareController.revokeShare
  );

  router.get(
    '/audit/:fileKey',
    requireAuth,
    param('fileKey').exists({ checkFalsy: true }).isString().withMessage('File key must be a string'),
    handleValidationErrors,
    fileShareController.getAuditLogs
  );

  router.get(
    '/users/suggest',
    requireAuth,
    query('query')
      .exists({ checkFalsy: true })
      .isString()
      .isLength({ min: 2 })
      .withMessage('Query must be a string with at least 2 characters'),
    handleValidationErrors,
    fileShareController.suggestUsers
  );
}

await initializeFileShareController();

export default router;
