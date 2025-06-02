// ✅ FILE: /src/components/common/Fallback.jsx

import React from "react";
import PropTypes from "prop-types";
import "../styles/components/Fallback.css";

const Fallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="fallback-container">
      <h2 className="fallback-title">Oops! Something went wrong.</h2>
      <p className="fallback-message">
        {error?.message || "An unexpected error occurred. Please try again."}
      </p>
      <button onClick={resetErrorBoundary} className="fallback-button">
        Try Again
      </button>
    </div>
  );
};

Fallback.propTypes = {
  error: PropTypes.object, // Error object passed by ErrorBoundary
  resetErrorBoundary: PropTypes.func.isRequired, // Resets the error boundary state
};

export default Fallback;
