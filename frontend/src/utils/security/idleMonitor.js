// ================================================
// ✅ FILE: /frontend/src/utils/security/idleMonitor.js
// User Inactivity Monitor with Enhanced Security
// Version: 2.0.0
// ================================================

import { logError, logInfo, logDebug } from '@/utils/logging';
import { securityEvents } from './eventEmitter';

// ==============================
// 📊 Constants
// ==============================

const DEFAULT_CONFIG = Object.freeze({
  // Core timing settings
  idleTime: 15 * 60 * 1000,        // 15 minutes
  warningTime: 1 * 60 * 1000,      // 1 minute warning
  graceTime: 30 * 1000,            // 30 seconds grace period
  checkInterval: 10 * 1000,        // Check every 10 seconds
  
  // Activity detection settings
  minActivityDelta: 100,           // Minimum ms between activity updates
  activityBatchSize: 10,           // Number of events before forced update
  
  // Security settings
  enforceMinimumIdle: 5 * 60 * 1000,  // Minimum allowed idle time
  maximumSessionTime: 12 * 60 * 60 * 1000, // Maximum session duration
  requireActiveWindow: true,           // Only count activity when window is active
  validateUserPresence: true,          // Use advanced presence detection
});

const ACTIVITY_EVENTS = Object.freeze([
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'mousemove',
  'click',
  'focus',
  'visibilitychange'
]);

// ==============================
// 🔍 Activity Monitor Class
// ==============================

export class IdleMonitor {
  constructor(config = {}) {
    // Configuration
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validateConfig();

    // State
    this.isRunning = false;
    this.isIdle = false;
    this.warningIssued = false;
    this.lastActivity = Date.now();
    this.sessionStart = Date.now();
    this.eventCount = 0;
    this.lastUpdate = 0;
    
    // Timers
    this.idleTimer = null;
    this.warningTimer = null;
    this.checkTimer = null;
    
    // Callbacks
    this.onIdle = config.onIdle || (() => {});
    this.onWarning = config.onWarning || (() => {});
    this.onActive = config.onActive || (() => {});
    this.onReset = config.onReset || (() => {});

    // Bind methods
    this.boundActivityHandler = this.handleUserActivity.bind(this);
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    this.boundFocusHandler = this.handleFocusChange.bind(this);

    // Initialize
    this.start();
  }

  // ==============================
  // 🚀 Public Methods
  // ==============================

  /**
   * Starts monitoring for user inactivity
   */
  start() {
    if (this.isRunning) return;

    try {
      this.isRunning = true;
      this.attachEventListeners();
      this.startTimers();
      this.lastActivity = Date.now();
      
      logInfo('Idle monitor started', {
        idleTime: this.config.idleTime,
        warningTime: this.config.warningTime
      });

      securityEvents.emit('idle-monitor:started', {
        timestamp: Date.now(),
        config: {
          idleTime: this.config.idleTime,
          warningTime: this.config.warningTime
        }
      });
    } catch (error) {
      logError('Failed to start idle monitor', { error });
      this.cleanup();
    }
  }

  /**
   * Stops monitoring for user inactivity
   */
  stop() {
    if (!this.isRunning) return;

    try {
      this.cleanup();
      logInfo('Idle monitor stopped');
      
      securityEvents.emit('idle-monitor:stopped', {
        timestamp: Date.now(),
        lastActivity: this.lastActivity
      });
    } catch (error) {
      logError('Failed to stop idle monitor', { error });
    }
  }

  /**
   * Forces an activity update
   */
  forceActivity() {
    this.handleUserActivity({ forced: true });
  }

  /**
   * Gets current idle status
   * @returns {Object} Idle status information
   */
  getStatus() {
    const now = Date.now();
    return {
      isIdle: this.isIdle,
      warningIssued: this.warningIssued,
      lastActivity: this.lastActivity,
      idleTime: now - this.lastActivity,
      sessionTime: now - this.sessionStart,
      isRunning: this.isRunning
    };
  }

  // ==============================
  // 🔒 Private Methods
  // ==============================

  /**
   * Validates configuration
   * @private
   */
  validateConfig() {
    if (this.config.idleTime < this.config.enforceMinimumIdle) {
      throw new Error('Idle time cannot be less than minimum idle time');
    }

    if (this.config.warningTime >= this.config.idleTime) {
      throw new Error('Warning time must be less than idle time');
    }

    if (this.config.checkInterval >= this.config.warningTime) {
      throw new Error('Check interval must be less than warning time');
    }
  }

