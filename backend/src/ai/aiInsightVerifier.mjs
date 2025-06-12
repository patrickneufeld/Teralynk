
function sanitize(input) {
  return String(input).replace(/[^a-zA-Z0-9@_\-:. ]/g, '').trim();
}


import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// aiInsightVerifier.js
import { calculateInsightChecksum } from './aiInsightChecksum.mjs';
import { validateInsightSchema } from './aiInsightValidator.mjs';
import logger from '../utils/logger.mjs';

export function verifyInsight(insight) {
  const schemaValid = validateInsightSchema(insight);
  const checksum = calculateInsightChecksum(insight);
  const hasRequiredFields = insight && insight.id && insight.category && insight.severity;

  const valid = schemaValid && hasRequiredFields && typeof checksum === 'string';

  logger.debug('Insight verification complete', {
    valid,
    schemaValid,
    hasRequiredFields,
    checksum
  });

  return {
    valid,
    schemaValid,
    checksum,
    hasRequiredFields
  };
}


// TODO: Implement rate limiting logic to avoid API abuse (e.g., token bucket or middleware).