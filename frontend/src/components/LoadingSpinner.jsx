/** @jsxImportSource react */
import React, { memo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

// 🧹 Memoized size mapping
const sizeMap = {
  small: { width: "20px", height: "20px" },
  medium: { width: "40px", height: "40px" },
  large: { width: "60px", height: "60px" },
};

// 🧹 Spinner Styles
const SPINNER_STYLES = `
  .loading-spinner__container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .loading-spinner__container.fullscreen {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
  }

  .loading-spinner {
    animation: spinner-rotate 1s linear infinite;
  }

  .loading-spinner__circle {
    stroke: currentColor;
    stroke-linecap: round;
    animation: spinner-dash 1.5s ease-in-out infinite;
  }

  .loading-spinner__message {
    font-size: 1rem;
    color: #555;
    text-align: center;
  }

  @keyframes spinner-rotate {
    100% { transform: rotate(360deg); }
  }

  @keyframes spinner-dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }
`;

/**
 * 🔄 LoadingSpinner Component
 */
export const LoadingSpinner = memo(({
  size = "medium",
  color = "#0066CC",
  fullScreen = false,
  message = "Loading...",
  className = "",
}) => {
  useLayoutEffect(() => {
    const styleId = "loading-spinner-styles";
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.textContent = SPINNER_STYLES;
      document.head.appendChild(styleTag);
    }

    return () => {
      const spinners = document.getElementsByClassName("loading-spinner");
      if (spinners.length === 0) {
        const styleTag = document.getElementById(styleId);
        styleTag?.remove();
      }
    };
  }, []);

  const SpinnerContent = (
    <div
      className={`loading-spinner__container ${fullScreen ? "fullscreen" : ""} ${className}`}
      role="alert"
      aria-busy="true"
      aria-label={message}
    >
      <div
        className="loading-spinner"
        style={sizeMap[size]}
      >
        <svg viewBox="0 0 50 50" style={{ color }}>
          <circle
            className="loading-spinner__circle"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="5"
          />
        </svg>
      </div>
      {message && (
        <div className="loading-spinner__message">
          {message}
        </div>
      )}
    </div>
  );

  return fullScreen && typeof document !== "undefined"
    ? createPortal(SpinnerContent, document.body)
    : SpinnerContent;
});

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
