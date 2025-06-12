import React from 'react';

/**
 * Textarea Component
 * 
 * A reusable textarea component.
 * 
 * @param {Object} props - Component props
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Textarea value
 * @param {Function} props.onChange - Change handler
 * @param {number} props.rows - Number of rows
 * @param {boolean} props.disabled - Whether the textarea is disabled
 * @param {string} props.className - Additional CSS classes
 */
const Textarea = React.forwardRef(({ 
  placeholder,
  value,
  onChange,
  rows = 3,
  disabled = false,
  className = '',
  ...props 
}, ref) => {
  const baseClasses = 'textarea';
  const stateClasses = disabled ? 'textarea-disabled' : '';
  
  const combinedClasses = `${baseClasses} ${stateClasses} ${className}`.trim();
  
  return (
    <textarea 
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={combinedClasses}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

// Export as both named and default export to support both import styles
export { Textarea };
export default Textarea;
