///Users/patrick/Projects/Teralynk/frontend/src/utils/logging/ErrorBoundary.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { logError } from './logging.js';

/**
 * Enterprise-grade ErrorBoundary for catching and logging UI errors
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

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
    } catch (loggingFailure) {
      console.error('[ErrorBoundary] Logging failure:', loggingFailure);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    if (typeof this.props.onReset === 'function') {
      try {
        this.props.onReset();
      } catch (err) {
        console.error('[ErrorBoundary] Reset failed:', err);
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  };

  renderFallbackUI() {
    const { fallback } = this.props;
    const { errorId, error } = this.state;

    if (React.isValidElement(fallback)) {
      return React.cloneElement(fallback, { errorId, error });
    }

    if (typeof fallback === 'function') {
      try {
        const element = fallback({ errorId, error });
        if (React.isValidElement(element)) return element;
      } catch (err) {
        console.warn('[ErrorBoundary] Fallback render failed:', err);
      }
    }

    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Something went wrong</h2>
        <p style={styles.message}>Please try again or contact support</p>
        {errorId && (
          <p style={styles.errorId}>
            <strong>Error ID:</strong> {errorId}
          </p>
        )}
        <button 
          onClick={this.handleReset} 
          style={styles.button}
          onMouseOver={(e) => e.target.style.backgroundColor = '#b52020'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#c53030'}
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

const styles = {
  container: {
    padding: '2rem',
    margin: '2rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#fff5f5',
    color: '#333',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
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