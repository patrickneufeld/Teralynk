// File Path: backend/middleware/collaborationValidationMiddleware.js

/**
 * Middleware to validate the input for starting a collaboration session.
 * Ensures fileId and participants are provided.
 */
const validateSessionStart = (req, res, next) => {
  const { fileId, participants } = req.body;

  if (!fileId || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid session data. fileId and participants are required, and participants should be an array.',
    });
  }

  next();
};

/**
* Middleware to validate the input for ending a collaboration session.
* Ensures sessionId is provided.
*/
const validateSessionEnd = (req, res, next) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Session ID is required to end the session.',
    });
  }

  next();
};

/**
* Middleware to validate that a session ID is valid before proceeding with certain actions.
* Ensures that the session ID exists in the active session list.
*/
const validateSessionExists = (req, res, next) => {
  const { sessionId } = req.params;

  // Ensure activeSessions is defined or passed to the app (for example, from a database or in-memory store)
  const activeSessions = req.app.get('activeSessions') || new Map();

  if (!sessionId || !activeSessions.has(sessionId)) {
    return res.status(404).json({
      success: false,
      error: 'Session not found or invalid session ID.',
    });
  }

  next();
};

// ES module export syntax
export {
  validateSessionStart,
  validateSessionEnd,
  validateSessionExists,
};
