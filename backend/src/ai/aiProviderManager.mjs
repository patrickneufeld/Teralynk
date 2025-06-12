import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError, logWarn } from '../utils/logger.mjs';
import { recordEventTelemetry } from './aiTelemetryService.mjs';
import { validateQueryInput, fingerprintPrompt } from './aiIntegration.mjs';
import { exponentialBackoff } from '../utils/errorManager.mjs';
import { hasClaudeAccess } from '../services/common/rbacService.mjs';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/complete';
const DEFAULT_MODEL = 'claude-3-haiku-20240307';
const MAX_ALLOWED_TOKENS = 1000;
const DEFAULT_TIMEOUT_MS = 12000;

/**
 * Low-level Claude query execution with full metadata
 */
async function rawClaudeRequest(query, { traceId, timeoutMs }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY');

  const prompt = `\n\nHuman: ${query}\n\nAssistant:`;

  const headers = {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'content-type': 'application/json',
    'x-trace-id': traceId,
  };

  const payload = {
    model: DEFAULT_MODEL,
    prompt,
    max_tokens_to_sample: MAX_ALLOWED_TOKENS,
  };

  const res = await axios.post(CLAUDE_API_URL, payload, { headers, timeout: timeoutMs });
  return res?.data || {};
}

/**
 * Execute Claude request with validation, telemetry, and retry metadata
 */
export async function queryClaude(query, {
  userId = null,
  traceId = uuidv4(),
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  const sanitized = validateQueryInput(query);
  const fingerprint = fingerprintPrompt(sanitized);
  const meta = {
    traceId,
    userId,
    platform: 'claude',
    model: DEFAULT_MODEL,
    fingerprint,
    query: sanitized,
  };

  try {
    logInfo('📡 Dispatching Claude AI request...', meta);
    const result = await rawClaudeRequest(sanitized, { traceId, timeoutMs });

    const tokensUsed = result?.completion?.length || 0;
    if (tokensUsed > MAX_ALLOWED_TOKENS) {
      logWarn(`⚠️ Claude response near token ceiling: ${tokensUsed}`);
    }

    await recordEventTelemetry('ai_claude_success', { ...meta, tokensUsed, result });
    return result;
  } catch (err) {
    const errorMsg = err?.response?.data?.error?.message || err.message;
    const isRateLimit = err?.response?.status === 429;

    await recordEventTelemetry('ai_claude_failure', {
      ...meta,
      error: errorMsg,
      code: err?.response?.status || 500,
    });

    if (isRateLimit) {
      logWarn(`⚠️ Claude rate limit hit for trace ${traceId}`);
    }

    logError('🛑 Claude AI request failed.', { ...meta, error: errorMsg });
    throw new Error(`Claude request failed: ${errorMsg}`);
  }
}

/**
 * Retry wrapper for Claude queries
 */
async function withRetry(fn, retries = 3) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;

      const delay = exponentialBackoff(attempt);
      logWarn(`🔁 Claude retry ${attempt}/${retries} in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

/**
 * Claude query with RBAC and retry enforcement
 */
export async function dispatchClaudeQuery(query, options = {}) {
  const { userId, traceId = uuidv4() } = options;

  // RBAC enforcement
  if (userId && !(await hasClaudeAccess(userId))) {
    await recordEventTelemetry('ai_rbac_denied', {
      userId,
      traceId,
      platform: 'claude',
      reason: 'RBAC restriction',
    });
    throw new Error('Access denied: User lacks Claude access permissions.');
  }

  return withRetry(() => queryClaude(query, { ...options, traceId }));
}
