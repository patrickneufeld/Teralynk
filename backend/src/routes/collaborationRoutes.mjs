// File Path: backend/routes/collaborationRoutes.js

const express = require('express');
const router = express.Router();

const collaborationEventController = require('../controllers/collaborationEventController');
const collaborationMetricsController = require('../controllers/collaborationMetricsController');
const collaborationNotificationController = require('../controllers/collaborationNotificationController');
const collaborationSessionController = require('../controllers/collaborationSessionController');
const collaborationAnalyticsController = require('../controllers/collaborationAnalyticsController');

// Collaboration session routes
router.post('/sessions', collaborationSessionController.startSession);
router.delete('/sessions/:id', collaborationSessionController.endSession);
router.get('/sessions/:id', collaborationSessionController.getSessionDetails);
router.get('/sessions', collaborationSessionController.getActiveSessions);

// Collaboration event routes
router.post('/events/participant-join', collaborationEventController.participantJoinEvent);
router.post('/events/participant-leave', collaborationEventController.participantLeaveEvent);
router.post('/events/session-update', collaborationEventController.sessionUpdateEvent);
router.post('/events/session-completion', collaborationEventController.sessionCompletionEvent);
router.post('/events/archive', collaborationEventController.archiveSessionEvent);

// Collaboration metrics routes
router.get('/metrics', collaborationMetricsController.getCollaborationMetrics);
router.post('/metrics/reset', collaborationMetricsController.resetCollaborationMetrics);

// Collaboration notification routes
router.post('/notifications/user', collaborationNotificationController.sendUserNotification);
router.post('/notifications/all', collaborationNotificationController.sendAllUsersNotification);
router.post('/notifications/global', collaborationNotificationController.sendGlobalNotification);

// Collaboration analytics routes
router.post('/analytics/session', collaborationAnalyticsController.recordNewSession);
router.post('/analytics/edit', collaborationAnalyticsController.recordEdit);
router.post('/analytics/user', collaborationAnalyticsController.addActiveUser);
router.delete('/analytics/user', collaborationAnalyticsController.removeActiveUser);
router.get('/analytics', collaborationAnalyticsController.getAnalytics);

export default router;
