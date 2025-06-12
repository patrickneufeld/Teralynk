import { logDebug, logError, logWarn } from '../logger.mjs';

/**
 * ContextValidator: Enterprise-grade context validation engine
 */
export class ContextValidator {
  constructor(rules = []) {
    // Map of ruleId => { id, validate }
    this.rules = new Map(
      rules.map(rule => {
        if (!rule.id || typeof rule.validate !== 'function') {
          throw new Error('Invalid rule: must have an id and validate function');
        }
        return [rule.id, rule];
      })
    );
  }

  /**
   * Validate a context against all registered rules.
   * @param {Object} context - The context object to validate.
   * @returns {Promise<{ valid: boolean, violations: Array<{ruleId:string, message:string}> }>} 
   */
  async validate(context) {
    const violations = [];
    try {
      logDebug('Starting context validation', { context });
      for (const rule of this.rules.values()) {
        let result;
        try {
          result = await rule.validate(context);
        } catch (ruleError) {
          // Treat thrown errors as validation failures
          result = { valid: false, message: ruleError.message || 'Rule threw error' };
        }
        if (!result.valid) {
          violations.push({ ruleId: rule.id, message: result.message });
        }
      }
    } catch (err) {
      logError('ContextValidator.validate error', { error: err.stack });
      throw err;
    }

    if (violations.length) {
      logWarn('Context validation failed', { violations });
      return { valid: false, violations };
    }

    logDebug('Context validation succeeded');
    return { valid: true, violations: [] };
  }

  /**
   * Add a new validation rule at runtime.
   * @param {{id:string, validate:function}} rule
   */
  addRule(rule) {
    if (!rule.id || typeof rule.validate !== 'function') {
      throw new Error('Invalid rule format: must include id and validate function');
    }
    this.rules.set(rule.id, rule);
    logDebug('Rule added to ContextValidator', { ruleId: rule.id });
  }

  /**
   * Remove an existing rule by ID.
   * @param {string} ruleId
   */
  removeRule(ruleId) {
    if (!this.rules.delete(ruleId)) {
      throw new Error(`Cannot remove rule '${ruleId}': not found`);
    }
    logDebug('Rule removed from ContextValidator', { ruleId });
  }

  /**
   * Clear all validation rules.
   */
  clearRules() {
    this.rules.clear();
    logDebug('All rules cleared from ContextValidator');
  }
}

/**
 * Default set of validation rules for request context
 */
const defaultRules = [
  {
    id: 'userIdRequired',
    validate: (ctx) => ({ valid: Boolean(ctx.userId), message: 'userId is required' }),
  },
  {
    id: 'timestampValid',
    validate: (ctx) => ({ valid: typeof ctx.timestamp === 'number', message: 'timestamp must be a number' }),
  },
  {
    id: 'sourceValid',
    validate: (ctx) => ({ valid: ctx.source === 'trusted', message: 'Invalid source' }),
  },
];

/**
 * Singleton instance with default rules applied
 */
export const contextValidator = new ContextValidator(defaultRules);
