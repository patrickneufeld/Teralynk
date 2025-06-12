// File: /Users/patrick/Projects/Teralynk/backend/src/routes/adminRoutes.mjs

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
      throw new Error(`Missing function: ${label}.${fn}`);
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

export default router;
