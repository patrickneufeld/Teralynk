import React from 'react';

/**
 * Button Component
 * 
 * A reusable button component with support for different variants and sizes.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {string} props.variant - Button style variant (primary, secondary, outline, danger)
 * @param {string} props.size - Button size (small, medium, large)
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.className - Additional CSS classes
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'button';
  const variantClasses = `button-${variant}`;
  const sizeClasses = `button-${size}`;
  const stateClasses = disabled ? 'button-disabled' : '';
  
  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${stateClasses} ${className}`.trim();
  
  return (
    <button 
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Export as both named and default export to support both import styles
export { Button };
export default Button;
