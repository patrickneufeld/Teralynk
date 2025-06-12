// ================================================
// ✅ FILE: /backend/src/utils/sessionManager.js
// Hardened Backend Session Manager (v2.0.0)
// ================================================

import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError, logWarn } from './logging/logging.mjs';
import { emitSecurityEvent, SECURITY_EVENTS } from './security/eventEmitter.mjs';

const DEFAULT_CONFIG = {
  sessionTTL: 24 * 60 * 60 * 1000, // 24 hours
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  maxSessionsPerUser: 5
};

class SessionManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessions = new Map();
    this.traceIds = new Map();
    this.userSessions = new Map();

    this.cleanupInterval = setInterval(() => this.cleanup(), this.config.cleanupInterval);
    logInfo('✅ SessionManager initialized');
  }

  getTraceId() {
    const traceId = uuidv4();
    this.traceIds.set(traceId, { timestamp: Date.now(), active: true });
    return traceId;
  }

  getSessionId() {
    return process.env.SERVICE_SESSION_ID || uuidv4();
  }

  getUserAgent() {
    return `TeralynkBackendService/${process.env.npm_package_version || '1.0.0'}`;
  }

  createSession(userId, metadata = {}) {
    try {
      const userSessionSet = this.userSessions.get(userId) || new Set();

      // Enforce max sessions per user
      if (userSessionSet.size >= this.config.maxSessionsPerUser) {
        const oldestSessionId = [...userSessionSet][0];
        this.endSession(oldestSessionId);
        logWarn(`🔁 Max session limit reached. Oldest session ended for user ${userId}`, { oldestSessionId });
      }

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
      if (!this.userSessions.has(userId)) this.userSessions.set(userId, new Set());
      this.userSessions.get(userId).add(sessionId);

      logInfo('🆕 Session created', { sessionId, userId });
      emitSecurityEvent(SECURITY_EVENTS.SESSION_CREATED, { userId, sessionId });

      return session;
    } catch (err) {
      logError('❌ Failed to create session', { error: err.message });
      throw new Error('Session creation failed');
    }
  }

  touchSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessed = Date.now();
      this.sessions.set(sessionId, session);
    }
  }

  isValidSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const age = Date.now() - session.created;
    return age < this.config.sessionTTL;
  }

  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);

      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) this.userSessions.delete(session.userId);
      }

      emitSecurityEvent(SECURITY_EVENTS.SESSION_ENDED, { sessionId, userId: session.userId });
      logInfo('🔚 Session ended', { sessionId, userId: session.userId });
    }
  }

  cleanup() {
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.created > this.config.sessionTTL) {
        this.endSession(sessionId);
      }
    }

    for (const [traceId, trace] of this.traceIds.entries()) {
      if (now - trace.timestamp > this.config.sessionTTL) {
        this.traceIds.delete(traceId);
      }
    }

    logInfo('🧹 Session cleanup completed', {
      activeSessions: this.sessions.size,
      activeTraceIds: this.traceIds.size
    });
  }

  shutdown() {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
    this.traceIds.clear();
    this.userSessions.clear();
    logInfo('🔒 Session manager shut down');
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  getActiveSessionsForUser(userId) {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];
    return [...sessionIds].map(id => this.sessions.get(id)).filter(Boolean);
  }

  getAllSessions() {
    return [...this.sessions.values()];
  }

  getActiveUserCount() {
    return this.userSessions.size;
  }

  getStats() {
    return {
      totalSessions: this.sessions.size,
      totalUsers: this.userSessions.size,
      totalTraceIds: this.traceIds.size
    };
  }
}

// ✅ Singleton
const sessionContext = new SessionManager();

export { sessionContext };
export default sessionContext;
