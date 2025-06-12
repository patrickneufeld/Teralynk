import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/utils/ai/StateValidator.js
import { logDebug, logError } from '../logger.mjs'; // Adjust path if needed

export class StateValidator {
  constructor(oldState, newState) {
    this.oldState = oldState;
    this.newState = newState;
  }

  async verify() {
    try {
      const validationResult = this.performValidation();
      logDebug('State transition validated', validationResult);
      return validationResult;
    } catch (error) {
      logError('State validation failed', { error: error.message });
      throw error; // Re-throw for higher-level handling
    }
  }

  performValidation() {
    // Implement your specific state transition logic here.
    // This example checks for required fields and data types.
    const requiredFields = ['status', 'data'];
    const validDataTypes = {
      status: 'string',
      data: 'object',
    };

    const violations = [];
    for (const field of requiredFields) {
      if (!this.newState.hasOwnProperty(field)) {
        violations.push(`Missing required field: ${field}`);
      } else if (typeof this.newState[field] !== validDataTypes[field]) {
        violations.push(`Invalid data type for ${field}: Expected ${validDataTypes[field]}, got ${typeof this.newState[field]}`);
      }
    }

    const isValid = violations.length === 0;
    return {
      valid: isValid,
      changes: isValid ? this.calculateChanges() : [],
      violations,
    };
  }

  calculateChanges() {
    // Calculate the changes between the old and new state.
    const changes = [];
    for (const key in this.newState) {
      if (this.newState.hasOwnProperty(key) && this.newState[key] !== this.oldState[key]) {
        changes.push({
          field: key,
          oldValue: this.oldState[key],
          newValue: this.newState[key],
        });
      }
    }
    return changes;
  }
}

