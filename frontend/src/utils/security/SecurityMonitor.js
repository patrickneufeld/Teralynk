// ✅ FILE: /frontend/src/utils/security/SecurityMonitor.js

import { v4 as uuidv4 } from 'uuid';
import { logError, logInfo, logWarn } from '../logging';

// Security check types and their configurations
const CHECK_TYPES = {
  JWT_EXPIRY: 'jwt-expiry',
  XSS_PROTECTION: 'xss-protection',
  CSP_VALIDATION: 'csp-validation',
  CORS_CONFIG: 'cors-config',
  SESSION_VALIDITY: 'session-validity',
  API_SECURITY: 'api-security',
  STORAGE_SECURITY: 'storage-security',
  INPUT_VALIDATION: 'input-validation',
  AUTH_STATE: 'auth-state',
  NETWORK_SECURITY: 'network-security'
};

const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const DEFAULT_CONFIG = {
  checkInterval: 30000,
  maxRetries: 3,
  retryDelay: 5000,
  batchSize: 10,
  maxListeners: 50,
  maxLogSize: 1000,
  autoStart: false,
  debugMode: false
};

class SecurityMonitor {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isActive = false;
    this.checks = new Map();
    this.listeners = new Set();
    this.eventLog = [];
    this.traceId = this.generateTraceId();
    this.retryCount = new Map();
    this.checkStats = new Map();
    this.lastHealthCheck = null;
    
    // Bind methods
    this.handleWindowEvents = this.handleWindowEvents.bind(this);
    this.handleStorageEvents = this.handleStorageEvents.bind(this);
    this.handleNetworkEvents = this.handleNetworkEvents.bind(this);

