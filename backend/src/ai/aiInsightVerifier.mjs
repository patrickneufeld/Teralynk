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
