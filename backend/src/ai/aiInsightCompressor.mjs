import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// /backend/src/ai/aiInsightCompressor.js

import zlib from 'zlib';
import crypto from 'crypto';
import { performance } from 'perf_hooks';

const MAX_SIZE_BEFORE_COMPRESSION = 2048; // bytes
const COMPRESSION_ALGO = 'gzip';

/**
 * Compresses a string or JSON object if over threshold.
 * @param {string|object} payload - Insight or log payload.
 * @returns {Promise<{compressed: boolean, data: Buffer, originalSize: number, compressedSize: number}>}
 */
export async function compressInsight(payload) {
  const raw = Buffer.from(
    typeof payload === 'string' ? payload : JSON.stringify(payload)
  );

  if (raw.length < MAX_SIZE_BEFORE_COMPRESSION) {
    return {
      compressed: false,
      data: raw,
      originalSize: raw.length,
      compressedSize: raw.length,
    };
  }

  const start = performance.now();
  const compressed = await new Promise((resolve, reject) => {
    zlib.gzip(raw, { level: zlib.constants.Z_BEST_COMPRESSION }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

  return {
    compressed: true,
    data: compressed,
    originalSize: raw.length,
    compressedSize: compressed.length,
    durationMs: performance.now() - start,
  };
}

/**
 * Decompresses a previously compressed insight.
 * @param {Buffer} compressedBuffer
 * @returns {Promise<string>}
 */
export async function decompressInsight(compressedBuffer) {
  return new Promise((resolve, reject) => {
    zlib.gunzip(compressedBuffer, (err, buffer) => {
      if (err) return reject(err);
      resolve(buffer.toString());
    });
  });
}
