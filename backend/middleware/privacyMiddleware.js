// File: /backend/middleware/privacyMiddleware.js

const { enforceDataPrivacy } = require('../services/aiInsightsService');

// Middleware to enforce privacy for AI insights
const privacyMiddleware = (entityType) => {
    return (req, res, next) => {
        try {
            const requestingEntityId = req.userId; // Assume injected by authentication middleware
            const targetEntityId = req.params.entityId || req.body.entityId;

            if (!requestingEntityId || !targetEntityId) {
                return res.status(400).json({ error: 'Entity ID is required.' });
            }

            enforceDataPrivacy(requestingEntityId, targetEntityId);
            next();
        } catch (error) {
            console.error('Privacy enforcement error:', error);
            res.status(403).json({ error: 'Access denied: Unauthorized access to entity data.' });
        }
    };
};

module.exports = privacyMiddleware;
