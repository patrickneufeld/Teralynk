// ✅ FILE: /src/components/common/ErrorBoundary.jsx

import React from "react";
import PropTypes from "prop-types";
import { logError } from "../utils/ErrorHandler";
import "../styles/components/ErrorBoundary.css"; // Optional: Add custom styles

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * ✅ Update state when an error occurs
   * @param {Error} error - The thrown error
   * @returns {object} - Updated state
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * ✅ Capture error and log details
   * @param {Error} error - The error that occurred
   * @param {object} errorInfo - Additional details (e.g., component stack trace)
   */
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    logError(error, "React Component Error", errorInfo);

    if (process.env.NODE_ENV === "development") {
      console.error("❌ Caught an error in ErrorBoundary:", { error, errorInfo });
    }
  }

  /**
   * ✅ Reset error state to recover from errors
   */
  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });

    // Optional: Trigger reset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showReset } = this.props;

    if (hasError) {
      return (
        <div className="error-boundary" role="alert">
          {fallback ? (
            // Use a custom fallback UI if provided
            fallback({ error, resetErrorBoundary: this.resetErrorBoundary })
          ) : (
            <div className="fallback-ui">
              <h1>Oops! Something went wrong.</h1>
              <p>Please try again later or contact support.</p>

              {/* Detailed error information in development mode */}
              {process.env.NODE_ENV === "development" && (
                <details style={{ whiteSpace: "pre-wrap" }}>
                  <summary>Error Details</summary>
                  <p>{error && error.toString()}</p>
                  <p>{errorInfo?.componentStack}</p>
                </details>
              )}

              {/* Optional Reset Button */}
              {showReset && (
                <button
                  onClick={this.resetErrorBoundary}
                  className="reset-button"
                  aria-label="Try again after an error"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    return children;
  }
}

// ✅ Default PropTypes for Validation
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired, // The wrapped components
  fallback: PropTypes.func, // Optional custom fallback UI
  showReset: PropTypes.bool, // Display the reset button
  onReset: PropTypes.func, // Callback for reset behavior
};

// ✅ Default Props for Optional Props
ErrorBoundary.defaultProps = {
  fallback: null,
  showReset: true,
  onReset: null,
};

export default ErrorBoundary;
