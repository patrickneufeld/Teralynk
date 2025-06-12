#!/bin/bash

# Script to remove old logging files after migration is complete

echo "Removing old logging files..."

# Remove old logging files
rm -f ../../utils/logger.js
rm -f ../../utils/ErrorHandler.js
rm -f ../../utils/loggingService.js
rm -f ../../utils/auditLogger.js
rm -f ../../components/ErrorBoundary.jsx

echo "Old logging files removed!"
