import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// /backend/src/ai/claudeStreamHandler.js
// /backend/src/ai/claudeStreamHandler.js

import { logInfo, logError } from '../utils/logger.mjs';
import { recordEventTelemetry } from './aiTelemetryService.mjs';
import { createClaudeStream } from './providers/claudeAPIClient.mjs';
import { PassThrough } from 'stream';

/**
 * Stream Claude AI response with live token dispatch
 * Supports SSE and WebSocket relay.
 * 
 * @param {Object} params
 * @param {string} params.prompt - Prompt string to send to Claude
 * @param {string} params.userId - Requesting user
 * @param {string} params.traceId - Trace ID for telemetry and traceability
 * @param {Object} [params.res] - Optional Express response stream (for SSE)
 * @param {Function} [params.onToken] - Optional callback for each token
 * @param {number} [params.maxTokens=1000] - Claude token cap
 * @returns {Promise<string>} Full completed text response
 */
export async function streamClaudeResponse({
  prompt,
  userId,
  traceId,
  res = null,
  onToken = null,
  maxTokens = 1000,
}) {
  const stream = new PassThrough();
  let result = '';
  let tokenCount = 0;

  try {
    logInfo(`🔁 Claude streaming started. Trace: ${traceId}`);

    const claudeStream = await createClaudeStream({
      prompt,
      maxTokens,
      traceId,
    });

    claudeStream.on('data', chunk => {
      const token = chunk.toString();
      result += token;
      tokenCount++;

      if (onToken) onToken(token);
      if (res) res.write(`data: ${token}\n\n`);
    });

    claudeStream.on('end', async () => {
      if (res) res.end();
      await recordEventTelemetry('claude_stream_complete', {
        userId,
        traceId,
        tokens: tokenCount,
        completed: true,
      });
      logInfo(`✅ Claude streaming finished. Trace: ${traceId}`);
    });

    claudeStream.on('error', async (error) => {
      logError('🛑 Claude stream failed', error);
      await recordEventTelemetry('claude_stream_error', {
        userId,
        traceId,
        error: error.message,
      });
      if (res) res.end(`event: error\ndata: ${error.message}\n\n`);
    });

    claudeStream.pipe(stream);
  } catch (error) {
    logError('❌ Claude streaming setup failed', error);
    await recordEventTelemetry('claude_stream_init_failure', {
      userId,
      traceId,
      error: error.message,
    });
    throw error;
  }

  return result;
}
