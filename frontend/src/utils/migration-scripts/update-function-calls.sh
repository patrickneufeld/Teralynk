#!/bin/bash

# Script to update function calls in all project files
# This will replace old logging function calls with the new unified logging system

echo "Updating function calls in project files..."

# Replace console.* calls
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/console\.log(/logger.info(/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/console\.error(/logger.error(/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/console\.warn(/logger.warn(/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/console\.info(/logger.info(/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/console\.debug(/logger.debug(/g'

# Replace ErrorHandler function calls
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/logError(/logger.error(/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/getErrorMessage(/logger.getErrorMessage(/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/handleWithErrorLogging(/logger.handleWithErrorLogging(/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/formatValidationErrors(/logger.formatValidationErrors(/g'

# Replace logger function calls
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/logDebug(/logger.debug(/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/logInfo(/logger.info(/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/logWarning(/logger.warn(/g'
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/logCritical(/logger.critical(/g'

# Replace loggingService function calls
# (These are already covered by the replacements above)

# Replace auditLogger function calls
find ../.. -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/logAuditEvent(/logger.logAudit(/g'

echo "Function call updates complete!"
