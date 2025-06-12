import React from 'react';

/**
 * Alert Component
 * 
 * A reusable alert component for displaying messages.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Alert content
 * @param {string} props.variant - Alert style variant (info, success, warning, error)
 * @param {string} props.className - Additional CSS classes
 */
const Alert = ({ 
  children, 
  variant = 'info',
  className = '',
  ...props 
}) => {
  const baseClasses = 'alert';
  const variantClasses = `alert-${variant}`;
  
  const combinedClasses = `${baseClasses} ${variantClasses} ${className}`.trim();
  
  return (
    <div 
      role="alert"
      className={combinedClasses}
      {...props}
    >
      {children}
    </div>
  );
};

// Export as both named and default export to support both import styles
export { Alert };
export default Alert;
