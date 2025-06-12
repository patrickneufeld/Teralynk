// File: /backend/src/errors/CustomErrors.js

/**
 * Base class for custom system errors with structured telemetry support.
 */
class BaseCustomError extends Error {
  constructor(message, name, code, context = {}) {
    super(message);
    this.name = name;
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }
}

class SecurityValidationError extends BaseCustomError {
  constructor(validations = {}) {
    super('Security validation failed', 'SecurityValidationError', 'SECURITY_VALIDATION_FAILED', { validations });
  }
}

class DeploymentVerificationError extends BaseCustomError {
  constructor(errors = []) {
    super('Deployment verification failed', 'DeploymentVerificationError', 'DEPLOYMENT_VERIFICATION_FAILED', { errors });
  }
}

class UpdateVerificationError extends BaseCustomError {
  constructor(verification = {}) {
    super('Update verification failed', 'UpdateVerificationError', 'UPDATE_VERIFICATION_FAILED', { verification });
  }
}

class RecoveryExecutionError extends BaseCustomError {
  constructor(error, recoveryId) {
    super('Recovery execution failed', 'RecoveryExecutionError', 'RECOVERY_EXECUTION_FAILED', {
      originalError: error,
      recoveryId
    });
  }
}

class OptimizationNotEffectiveError extends BaseCustomError {
  constructor(impact = {}) {
    super('Optimization not effective', 'OptimizationNotEffectiveError', 'OPTIMIZATION_NOT_EFFECTIVE', { impact });
  }
}

class FaultToleranceError extends BaseCustomError {
  constructor(error, faultId) {
    super('Fault tolerance error', 'FaultToleranceError', 'FAULT_TOLERANCE_ERROR', {
      originalError: error,
      faultId
    });
  }
}

class ErrorHandlingFailedError extends BaseCustomError {
  constructor(errorId, recoveryError) {
    super('Error handling failed', 'ErrorHandlingFailedError', 'ERROR_HANDLING_FAILED', {
      errorId,
      recoveryError
    });
  }
}

class SystemInitializationError extends BaseCustomError {
  constructor(error, initId) {
    super('System initialization failed', 'SystemInitializationError', 'SYSTEM_INITIALIZATION_FAILED', {
      originalError: error,
      initId
    });
  }
}

class CoordinationError extends BaseCustomError {
  constructor(error, coordinationId) {
    super('Coordination failed', 'CoordinationError', 'COORDINATION_FAILED', {
      originalError: error,
      coordinationId
    });
  }
}

class UnsupportedProtocolError extends BaseCustomError {
  constructor(protocolId) {
    super('Unsupported protocol', 'UnsupportedProtocolError', 'UNSUPPORTED_PROTOCOL', { protocolId });
  }
}

class RecoveryPhaseFailedError extends BaseCustomError {
  constructor(phase, result) {
    super('Recovery phase failed', 'RecoveryPhaseFailedError', 'RECOVERY_PHASE_FAILED', {
      phase,
      result
    });
  }
}

class DeploymentHealthCheckError extends BaseCustomError {
  constructor(health = {}) {
    super('Deployment health check failed', 'DeploymentHealthCheckError', 'DEPLOYMENT_HEALTH_CHECK_FAILED', { health });
  }
}

class ModelExecutionError extends BaseCustomError {
  constructor(message = 'Model execution failed', metadata = {}) {
    super(message, 'ModelExecutionError', 'MODEL_EXECUTION_FAILED', { metadata });
  }
}

export {
  SecurityValidationError,
  DeploymentVerificationError,
  UpdateVerificationError,
  RecoveryExecutionError,
  OptimizationNotEffectiveError,
  FaultToleranceError,
  ErrorHandlingFailedError,
  SystemInitializationError,
  CoordinationError,
  UnsupportedProtocolError,
  RecoveryPhaseFailedError,
  DeploymentHealthCheckError,
  ModelExecutionError
};
