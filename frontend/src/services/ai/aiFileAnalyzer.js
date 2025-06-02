// /frontend/src/services/ai/aiFileAnalyzer.js

import apiClient from '@/api/apiClient';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '@/utils/logger';
import { emitSecurityEvent, SECURITY_EVENTS } from '@/utils/security/eventEmitter';
import { handleAPIError } from '@/utils/ErrorHandler';
import { logInfo, logError } from '@/utils/logging/logging';

const AI_FILE_ANALYZER_BASE = '/api/ai/file-analyzer';

/**
 * Internal helper to inject secure headers with trace and token context
 */
const buildHeaders = async (traceId = getTraceId()) => {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Trace-Id': traceId,
  };
};

/**
 * Start new AI file analysis job
 */
export const startAnalysis = async (file, { traceId, userId, context = "default" } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("context", context);
    formData.append("userId", userId);

    const response = await apiClient.post(`${AI_FILE_ANALYZER_BASE}/start`, formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
    });

    logInfo("AI File Analysis Started", { traceId, fileName: file.name });
    return response.data.analysisId;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_ANALYSIS_START_FAILED, {
      traceId,
      context,
      error,
    });
    throw handleAPIError(error, 'AI analysis initiation failed');
  }
};

/**
 * Analyze a file by ID
 */
export const analyzeFile = async (fileId, { traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.get(`${AI_FILE_ANALYZER_BASE}/analyze/${fileId}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_FILE_ANALYSIS_FAILED, {
      traceId,
      context: "analyzeFile",
      fileId,
      error,
    });
    throw handleAPIError(error, 'AI File Analysis Failed');
  }
};

/**
 * Analyze content before upload: language, category, insights
 */
export const analyzeContent = async (file, { traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(`${AI_FILE_ANALYZER_BASE}/analyze-content`, formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_CONTENT_ANALYSIS_FAILED, {
      traceId,
      context: "analyzeContent",
      error,
    });
    throw handleAPIError(error, 'AI File Content Analysis Failed');
  }
};

/**
 * Complete AI analysis and fetch results
 */
export const completeAnalysis = async (analysisId, { traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.post(`${AI_FILE_ANALYZER_BASE}/complete/${analysisId}`, {}, { headers });
    return response.data.results;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_ANALYSIS_COMPLETION_FAILED, {
      traceId,
      context: "completeAnalysis",
      analysisId,
      error,
    });
    throw handleAPIError(error, 'Failed to complete AI analysis');
  }
};

/**
 * Verify file integrity post-download
 */
export const verifyFileIntegrity = async (blob, { traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const formData = new FormData();
    formData.append("file", blob);

    const response = await apiClient.post(`${AI_FILE_ANALYZER_BASE}/verify-integrity`, formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_FILE_INTEGRITY_FAILED, {
      traceId,
      context: "verifyFileIntegrity",
      error,
    });
    throw handleAPIError(error, 'File Integrity Check Failed');
  }
};

/**
 * Analyze deletion impact before removing a file
 */
export const analyzeDeletionImpact = async (fileId, { traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.get(`${AI_FILE_ANALYZER_BASE}/deletion-impact/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_DELETION_IMPACT_FAILED, {
      traceId,
      context: "analyzeDeletionImpact",
      fileId,
      error,
    });
    throw handleAPIError(error, 'Deletion Impact Analysis Failed');
  }
};

/**
 * Debug errors through AI error analyzer
 */
export const analyzeError = async (errorObj, { traceId, context = "unknown", userId, fileId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const payload = {
      context,
      userId,
      fileId,
      error: errorObj?.message || String(errorObj),
    };

    const response = await apiClient.post(`${AI_FILE_ANALYZER_BASE}/debug-error`, payload, { headers });
    return response.data;
  } catch (err) {
    logError("AI Error Debugging Failed", err);
    return { suggestedAction: "Please retry later or contact support." };
  }
};

/**
 * Fetch previously stored AI results
 */
export const fetchAnalysisResults = async (fileId, { traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.get(`${AI_FILE_ANALYZER_BASE}/results/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_ANALYSIS_RESULTS_FETCH_FAILED, {
      traceId,
      context: "fetchAnalysisResults",
      error,
    });
    throw handleAPIError(error, 'AI File Analysis Results Fetch Failed');
  }
};
