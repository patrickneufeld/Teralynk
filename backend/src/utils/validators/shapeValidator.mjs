// File: /backend/src/utils/validators/shapeValidator.js

import { SecurityValidationError } from '../../errors/CustomErrors.mjs';
import { logError } from '../logger.mjs';

/**
 * Generates a trace ID for logging and error correlation.
 * Uses base36 timestamp + random component for uniqueness.
 * @returns {string} traceId
 */
function getTraceId(prefix = 'trace') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Validates that each item in the dataset matches the expected schema shape.
 * @param {Array<Object>} dataArray - The input data array to validate.
 * @param {Object} expectedSchema - The schema object with required keys and types.
 * @throws {SecurityValidationError} if validation fails
 */
export function validatePayloadShape(dataArray, expectedSchema) {
  const traceId = getTraceId();

  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    const msg = 'Input data must be a non-empty array';
    logError(msg, { traceId });
    throw new SecurityValidationError(msg);
  }

  for (const [index, item] of dataArray.entries()) {
    for (const key of Object.keys(expectedSchema)) {
      const expectedType = expectedSchema[key];
      const actualValue = item[key];

      if (actualValue === undefined) {
        const msg = `Missing key "${key}" in item at index ${index}`;
        logError(msg, { traceId });
        throw new SecurityValidationError(msg);
      }

      if (typeof actualValue !== expectedType) {
        const msg = `Type mismatch for key "${key}" at index ${index}. Expected ${expectedType}, got ${typeof actualValue}`;
        logError(msg, { traceId });
        throw new SecurityValidationError(msg);
      }
    }
  }
}
