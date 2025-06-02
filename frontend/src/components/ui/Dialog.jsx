// ✅ File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/Dialog.jsx

import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const Dialog = ({ open, onClose, children, size = "md", className = "" }) => {
  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className={clsx(
          "bg-white rounded-lg shadow-xl w-full mx-4 p-6 animate-fade-in",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

export default Dialog;
