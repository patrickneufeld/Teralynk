# Migration Guide for Unified Logging System

This document provides guidance on migrating from the multiple logging utilities to the new unified logging system.

## Step 1: Update Imports

Replace imports from the old logging utilities with imports from the new unified system:

### Before:

```javascript
// Various import patterns you might have been using
import { logError } from '../utils/ErrorHandler';
import logger from '../utils/logger';
import { logDebug, logInfo, logWarning } from '../utils/logger';
import { logInfo, logWarning, logError } from '../utils/loggingService';
import { logAuditEvent } from '../utils/auditLogger';
```

### After:

```javascript
// Single import location
import logger from '../utils/logging';

// Or import specific functions
import { debug, info, warn, error, critical, logAudit } from '../utils/logging';

// For error handling utilities
import { getErrorMessage, handleWithErrorLogging } from '../utils/logging';
```

## Step 2: Update Function Calls

Update your logging function calls to use the new API:

### Before:

```javascript
// ErrorHandler.js style
logError('ComponentName', error);

// logger.js style
logger.logDebug('Debug message', { data }, 'Context');
logger.logInfo('Info message', { data }, 'Context');
logger.logWarning('Warning message', { data }, 'Context');
logError(error, 'Context');

// loggingService.js style
logInfo('Message', 'Context', 'requestId');
logWarning('Message', 'Context', 'requestId');
logError(error, 'Context', 'requestId');

// auditLogger.js style
logAuditEvent('USER_LOGIN', { userId: '123' });
```

### After:

```javascript
// New unified style
logger.debug('Debug message', { data }, 'Context');
logger.info('Info message', { data }, 'Context');
logger.warn('Warning message', { data }, 'Context');
logger.error(error, 'Context', { additionalData });
logger.critical(error, 'Context', { additionalData });

// For audit events
logger.logAudit('USER_LOGIN', { userId: '123' });
```

## Step 3: Update Error Handling

Replace error handling patterns with the new utilities:

### Before:

```javascript
// Using ErrorHandler.js
try {
  await someAsyncFunction();
} catch (err) {
  const errorId = logError('Component', err);
  showErrorToUser(`${getErrorMessage(err)} (Error ID: ${errorId})`);
}

// Using formatValidationErrors
import { formatValidationErrors } from '../utils/ErrorHandler';
const formErrors = formatValidationErrors(validationErrors);
```

### After:

```javascript
// Using handleWithErrorLogging
try {
  await logger.handleWithErrorLogging(async () => {
    return await someAsyncFunction();
  }, 'Component');
} catch (err) {
  showErrorToUser(err.message); // Error ID is already included
}

// Or manual approach
try {
  await someAsyncFunction();
} catch (err) {
  const errorId = logger.error(err, 'Component');
  showErrorToUser(`${logger.getErrorMessage(err)} (Error ID: ${errorId})`);
}

// Using formatValidationErrors
import { formatValidationErrors } from '../utils/logging';
const formErrors = formatValidationErrors(validationErrors);
```

## Step 4: Update Context-Specific Loggers

Replace context-specific logging patterns:

### Before:

```javascript
// Using logger.js
const authLogger = logger.createLogger('Authentication');
authLogger.debug('Debug message', { data });
authLogger.info('Info message', { data });
```

### After:

```javascript
// Using new unified logger
const authLogger = logger.createLogger('Authentication');
authLogger.debug('Debug message', { data });
authLogger.info('Info message', { data });
// API is the same, just import from the new location
```

## Step 5: Update ErrorBoundary Components

Replace the old ErrorBoundary with the new one:

### Before:

```javascript
import ErrorBoundary from '../components/ErrorBoundary';

// In your component
<ErrorBoundary componentName="YourComponent">
  <YourComponent />
</ErrorBoundary>
```

### After:

```javascript
import ErrorBoundary from '../utils/logging/ErrorBoundary';

// In your component - usage is the same
<ErrorBoundary componentName="YourComponent">
  <YourComponent />
</ErrorBoundary>
```

## Step 6: Configure the Logger (Optional)

Add configuration for the logger if needed:

```javascript
import { configure } from '../utils/logging';

// In your app initialization
configure({
  minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableRemote: process.env.NODE_ENV === 'production',
  errorRateLimit: {
    maxErrors: 10,
    timeWindow: 60000, // 1 minute
  }
});
```
