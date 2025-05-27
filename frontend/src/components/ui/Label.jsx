// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/Label.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * Label component - consistent with Teralynk's design system.
 * Supports accessibility and optional subtext or required marker.
 */
const Label = ({ htmlFor, children, className = "", required = false }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

Label.propTypes = {
  htmlFor: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  required: PropTypes.bool,
};

export default Label;
