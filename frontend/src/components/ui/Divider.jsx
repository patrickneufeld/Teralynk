// ✅ File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/Divider.jsx

import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

/**
 * Divider Component
 * 
 * Renders a horizontal or vertical divider line with optional spacing and variant.
 */
const Divider = ({ vertical = false, className = "", variant = "default" }) => {
  const baseStyles = vertical
    ? "w-px h-full"
    : "h-px w-full";

  const variantStyles = {
    default: "bg-gray-300",
    light: "bg-gray-200",
    dark: "bg-gray-600",
    primary: "bg-blue-500",
  };

  return (
    <div
      className={clsx(
        baseStyles,
        variantStyles[variant],
        className
      )}
      aria-hidden="true"
    />
  );
};

Divider.propTypes = {
  vertical: PropTypes.bool,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "light", "dark", "primary"]),
};

export default Divider;
