// File Path: backend/collaboration/conflictResolutionService.js

/**
 * Resolves conflicts in collaboration sessions by merging changes.
 * @param {object} baseContent - The original content.
 * @param {object} userChanges - Changes made by the user.
 * @param {object} collaboratorChanges - Changes made by collaborators.
 * @returns {object} - Resolved content and details of conflicts.
 */
const resolveConflicts = (baseContent, userChanges, collaboratorChanges) => {
    if (!baseContent || !userChanges || !collaboratorChanges) {
        throw new Error('Base content, user changes, and collaborator changes are required.');
    }

    const resolvedContent = { ...baseContent };
    const conflicts = [];

    for (const [key, userValue] of Object.entries(userChanges)) {
        const collaboratorValue = collaboratorChanges[key];

        if (collaboratorValue && collaboratorValue !== baseContent[key]) {
            if (userValue === baseContent[key]) {
                // Apply collaborator changes if the user didn't modify the field
                resolvedContent[key] = collaboratorValue;
            } else if (collaboratorValue !== userValue) {
                // A conflict exists when both user and collaborator modify the same field differently
                conflicts.push({
                    field: key,
                    baseValue: baseContent[key],
                    userValue,
                    collaboratorValue,
                });
                resolvedContent[key] = `${userValue} | CONFLICT | ${collaboratorValue}`;
            }
        } else {
            // Apply user changes
            resolvedContent[key] = userValue;
        }
    }

    return { resolvedContent, conflicts };
};

/**
 * Logs conflict resolution details for auditing purposes.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {object} conflictDetails - Details of the resolved conflicts.
 */
const logConflictResolution = (sessionId, conflictDetails) => {
    if (!sessionId || !conflictDetails) {
        throw new Error('Session ID and conflict details are required.');
    }

    console.log(`Conflict resolution for session ${sessionId}:`, conflictDetails);
};

module.exports = {
    resolveConflicts,
    logConflictResolution,
};
