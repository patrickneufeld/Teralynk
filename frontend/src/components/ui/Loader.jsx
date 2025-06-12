// ================================================
// ✅ FILE: /frontend/src/components/Loader.jsx
// Hardened, Accessible Loader/Spinner Component
// ================================================

import React from 'react';

/**
 * Loader Component
 * A reusable loading spinner.
 *
 * @param {Object} props
 * @param {'small'|'medium'|'large'} [props.size='medium'] - Loader size
 * @param {string} [props.className] - Additional CSS classes
 */
const Loader = ({
  size = 'medium',
  className = '',
  ...props
}) => {
  // Optional: Add your own CSS or swap these classes for Tailwind, etc.
  const sizeMap = {
    small: 16,
    medium: 32,
    large: 48,
  };
  const svgSize = sizeMap[size] || sizeMap.medium;

  const baseClasses = 'loader';
  const sizeClasses = `loader-${size}`;
  const combinedClasses = [baseClasses, sizeClasses, className].filter(Boolean).join(' ');

  return (
    <div
      className={combinedClasses}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 24 24"
        style={{ display: 'block', margin: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="32,32"
        >
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            dur="1s"
            from="0 12 12"
            to="360 12 12"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <span style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        border: 0,
      }}>Loading...</span>
    </div>
  );
};

// Export as both named and default
export { Loader };
export default Loader;