    // Initialize if autoStart is true
    if (this.config.autoStart) {
      this.start();
    }
  }

  generateTraceId() {
    return `sec_${Date.now()}_${uuidv4()}`;
  }

  start() {
    if (this.isActive) return;

    try {
      this.isActive = true;
      this.setupEventListeners();
      this.initializeDefaultChecks();
      this.startHealthCheck();

      logInfo('Security monitoring started', { 
        traceId: this.traceId,
        config: this.config,
        timestamp: Date.now()
      });

      // Initial security assessment
      this.performSecurityAssessment();

    } catch (error) {
      logError('Failed to start security monitor', {
        error,
        traceId: this.traceId
      });
      this.stop();
    }
  }

  stop() {
    if (!this.isActive) return;

    try {
      // Cleanup all running checks
      this.checks.forEach((check, name) => {
        if (check.timer) {
          clearTimeout(check.timer);
        }
        this.checks.delete(name);
      });

      // Remove event listeners
      this.removeEventListeners();

      // Clear all internal state
      this.listeners.clear();
      this.retryCount.clear();
      this.checkStats.clear();
      this.eventLog = [];
      this.isActive = false;

      logInfo('Security monitoring stopped', { 
        traceId: this.traceId,
        timestamp: Date.now()
      });

    } catch (error) {
      logError('Error stopping security monitor', {
        error,
        traceId: this.traceId
      });
    }
  }

  setupEventListeners() {
    window.addEventListener('storage', this.handleStorageEvents);
    window.addEventListener('online', this.handleNetworkEvents);
    window.addEventListener('offline', this.handleNetworkEvents);
    window.addEventListener('visibilitychange', this.handleWindowEvents);
  }

  removeEventListeners() {
    window.removeEventListener('storage', this.handleStorageEvents);
    window.removeEventListener('online', this.handleNetworkEvents);
    window.removeEventListener('offline', this.handleNetworkEvents);
    window.removeEventListener('visibilitychange', this.handleWindowEvents);
  }

  handleWindowEvents(event) {
    if (document.visibilityState === 'visible') {
      this.performSecurityAssessment();
    }
  }

  handleStorageEvents(event) {
    if (event.key && event.key.startsWith('security_')) {
      this.handleSecurityStorageChange(event);
    }
  }

  handleNetworkEvents(event) {
    const isOnline = navigator.onLine;
    this.notifyListeners({
      type: 'NETWORK_STATUS_CHANGE',
      status: isOnline ? 'online' : 'offline',
      timestamp: Date.now(),
      traceId: this.traceId
    });

    if (isOnline) {
      this.performSecurityAssessment();
    }
  }

  async handleSecurityStorageChange(event) {
    try {
      const data = JSON.parse(event.newValue);
      if (data.type === 'SECURITY_ALERT') {
        await this.handleSecurityAlert(data);
      }
    } catch (error) {
      logError('Error handling storage event', {
        error,
        event,
        traceId: this.traceId
      });
    }
  }

  async handleSecurityAlert(alert) {
    const event = {
      type: 'SECURITY_ALERT',
      ...alert,
      timestamp: Date.now(),
      traceId: this.traceId
    };

    this.logSecurityEvent(event);
    this.notifyListeners(event);

    if (alert.severity === SEVERITY_LEVELS.CRITICAL) {
      await this.handleCriticalAlert(alert);
    }
  }

  async handleCriticalAlert(alert) {
    logError('Critical security alert', {
      alert,
      traceId: this.traceId
    });

    // Force security reassessment
    await this.performSecurityAssessment();

    // Notify all tabs/windows
    localStorage.setItem('security_critical_alert', JSON.stringify({
      timestamp: Date.now(),
      alert
    }));
  }

  addCheck(name, checkFn, options = {}) {
    if (this.checks.has(name)) {
      throw new Error(`Security check "${name}" already exists`);
    }

    const check = {
      name,
      fn: checkFn,
      interval: options.interval || this.config.checkInterval,
      severity: options.severity || SEVERITY_LEVELS.MEDIUM,
      lastRun: null,
      timer: null,
      status: 'pending',
      metadata: options.metadata || {},
      retryCount: 0
    };

    this.checks.set(name, check);
    this.checkStats.set(name, {
      totalRuns: 0,
      failures: 0,
      lastStatus: null,
      averageRunTime: 0
    });

    this.scheduleCheck(check);

    logInfo(`Security check "${name}" added`, {
      check: { ...check, fn: undefined },
      traceId: this.traceId
    });
  }

  removeCheck(name) {
    const check = this.checks.get(name);
    if (check) {
      if (check.timer) clearTimeout(check.timer);
      this.checks.delete(name);
      this.checkStats.delete(name);
      logInfo(`Security check "${name}" removed`, { traceId: this.traceId });
    }
  }

  async runCheck(check) {
    if (!this.isActive) return;

    const startTime = performance.now();
    const stats = this.checkStats.get(check.name);

    try {
      check.status = 'running';
      const result = await Promise.race([
        Promise.resolve(check.fn()),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Check timed out')), 10000)
        )
      ]);

      check.lastRun = Date.now();
      check.status = result.passed ? 'passed' : 'failed';
      check.retryCount = 0;

      // Update stats
      stats.totalRuns++;
      stats.lastStatus = check.status;
      stats.averageRunTime = (stats.averageRunTime * (stats.totalRuns - 1) + 
        (performance.now() - startTime)) / stats.totalRuns;

      if (!result.passed) {
        stats.failures++;
        await this.handleFailedCheck(check.name, result);
      }

      return result;

    } catch (error) {
      check.status = 'error';
      check.retryCount = (check.retryCount || 0) + 1;
      
      stats.failures++;
      stats.lastStatus = 'error';

      logError(`Security check "${check.name}" failed`, {
        error,
        retryCount: check.retryCount,
        traceId: this.traceId
      });

      if (check.retryCount < this.config.maxRetries) {
        this.scheduleRetry(check);
      } else {
        this.handleCheckFailure(check, error);
      }

      return { 
        passed: false, 
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  scheduleRetry(check) {
    const delay = this.config.retryDelay * Math.pow(2, check.retryCount - 1);
    setTimeout(() => this.runCheck(check), delay);
  }

  async handleFailedCheck(checkName, result) {
    const check = this.checks.get(checkName);
    const event = {
      type: 'SECURITY_CHECK_FAILED',
      check: checkName,
      severity: check.severity,
      reason: result.reason || 'Unknown failure',
      timestamp: Date.now(),
      traceId: this.traceId,
      details: {
        ...result,
        checkMetadata: check.metadata,
        stats: this.checkStats.get(checkName)
      }
    };

    this.logSecurityEvent(event);
    this.notifyListeners(event);

    if (check.severity === SEVERITY_LEVELS.CRITICAL) {
      await this.handleCriticalCheckFailure(check, result);
    }
  }

  async handleCriticalCheckFailure(check, result) {
    logError('Critical security check failure', {
      check: check.name,
      result,
      traceId: this.traceId
    });

    // Implement critical failure protocol
    await this.performSecurityAssessment();
  }

  handleCheckFailure(check, error) {
    const event = {
      type: 'SECURITY_CHECK_ERROR',
      check: check.name,
      error: error.message,
      severity: check.severity,
      timestamp: Date.now(),
      traceId: this.traceId,
      retryCount: check.retryCount,
      stats: this.checkStats.get(check.name)
    };

    this.logSecurityEvent(event);
    this.notifyListeners(event);
  }

  scheduleCheck(check) {
    if (!this.isActive) return;

    if (check.timer) {
      clearTimeout(check.timer);
    }

    check.timer = setTimeout(async () => {
      await this.runCheck(check);
      this.scheduleCheck(check);
    }, check.interval);
  }

  addListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    if (this.listeners.size >= this.config.maxListeners) {
      throw new Error('Maximum number of listeners reached');
    }

    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyListeners(event) {
    const safeEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      traceId: this.traceId
    };

    this.listeners.forEach(listener => {
      try {
        listener(safeEvent);
      } catch (error) {
        logError('Security monitor listener failed', {
          error,
          traceId: this.traceId,
          listenerCount: this.listeners.size
        });
      }
    });
  }

  logSecurityEvent(event) {
    this.eventLog.unshift(event);
    if (this.eventLog.length > this.config.maxLogSize) {
      this.eventLog.pop();
    }
  }

  getStatus() {
    return {
      isActive: this.isActive,
      checksCount: this.checks.size,
      listenersCount: this.listeners.size,
      traceId: this.traceId,
      timestamp: Date.now(),
      lastHealthCheck: this.lastHealthCheck,
      checks: Array.from(this.checks.entries()).map(([name, check]) => ({
        name,
        status: check.status,
        severity: check.severity,
        lastRun: check.lastRun,
        interval: check.interval,
        nextRun: check.lastRun ? check.lastRun + check.interval : null,
        retryCount: check.retryCount || 0,
        stats: this.checkStats.get(name)
      })),
      eventLog: this.eventLog.slice(0, 10) // Return last 10 events
    };
  }

  async performSecurityAssessment() {
    if (!this.isActive) return;

    logInfo('Starting security assessment', { traceId: this.traceId });

    const results = await Promise.all(
      Array.from(this.checks.values()).map(check => this.runCheck(check))
    );

    const failedChecks = results.filter(r => !r.passed);
    if (failedChecks.length > 0) {
      logWarn('Security assessment found issues', {
        failedChecks,
        traceId: this.traceId
      });
    }

    return {
      timestamp: Date.now(),
      totalChecks: results.length,
      passedChecks: results.filter(r => r.passed).length,
      failedChecks: failedChecks.length,
      results
    };
  }

  startHealthCheck() {
    setInterval(() => {
      this.lastHealthCheck = Date.now();
      this.checkSystemHealth();
    }, 60000); // Every minute
  }

  checkSystemHealth() {
    const status = this.getStatus();
    const healthIssues = [];

    // Check for stalled checks
    status.checks.forEach(check => {
      if (check.lastRun && Date.now() - check.lastRun > check.interval * 2) {
        healthIssues.push(`Check ${check.name} appears stalled`);
      }
    });

    // Check for high failure rates
    this.checkStats.forEach((stats, name) => {
      if (stats.totalRuns > 10 && (stats.failures / stats.totalRuns) > 0.3) {
        healthIssues.push(`Check ${name} has high failure rate`);
      }
    });

    if (healthIssues.length > 0) {
      logWarn('Security monitor health issues detected', {
        issues: healthIssues,
        traceId: this.traceId
      });
    }

    return {
      healthy: healthIssues.length === 0,
      issues: healthIssues,
      timestamp: Date.now()
    };
  }

  reset() {
    this.stop();
    this.traceId = this.generateTraceId();
    this.eventLog = [];
    this.checkStats.clear();
    this.start();
  }

  // Initialize default security checks
  initializeDefaultChecks() {
    // JWT expiration check
    this.addCheck(CHECK_TYPES.JWT_EXPIRY, async () => {
      const token = localStorage.getItem('jwt');
      if (!token) return { passed: true };
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          passed: payload.exp * 1000 > Date.now(),
          reason: payload.exp * 1000 <= Date.now() ? 'Token expired' : null
        };
      } catch {
        return { passed: false, reason: 'Invalid token' };
      }
    }, { severity: SEVERITY_LEVELS.HIGH });

    // CSP validation
    this.addCheck(CHECK_TYPES.CSP_VALIDATION, () => {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return {
        passed: !!meta,
        reason: !meta ? 'CSP meta tag not found' : null
      };
    }, { severity: SEVERITY_LEVELS.MEDIUM });

    // Storage security check
    this.addCheck(CHECK_TYPES.STORAGE_SECURITY, () => {
      try {
        const testKey = `security_test_${Date.now()}`;
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return { passed: true };
      } catch {
        return { 
          passed: false,
          reason: 'Local storage not accessible'
        };
      }
    }, { severity: SEVERITY_LEVELS.MEDIUM });

    // Add more default checks as needed
  }
}

// Create singleton instance
const securityMonitor = new SecurityMonitor();

// Export the singleton as default and named export
export { securityMonitor };
export default securityMonitor;

// Export other constants and the class
export { SecurityMonitor, CHECK_TYPES, SEVERITY_LEVELS };

