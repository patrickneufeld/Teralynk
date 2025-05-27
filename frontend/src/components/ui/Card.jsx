import React from 'react';

/**
 * Card Component
 * 
 * A reusable card component for containing content.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 */
const Card = ({ 
  children, 
  className = '',
  ...props 
}) => {
  const baseClasses = 'card';
  
  const combinedClasses = `${baseClasses} ${className}`.trim();
  
  return (
    <div 
      className={combinedClasses}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Content Component
 * 
 * A component for the content area of a card.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content
 * @param {string} props.className - Additional CSS classes
 */
const CardContent = ({ 
  children, 
  className = '',
  ...props 
}) => {
  const baseClasses = 'card-content';
  
  const combinedClasses = `${baseClasses} ${className}`.trim();
  
  return (
    <div 
      className={combinedClasses}
      {...props}
    >
      {children}
    </div>
  );
};

// Export both components, but avoid duplicate exports
export { Card, CardContent };
