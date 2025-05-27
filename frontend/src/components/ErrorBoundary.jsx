// ✅ FILE: /frontend/src/components/ErrorBoundary.jsx

import React from "react";
import PropTypes from "prop-types";
import { logError } from "../utils/logging/logging";
import "../styles/components/ErrorBoundary.css"; // Optional styling

/**
 * 🧱 ErrorBoundary – Safely wraps component trees and captures runtime failures.
 * Logs context, stack, and gracefully recovers with fallback UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  // ⚠️ Capture error into state
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // 🧾 Log details for debugging and alerting
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });

    logError(error, "ErrorBoundary", {
      componentStack: errorInfo?.componentStack || "N/A",
    });

    if (error?.message?.includes("WebSocket")) {
      logError("WebSocket error occurred", "WebSocket", { error });
    }

    if (import.meta.env.MODE === "development") {
      console.error("❌ ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  // 🔄 Allow retry/reset logic
  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    }
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showReset } = this.props;

    if (hasError) {
      const fallbackContent = typeof fallback === "function"
        ? fallback({
            error,
            resetErrorBoundary: this.resetErrorBoundary,
          })
        : (
          <div className="error-boundary-fallback" role="alert">
            <h2>😢 Something went wrong</h2>
            <p>An unexpected error occurred. Please try again.</p>

            {import.meta.env.MODE === "development" && (
              <details style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
                <summary>Click to view error details</summary>
                <pre>{error?.toString()}</pre>
                <pre>{errorInfo?.componentStack}</pre>
              </details>
            )}

            {showReset && (
              <button className="retry-button" onClick={this.resetErrorBoundary}>
                Try Again
              </button>
            )}
          </div>
        );

      return fallbackContent;
    }

    return children;
  }
}

// ✅ Type checking
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  showReset: PropTypes.bool,
  onReset: PropTypes.func,
};

// ✅ Defaults
ErrorBoundary.defaultProps = {
  fallback: null,
  showReset: true,
  onReset: null,
};

// ✅ Dual export for compatibility with both:
// import ErrorBoundary from ...
// import { ErrorBoundary } from ...
export { ErrorBoundary };
export default ErrorBoundary;
