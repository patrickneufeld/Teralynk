/**
 * Backend Session Manager
 * Simplified version for backend service context
 */

import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError } from './logging/logging.mjs';
import { emitSecurityEvent } from './security/eventEmitter.mjs';

const DEFAULT_CONFIG = {
    sessionTTL: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000,  // 1 hour
    maxSessionsPerUser: 5
};

class SessionManager {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.sessions = new Map();
        this.traceIds = new Map();
        this.userSessions = new Map();
        
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }

    /**
     * Gets or creates a trace ID
     * @returns {string} Trace ID
     */
    getTraceId() {
        const traceId = uuidv4();
        this.traceIds.set(traceId, {
            timestamp: Date.now(),
            active: true
        });
        return traceId;
    }

    /**
     * Gets the current session ID
     * @returns {string} Session ID
     */
    getSessionId() {
        return process.env.SERVICE_SESSION_ID || uuidv4();
    }

    /**
     * Gets service user agent
     * @returns {string} User agent string
     */
    getUserAgent() {
        return `TeralynkBackendService/${process.env.npm_package_version || '1.0.0'}`;
    }

    /**
     * Creates a new session
     * @param {string} userId 
     * @param {Object} metadata 
     * @returns {Object} Session info
     */
    createSession(userId, metadata = {}) {
        const sessionId = uuidv4();
        const session = {
            id: sessionId,
            userId,
            metadata,
            created: Date.now(),
            lastAccessed: Date.now(),
            traceId: this.getTraceId()
        };

        this.sessions.set(sessionId, session);

        // Track user sessions
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, new Set());
        }
        this.userSessions.get(userId).add(sessionId);

        logInfo('Backend session created', { sessionId, userId });
        return session;
    }

    /**
     * Updates session last accessed time
     * @param {string} sessionId 
     */
    touchSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastAccessed = Date.now();
            this.sessions.set(sessionId, session);
        }
    }

    /**
     * Validates if a session is active
     * @param {string} sessionId 
     * @returns {boolean}
     */
    isValidSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        const age = Date.now() - session.created;
        return age < this.config.sessionTTL;
    }

    /**
     * Ends a specific session
     * @param {string} sessionId 
     */
    endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.sessions.delete(sessionId);
            const userSessions = this.userSessions.get(session.userId);
            if (userSessions) {
                userSessions.delete(sessionId);
            }
            logInfo('Backend session ended', { sessionId });
        }
    }

    /**
     * Cleans up expired sessions and trace IDs
     */
    cleanup() {
        const now = Date.now();
        
        // Cleanup sessions
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.created > this.config.sessionTTL) {
                this.endSession(sessionId);
            }
        }

        // Cleanup trace IDs
        for (const [traceId, trace] of this.traceIds.entries()) {
            if (now - trace.timestamp > this.config.sessionTTL) {
                this.traceIds.delete(traceId);
            }
        }

        logInfo('Session cleanup completed', {
            activeSessions: this.sessions.size,
            activeTraceIds: this.traceIds.size
        });
    }

    /**
     * Shuts down the session manager
     */
    shutdown() {
        clearInterval(this.cleanupInterval);
        this.sessions.clear();
        this.traceIds.clear();
        this.userSessions.clear();
        logInfo('Session manager shut down');
    }
}

// Create singleton instance
const sessionContext = new SessionManager();

export { sessionContext };
export default sessionContext;
