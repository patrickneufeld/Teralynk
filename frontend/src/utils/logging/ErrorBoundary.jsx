// ✅ FILE: /frontend/src/utils/logging/ErrorBoundary.jsx
// Hardened ErrorBoundary for Enterprise Logging and Fallback UI

import React from 'react';
import PropTypes from 'prop-types';
import { logError } from './logging';

/**
 * 🧱 ErrorBoundary – Catches React component errors,
 * logs with metadata, and shows fallback UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  // React lifecycle hook for error boundaries
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Log the error with metadata and set additional info in state
  async componentDidCatch(error, errorInfo) {
    const metadata = {
      componentStack: errorInfo?.componentStack || '',
      location: window?.location?.href || '',
      userAgent: navigator?.userAgent || '',
      timestamp: new Date().toISOString(),
    };

    try {
      const errorId = await logError(
        error,
        this.props.componentName || 'ErrorBoundary',
        metadata
      );

      this.setState({ errorInfo, errorId });
    } catch (loggingError) {
      console.error('[ErrorBoundary] Logging failure:', loggingError);
    }

    // Extra console output in development
    if (import.meta.env.MODE === 'development') {
      console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  // Reset logic for retry UI
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    try {
      if (typeof this.props.onReset === 'function') {
        this.props.onReset();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.warn('[ErrorBoundary] Reset handler failed:', err);
      window.location.reload();
    }
  };

  // Render fallback element
  renderFallbackUI() {
    const { fallback } = this.props;
    const { error, errorId } = this.state;

    if (React.isValidElement(fallback)) {
      return React.cloneElement(fallback, { error, errorId, reset: this.handleReset });
    }

    if (typeof fallback === 'function') {
      try {
        const result = fallback({ error, errorId, reset: this.handleReset });
        if (React.isValidElement(result)) return result;
      } catch (fallbackErr) {
        console.warn('[ErrorBoundary] Custom fallback render failed:', fallbackErr);
      }
    }

    // Default fallback if none provided or failed
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Something went wrong</h2>
        <p style={styles.message}>Please try again or contact support.</p>
        {errorId && (
          <p style={styles.errorId}>
            <strong>Error ID:</strong> {errorId}
          </p>
        )}
        <button
          onClick={this.handleReset}
          style={styles.button}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#b52020')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#c53030')}
        >
          Retry
        </button>
      </div>
    );
  }

  render() {
    return this.state.hasError ? this.renderFallbackUI() : this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onReset: PropTypes.func,
  componentName: PropTypes.string,
};

ErrorBoundary.defaultProps = {
  fallback: null,
  onReset: null,
  componentName: 'ErrorBoundary',
};

// Inline fallback styles
const styles = {
  container: {
    padding: '2rem',
    margin: '2rem auto',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#fff5f5',
    color: '#333',
    maxWidth: '600px',
    textAlign: 'center',
    boxShadow: '0 0 12px rgba(0,0,0,0.1)',
  },
  title: {
    color: '#c53030',
    fontSize: '1.75rem',
    marginBottom: '1rem',
    fontWeight: '600',
  },
  message: {
    fontSize: '1.1rem',
    marginBottom: '0.75rem',
    color: '#4a5568',
  },
  errorId: {
    fontSize: '0.9rem',
    marginBottom: '1rem',
    color: '#555',
  },
  button: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#c53030',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s ease',
  },
};

// ✅ Dual export for flexibility
export { ErrorBoundary };
export default ErrorBoundary;
