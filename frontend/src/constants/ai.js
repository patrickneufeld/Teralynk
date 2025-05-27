// ✅ FILE: /frontend/src/constants/ai.js

export const AI_MODELS = {
  OPENAI_GPT_4O: 'openai:gpt-4o',
  CLAUDE_OPUS: 'anthropic:claude-opus',
  BEDROCK_TITAN: 'amazon:bedrock-titan',
  NOVA_PRO: 'nova:pro',
};

export const AI_SERVICES = {
  PERFORMANCE: 'aiPerformanceService',
  INSIGHTS: 'aiFileInsights',
  SECURITY: 'aiSecurityManager',
  STORAGE: 'aiStorageOptimizer',
  NAMING: 'aiFileNamingService',
  COLLABORATION: 'aiCollaborationManager',
};

export const AI_ACTIONS = {
  FILE_ANALYSIS: 'file_analysis',
  METADATA_EXTRACTION: 'metadata_extraction',
  PERFORMANCE_SCAN: 'performance_scan',
  SECURITY_AUDIT: 'security_audit',
  STORAGE_OPTIMIZATION: 'storage_optimization',
  AUTO_NAMING: 'auto_naming',
  CONTEXTUAL_LABELING: 'contextual_labeling',
  SESSION_LOGGING: 'session_logging',
};

export const AI_STATUS = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  FAILED: 'FAILED',
  SUCCESS: 'SUCCESS',
};

export const AI_EVENTS = {
  ANOMALY_DETECTED: 'AI:ANOMALY_DETECTED',
  OPTIMIZATION_APPLIED: 'AI:OPTIMIZATION_APPLIED',
  AUDIT_TRIGGERED: 'AI:AUDIT_TRIGGERED',
  INSIGHT_RETRIEVED: 'AI:INSIGHT_RETRIEVED',
  CONTEXT_SHARED: 'AI:CONTEXT_SHARED',
};

export const AI_TRACE_LABELS = {
  DASHBOARD_LOAD: 'dashboard_load',
  FILE_INSIGHT: 'file_insight',
  STORAGE_REVIEW: 'storage_review',
  PERFORMANCE_TREND: 'performance_trend',
};

/**
 * ✅ Added: Insight types used in Dashboard.jsx and AIInsights.jsx
 */
export const AI_INSIGHTS_TYPES = {
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  STORAGE: 'storage',
  BEHAVIOR: 'user_behavior',
  COLLABORATION: 'collaboration',
  NAMING: 'naming',
  FILE_USAGE: 'file_usage',
  REDUNDANCY: 'redundancy',
  ERROR: 'error',
};
