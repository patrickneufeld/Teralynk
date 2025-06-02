// File: /backend/src/utils/idGenerator.js

import { v4 as uuidv4 } from 'uuid';

/**
 * Enterprise-Grade ID Generator Utility for Teralynk
 * Pattern: $<prefix>_<timestamp>_<random>
 * Hardened for traceability, auditing, security, and telemetry consistency.
 */

const makeId = (prefix) => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `$${prefix}_${timestamp}_${randomPart}`;
};

// Core / Lifecycle
export const generateRequestId = () => makeId('req');
export const generateBootId = () => makeId('boot');
export const generateSessionId = () => makeId('ses');
export const generateTraceId = () => makeId('trc');
export const generateCycleId = () => makeId('cyc');

// Observability / Telemetry
export const generateMonitoringId = () => makeId('mon');
export const generateMetricsId = () => makeId('met');
export const generateTelemetryId = () => makeId('tel');
export const generateDiagnosticId = () => makeId('diag');
export const generateHealthId = () => makeId('hlth');

// AI / Analytics / ML
export const generateAnalysisId = () => makeId('ana');
export const generateOptimizationId = () => makeId('opt');
export const generatePredictionId = () => makeId('pred');
export const generateDiscoveryId = () => makeId('disc');
export const generateInsightId = () => makeId('ins');
export const generateLoadForecastId = () => makeId('load');
export const generateVerificationId = () => makeId('ver');
export const generateCustomizationId = () => makeId('cust');

// Fault Tolerance / Error Handling
export const generateErrorId = () => makeId('err');
export const generateFaultId = () => makeId('flt');
export const generateRecoveryId = () => makeId('rec');
export const generateIncidentId = () => makeId('inc');
export const generateTestId = () => makeId('tst');
export const generateDetectionId = () => makeId('det');

// System Operations
export const generateDeploymentId = () => makeId('dep');
export const generateChangeId = () => makeId('chg');
export const generateUpdateId = () => makeId('upd');
export const generateRollbackId = () => makeId('rll');
export const generateCacheId = () => makeId('cch');
export const generateMaintenanceId = () => makeId('mnt');
export const generateCheckId = () => makeId('chk');
export const generatePlanningId = () => makeId('plan');
export const generateManagementId = () => makeId('mgmt');

// Security / Access / Enforcement
export const generateSecurityId = () => makeId('sec');
export const generateEnforcementId = () => makeId('enf');
export const generateAccessId = () => makeId('acc');
export const generateAuthId = () => makeId('auth');
export const generateValidationId = () => makeId('val');

// Integration / Coordination
export const generateCoordinationId = () => makeId('crd');
export const generateIntegrationId = () => makeId('int');
export const generateWorkflowId = () => makeId('wflw');
export const generateProcessSessionId = () => makeId('proc');
export const generateOperationId = () => makeId('op');
export const generateProcessingId = () => makeId('prc');

// Network / Communication
export const generateNetworkSessionId = () => makeId('net');
export const generateQueueOperationId = () => makeId('qop');
export const generateStreamId = () => makeId('strm');
export const generateBalancingId = () => makeId('bal');
export const generateSchedulingId = () => makeId('sch');
export const generateTransactionId = () => makeId('txn');

// Notification / Reports / Subscriptions
export const generateNotificationId = () => makeId('ntf');
export const generateSubscriptionId = () => makeId('sub');
export const generateReportId = () => makeId('rpt');

// Interface / Configuration
export const generateInterfaceId = () => makeId('iface');
export const generateConfigId = () => makeId('cfg');
export const generateCollectionId = () => makeId('coll');
export const generateSearchId = () => makeId('srch');
export const generateRegistrationId = () => makeId('reg');

// Backup / Restore
export const generateBackupId = () => makeId('bak');
export const generateRestoreId = () => makeId('res');
export const generateCanaryId = () => makeId('can');
