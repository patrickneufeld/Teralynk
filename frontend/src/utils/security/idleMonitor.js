// ✅ FILE: /frontend/src/utils/security/idleMonitor.js

export class IdleMonitor {
  constructor({
    idleLimit = 15 * 60 * 1000, // 15 minutes
    warningBuffer = 1 * 60 * 1000, // 1 minute before idle
    onIdle = () => {},
    onWarning = () => {},
  } = {}) {
    this.idleLimit = idleLimit;
    this.warningBuffer = warningBuffer;
    this.onIdle = onIdle;
    this.onWarning = onWarning;

    this.idleTimeout = null;
    this.warningTimeout = null;

    this.boundActivityHandler = this._handleUserActivity.bind(this);
    this._attachEventListeners();
    this._handleUserActivity(); // Start initial timers
  }

  _resetTimers() {
    if (this.idleTimeout) clearTimeout(this.idleTimeout);
    if (this.warningTimeout) clearTimeout(this.warningTimeout);
  }

  _handleUserActivity() {
    this._resetTimers();

    this.warningTimeout = setTimeout(() => {
      this.onWarning();
    }, this.idleLimit - this.warningBuffer);

    this.idleTimeout = setTimeout(() => {
      this.onIdle();
    }, this.idleLimit);
  }

  _attachEventListeners() {
    this.activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    this.activityEvents.forEach((event) => {
      window.addEventListener(event, this.boundActivityHandler, { passive: true });
    });
  }

  stop() {
    this._resetTimers();
    this.activityEvents.forEach((event) => {
      window.removeEventListener(event, this.boundActivityHandler);
    });
  }
}
