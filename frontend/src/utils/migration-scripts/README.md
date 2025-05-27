# Logging Migration Scripts

These scripts help you migrate from the old logging utilities to the new unified logging system.

## Migration Process

1. **Analyze your codebase**:
   ```
   node migrate-logging.js
   ```
   This will scan your project and identify files that need to be updated.

2. **Update imports**:
   ```
   chmod +x update-imports.sh
   ./update-imports.sh
   ```
   This will replace old logging imports with the new unified logging system.

3. **Update function calls**:
   ```
   chmod +x update-function-calls.sh
   ./update-function-calls.sh
   ```
   This will replace old logging function calls with the new API.

4. **Manual review**:
   After running the automated scripts, you should manually review the changes to ensure everything was updated correctly. Pay special attention to:
   - Complex logging calls with multiple parameters
   - Context-specific loggers
   - Error boundary components

5. **Testing**:
   Test your application thoroughly to ensure all logging works as expected.

6. **Remove old files**:
   ```
   chmod +x remove-old-files.sh
   ./remove-old-files.sh
   ```
   This will remove the old logging files that are no longer needed.

## Important Notes

- The automated scripts are a starting point, but manual review is essential
- Some complex logging patterns may need manual updates
- Make sure to test thoroughly before removing the old files
- Consider running the migration in a feature branch first

## Troubleshooting

If you encounter issues during migration:

1. Check the console for error messages
2. Review the migration guide in `/src/utils/logging/migration.md`
3. Compare your code with the examples in `/src/utils/logging/README.md`
