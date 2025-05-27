import React from 'react';

/**
 * Input Component
 * 
 * A reusable input component with support for different variants and sizes.
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.className - Additional CSS classes
 */
const Input = React.forwardRef(({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  className = '',
  ...props 
}, ref) => {
  const baseClasses = 'input';
  const stateClasses = disabled ? 'input-disabled' : '';
  
  const combinedClasses = `${baseClasses} ${stateClasses} ${className}`.trim();
  
  return (
    <input 
      ref={ref}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={combinedClasses}
      {...props}
    />
  );
});

Input.displayName = 'Input';

// Export as both named and default export to support both import styles
export { Input };
export default Input;
