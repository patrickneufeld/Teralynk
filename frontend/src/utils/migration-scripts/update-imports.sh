#!/bin/bash

# Script to update imports in all project files
# This will replace old logging imports with the new unified logging system

echo "Updating imports in project files..."

# Replace ErrorHandler imports
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { logError } from "..\/utils\/ErrorHandler"/import logger from "..\/utils\/logging"/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { getErrorMessage } from "..\/utils\/ErrorHandler"/import { getErrorMessage } from "..\/utils\/logging"/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import ErrorHandler from "..\/utils\/ErrorHandler"/import logger from "..\/utils\/logging"/g'

# Replace logger imports
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import logger from "..\/utils\/logger"/import logger from "..\/utils\/logging"/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { logDebug } from "..\/utils\/logger"/import { debug } from "..\/utils\/logging"/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { logInfo } from "..\/utils\/logger"/import { info } from "..\/utils\/logging"/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { logWarning } from "..\/utils\/logger"/import { warn } from "..\/utils\/logging"/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { logError } from "..\/utils\/logger"/import { error } from "..\/utils\/logging"/g'

# Replace loggingService imports
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { logInfo } from "..\/utils\/loggingService"/import { info } from "..\/utils\/logging"/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { logWarning } from "..\/utils\/loggingService"/import { warn } from "..\/utils\/logging"/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { logError } from "..\/utils\/loggingService"/import { error } from "..\/utils\/logging"/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { logDebug } from "..\/utils\/loggingService"/import { debug } from "..\/utils\/logging"/g'

# Replace auditLogger imports
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { logAuditEvent } from "..\/utils\/auditLogger"/import { logAudit } from "..\/utils\/logging"/g'

# Replace ErrorBoundary imports
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import ErrorBoundary from "..\/components\/ErrorBoundary"/import ErrorBoundary from "..\/utils\/logging\/ErrorBoundary"/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/import { createErrorBoundaryHandlers } from "..\/components\/ErrorBoundary"/import { createErrorBoundaryHandlers } from "..\/utils\/logging\/ErrorBoundary"/g'

echo "Import updates complete!"
