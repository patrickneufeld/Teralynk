import React from 'react';

/**
 * Loader Component
 * 
 * A reusable loading spinner component.
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the loader (small, medium, large)
 * @param {string} props.className - Additional CSS classes
 */
const Loader = ({ 
  size = 'medium',
  className = '',
  ...props 
}) => {
  const baseClasses = 'loader';
  const sizeClasses = `loader-${size}`;
  
  const combinedClasses = `${baseClasses} ${sizeClasses} ${className}`.trim();
  
  return (
    <div 
      className={combinedClasses}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="32,32">
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
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Export as both named and default export to support both import styles
export { Loader };
export default Loader;
