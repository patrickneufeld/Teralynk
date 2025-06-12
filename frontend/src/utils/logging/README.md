# Unified Logging System

This module provides a centralized logging system for the Teralynk frontend application, combining features from multiple logging utilities into a single, consistent API.

## Features

- **Unified API**: Consistent interface for all logging needs
- **Multiple Log Levels**: Debug, Info, Warning, Error, Critical
- **Context-Based Logging**: Create loggers for specific components or modules
- **Rate Limiting**: Prevent flooding logs with repeated errors
- **Remote Logging**: Send logs to backend service
- **Error Handling**: Utilities for handling and formatting errors
- **Audit Logging**: Special handling for audit events

## Basic Usage

```javascript
import logger from '../utils/logging';

// Simple logging
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error(new Error('Something went wrong'));
logger.critical(new Error('Critical system failure'));

// With context
logger.info('User logged in', { userId: '123' }, 'Authentication');

// Create a context-specific logger
const authLogger = logger.createLogger('Authentication');
authLogger.info('User logged in', { userId: '123' });
authLogger.error(new Error('Login failed'));

// Error handling wrapper
try {
  await logger.handleWithErrorLogging(async () => {
    // Your code here
  }, 'YourComponent');
} catch (err) {
  // Error is already logged, handle UI feedback
}

// Audit logging
logger.logAudit('USER_LOGIN', { userId: '123', method: 'password' });
```

## Configuration

You can configure the logging system with:

```javascript
import logger, { configure } from '../utils/logging';

configure({
  minLevel: 'info',              // Minimum log level to output
  enableConsole: true,           // Enable console logging
  enableRemote: true,            // Enable remote logging
  remoteLogLevels: ['error', 'critical'], // Levels to send to remote
  errorRateLimit: {
    maxErrors: 5,                // Max errors per time window
    timeWindow: 60000,           // Time window in ms (1 minute)
    perErrorType: true           // Rate limit per error type
  }
});
```

## Error Handling

The system provides utilities for handling errors:

```javascript
import { getErrorMessage, handleWithErrorLogging } from '../utils/logging';

// Get user-friendly error message
const message = getErrorMessage(error);

// Handle errors with automatic logging
const result = await handleWithErrorLogging(async () => {
  // Your async code here
  return data;
}, 'ComponentName');
```

## Migration Guide

To migrate from the old logging systems:

1. Replace imports:
   ```javascript
   // Old
   import { logError } from '../utils/ErrorHandler';
   import logger from '../utils/logger';
   import { logInfo } from '../utils/loggingService';
   import { logAuditEvent } from '../utils/auditLogger';
   
   // New
   import logger, { error, info, logAudit } from '../utils/logging';
   ```

2. Replace function calls:
   ```javascript
   // Old
   logError('Context', error);
   logger.logInfo('Message', data, 'Context');
   logInfo('Message', 'Context');
   logAuditEvent('EVENT', data);
   
   // New
   logger.error(error, 'Context');
   logger.info('Message', data, 'Context');
   logger.info('Message', {}, 'Context');
   logger.logAudit('EVENT', data);
   ```
