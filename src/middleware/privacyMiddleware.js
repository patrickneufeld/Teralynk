const { enforceDataPrivacy } = require('../services/aiInsightsService');
const { logAuditEvent } = require('../services/auditLogService');

// Middleware to enforce privacy for AI insights
const privacyMiddleware = (entityType) => {
    return (req, res, next) => {
        try {
            const requestingUserId = req.userId; // Assume injected by authentication middleware
            const requestingUserRole = req.role; // Assume role is set by authMiddleware (Admin, Editor, Viewer, etc.)

            // **Step 1: Extract entity ID from params, body, or query**
            const targetEntityId = req.params.entityId || req.body.entityId || req.query.entityId;

            if (!requestingUserId) {
                logAuditEvent('MISSING_USER_ID', { userId: null, targetEntityId, route: req.originalUrl });
                return res.status(401).json({ error: 'Authentication required. User ID not found.' });
            }

            if (!targetEntityId) {
                logAuditEvent('MISSING_ENTITY_ID', { userId: requestingUserId, route: req.originalUrl });
                return res.status(400).json({ error: 'Entity ID is required to access this resource.' });
            }

            // **Step 2: Admins bypass privacy enforcement**
            if (requestingUserRole && requestingUserRole.toLowerCase() === 'admin') {
                console.log('Admin access granted for:', requestingUserId);
                return next();
            }

            // **Step 3: Call the privacy enforcement function**
            const hasAccess = enforceDataPrivacy(requestingUserId, targetEntityId, entityType);

            if (!hasAccess) {
                logAuditEvent('ACCESS_DENIED', { userId: requestingUserId, targetEntityId, route: req.originalUrl });
                return res.status(403).json({ error: 'Access denied. Unauthorized access to entity data.' });
            }

            next();
        } catch (error) {
            console.error('Privacy enforcement error:', error);
            res.status(500).json({ error: 'Internal server error while enforcing privacy.' });
        }
    };
};

module.exports = privacyMiddleware;
