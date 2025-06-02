// ===================================================================================
// ✅ FILE: /backend/src/routes/index.mjs
// Central Express router file for all static and dynamic route registration
// ===================================================================================

import express from 'express';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ Direct Static API Imports
import storageUsageRoutes from '../api/storageUsage.mjs';
import userDataRoutes from '../api/userData.mjs';
import storageCostRoutes from '../api/storageCostAnalysis.mjs';
import storageRecommendationRoutes from '../api/storageRecommendations.mjs';
import storageLocationRoutes from '../api/StorageLocationDetails.mjs';
import activityStatsRoutes from '../api/activityStats.mjs';
import performanceRoutes from '../api/performance.mjs';
import dashboardMetricsRoutes from '../api/dashboardMetrics.mjs';
import dashboardActivitiesRoutes from '../api/dashboardActivities.mjs';
import dashboardFeedbackRoutes from '../api/dashboardFeedback.mjs';
import dashboardErrorRoutes from '../api/dashboardErrors.mjs';
import dashboardSessionRoutes from '../api/dashboardSessionMetrics.mjs';
import logsRoutes from './logsRoutes.mjs';
import telemetryRouter from '../api/telemetry.mjs';
import telemetryRoutes from './telemetryRoutes.mjs';

// ✅ MCP API Route Imports
import getAvailableServers from '../api/mcp/getAvailableServers.mjs';
import saveCustomerConfig from '../api/mcp/saveCustomerConfig.mjs';
import runMCPCommand from '../api/mcp/runMCPCommand.mjs';
// Inside your route loader
import verifyRecaptcha from '../api/verifyRecaptcha.mjs';
router.use(verifyRecaptcha);

// ✅ Attach Static Routes
router.use('/api/logs', logsRoutes);
router.use('/api/dashboard/session-metrics', dashboardSessionRoutes);
router.use('/api/dashboard/errors', dashboardErrorRoutes);
router.use('/api/dashboard/feedback', dashboardFeedbackRoutes);
router.use('/api/dashboard/activities', dashboardActivitiesRoutes);
router.use('/api/dashboard/metrics', dashboardMetricsRoutes);
router.use('/api/storage/usage', storageUsageRoutes);
router.use('/api/user-data', userDataRoutes);
router.use('/api/storage/cost-analysis', storageCostRoutes);
router.use('/api/storage/recommendations', storageRecommendationRoutes);
router.use('/api/storage/locations', storageLocationRoutes);
router.use('/api/activity/stats', activityStatsRoutes);
router.use('/api/performance', performanceRoutes);
router.use('/api/telemetry', telemetryRouter);
router.use('/api/telemetry', telemetryRoutes);

// ✅ Attach MCP Routes
router.use('/api/mcp/getAvailableServers', getAvailableServers);
router.use('/api/mcp/saveCustomerConfig', saveCustomerConfig);
router.use('/api/mcp/runMCPCommand', runMCPCommand);

// ✅ Dynamic Routes to Load
const routes = [
  { name: 'admin', path: '/admin', module: './adminRoutes.mjs' },
  { name: 'ai', path: '/ai', module: './aiRoutes.mjs' },
  { name: 'aiPrompt', path: '/ai/prompts', module: './aiPromptTemplateRoutes.mjs' },
  { name: 'aiGroups', path: '/ai/groups', module: './aiGroups.mjs' },
  { name: 'aiPerformance', path: '/ai/performance', module: './aiPerformanceRoutes.mjs' },
  { name: 'app', path: '/apps', module: './appRoutes.mjs' },
  { name: 'auth', path: '/auth', module: './authRoutes.mjs' },
  { name: 'billing', path: '/billing', module: './billingRoutes.mjs' },
  { name: 'developer', path: '/developers', module: './developerRoutes.mjs' },
  { name: 'feedback', path: '/feedback', module: './feedbackRoutes.mjs' },
  { name: 'file', path: '/files', module: './fileRoutes.mjs' },
  { name: 'fileAnalysis', path: '/api/files/analysis', module: './fileAnalysisRoutes.mjs' },
  { name: 'fileOrganization', path: '/api/files/organize', module: './fileOrganizationRoutes.mjs' },
  { name: 'filePreview', path: '/api/files/preview', module: './filePreviewRoutes.mjs' },
  { name: 'fileRelationship', path: '/api/files/relationships', module: './fileRelationshipRoutes.mjs' },
  { name: 'fileRetrieval', path: '/api/files/retrieve', module: './fileRetrievalRoutes.mjs' },
  { name: 'fileSearch', path: '/api/files/search', module: './fileSearchRoutes.mjs' },
  { name: 'fileSearchReplace', path: '/api/files/replace', module: './fileSearchReplaceRoutes.mjs' },
  { name: 'fileSecurity', path: '/api/files/security', module: './fileSecurityRoutes.mjs' },
  { name: 'fileShare', path: '/api/shares', module: './fileShareRoutes.mjs' },
  { name: 'fileTagging', path: '/api/files/tagging', module: './fileTaggingRoutes.mjs' },
  { name: 'fileVersioning', path: '/api/files/versioning', module: './fileVersioningRoutes.mjs' },
  { name: 'insights', path: '/api/insights', module: './insightRoutes.mjs' },
  { name: 'key', path: '/api/keys', module: './keyRoutes.mjs' },
  { name: 'marketplace', path: '/api/marketplace', module: './marketplaceRoutes.mjs' },
  { name: 'notification', path: '/api/notifications', module: './notificationRoutes.mjs' },
  { name: 'platform', path: '/api/platform/stats', module: './platformStats.mjs' },
  { name: 's3', path: '/api/s3', module: './s3Routes.mjs' },
  { name: 'secrets', path: '/api/secrets', module: './secrets.mjs' },
  { name: 'security', path: '/api/security/status', module: './securityStatus.mjs' },
  { name: 'service', path: '/api/services', module: './serviceRoutes.mjs' },
  { name: 'storage', path: '/api/storage', module: './storageRoutes.mjs' },
  { name: 'troubleshooting', path: '/api/troubleshoot', module: './troubleshootingRoutes.mjs' },
  { name: 'user', path: '/api/users', module: './userRoutes.mjs' },
  { name: 'workflow', path: '/api/workflows', module: './workflowRoutes.mjs' }
];

// ✅ Mount Function
export async function mountAllRoutes(app) {
  console.log('\n🛣️ Starting route mounting process...');

  const mountedRoutes = [];
  const failedRoutes = [];

  for (const route of routes) {
    try {
      const absolutePath = pathToFileURL(path.resolve(__dirname, route.module)).href;
      const routeModule = await import(absolutePath);

      if (!routeModule.default || typeof routeModule.default !== 'function') {
        const errorMsg = !routeModule.default
          ? 'No default export found'
          : 'Export is not a function';
        failedRoutes.push({ ...route, error: errorMsg });
        continue;
      }

      app.use(route.path, routeModule.default);
      mountedRoutes.push(route.path);
    } catch (err) {
      failedRoutes.push({ ...route, error: err.message });
    }
  }

  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mountedRoutes,
      failedRoutes
    });
  });

  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.originalUrl,
      availableRoutes: mountedRoutes
    });
  });

  console.log('\n📊 Route Mounting Summary:');
  console.log(`   ✅ Mounted Routes: ${mountedRoutes.length}`);
  console.log(`   ❌ Failed Routes: ${failedRoutes.length}`);
  if (failedRoutes.length) {
    failedRoutes.forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }

  return true;
}

export default mountAllRoutes;
