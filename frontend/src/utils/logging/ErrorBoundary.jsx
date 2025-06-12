// ================================================
// ✅ FILE: /frontend/src/components/ErrorBoundary.jsx
// Hardened ErrorBoundary for Enterprise Logging and Fallback UI
// ================================================

import React from 'react';
import PropTypes from 'prop-types';
import { logError } from '@/utils/logging/index.js'; // ✅ Correct absolute path

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
    this._isMounted = false;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const metadata = {
      componentStack: errorInfo?.componentStack || '',
      location: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
    };

    const logResult = logError(
      error,
      this.props.componentName || 'ErrorBoundary',
      metadata
    );

    if (logResult && typeof logResult.then === 'function') {
      logResult
        .then((errorId) => {
          if (this._isMounted) this.setState({ errorInfo, errorId });
        })
        .catch((loggingError) => {
          if (this._isMounted) this.setState({ errorInfo });
          if (import.meta.env.MODE === 'development') {
            console.error('[ErrorBoundary] Logging failure:', loggingError);
          }
        });
    } else {
      this.setState({ errorInfo, errorId: logResult });
    }

    if (import.meta.env.MODE === 'development') {
      console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  componentDidMount() {
    this._isMounted = true;
  }
  componentWillUnmount() {
    this._isMounted = false;
  }

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
      } else if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (err) {
      if (typeof window !== 'undefined') window.location.reload();
    }
  };

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
        if (import.meta.env.MODE === 'development') {
          console.warn('[ErrorBoundary] Custom fallback render failed:', fallbackErr);
        }
      }
    }

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
    fontWeight: 600,
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

export default ErrorBoundary;