  /**
   * Handles user activity
   * @private
   */
  handleUserActivity(event = {}) {
    const now = Date.now();
    this.eventCount++;

    // Throttle updates
    if (!event.forced && 
        now - this.lastUpdate < this.config.minActivityDelta && 
        this.eventCount < this.config.activityBatchSize) {
      return;
    }

    // Validate window state if required
    if (this.config.requireActiveWindow && 
        document.hidden) {
      return;
    }

    // Update activity timestamp
    this.lastActivity = now;
    this.lastUpdate = now;
    this.eventCount = 0;

    // Handle state changes
    if (this.isIdle) {
      this.isIdle = false;
      this.onActive();
      securityEvents.emit('idle-monitor:active', {
        timestamp: now,
        idleDuration: now - this.lastActivity
      });
    }

    if (this.warningIssued) {
      this.warningIssued = false;
      this.onReset();
      securityEvents.emit('idle-monitor:warning-reset', {
        timestamp: now
      });
    }

    // Reset timers
    this.resetTimers();
  }

  /**
   * Handles visibility change
   * @private
   */
  handleVisibilityChange() {
    if (!document.hidden) {
      this.handleUserActivity({ type: 'visibility' });
    }
  }

  /**
   * Handles window focus change
   * @private
   */
  handleFocusChange(event) {
    if (event.type === 'focus') {
      this.handleUserActivity({ type: 'focus' });
    }
  }

  /**
   * Attaches event listeners
   * @private
   */
  attachEventListeners() {
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, this.boundActivityHandler, { 
        passive: true,
        capture: true
      });
    });

    document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    window.addEventListener('focus', this.boundFocusHandler);
    window.addEventListener('blur', this.boundFocusHandler);
  }

  /**
   * Removes event listeners
   * @private
   */
  removeEventListeners() {
    ACTIVITY_EVENTS.forEach(event => {
      window.removeEventListener(event, this.boundActivityHandler, { 
        capture: true 
      });
    });

    document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    window.removeEventListener('focus', this.boundFocusHandler);
    window.removeEventListener('blur', this.boundFocusHandler);
  }

  /**
   * Starts monitoring timers
   * @private
   */
  startTimers() {
    this.checkTimer = setInterval(() => {
      this.checkIdleState();
    }, this.config.checkInterval);

    this.resetTimers();
  }

  /**
   * Resets idle and warning timers
   * @private
   */
  resetTimers() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);

    this.warningTimer = setTimeout(() => {
      this.handleWarning();
    }, this.config.idleTime - this.config.warningTime);

    this.idleTimer = setTimeout(() => {
      this.handleIdle();
    }, this.config.idleTime);
  }

  /**
   * Checks current idle state
   * @private
   */
  checkIdleState() {
    const now = Date.now();
    const idleTime = now - this.lastActivity;
    const sessionTime = now - this.sessionStart;

    // Check maximum session time
    if (sessionTime >= this.config.maximumSessionTime) {
      this.handleIdle();
      return;
    }

    // Validate idle state
    if (idleTime >= this.config.idleTime && !this.isIdle) {
      this.handleIdle();
    } else if (idleTime >= (this.config.idleTime - this.config.warningTime) && !this.warningIssued) {
      this.handleWarning();
    }
  }

  /**
   * Handles warning state
   * @private
   */
  handleWarning() {
    if (this.warningIssued) return;

    this.warningIssued = true;
    this.onWarning();

    securityEvents.emit('idle-monitor:warning', {
      timestamp: Date.now(),
      lastActivity: this.lastActivity,
      timeUntilIdle: this.config.warningTime
    });
  }

  /**
   * Handles idle state
   * @private
   */
  handleIdle() {
    if (this.isIdle) return;

    this.isIdle = true;
    this.onIdle();

    securityEvents.emit('idle-monitor:idle', {
      timestamp: Date.now(),
      lastActivity: this.lastActivity,
      sessionDuration: Date.now() - this.sessionStart
    });
  }

  /**
   * Cleans up resources
   * @private
   */
  cleanup() {
    this.isRunning = false;
    this.removeEventListeners();
    
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.checkTimer) clearInterval(this.checkTimer);
    
    this.idleTimer = null;
    this.warningTimer = null;
    this.checkTimer = null;
  }
}

export default IdleMonitor;
