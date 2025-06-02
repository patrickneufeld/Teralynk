// File Path: /frontend/src/components/ui/Badge.jsx

import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

/**
 * Badge component for showing status, categories, or counts
 */
const Badge = ({
  label,
  type = "info",
  size = "md",
  rounded = "full",
  className = "",
}) => {
  const baseStyles =
    "inline-flex items-center font-semibold px-3 py-1 leading-tight";

  const sizeStyles = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const typeStyles = {
    info: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    neutral: "bg-gray-100 text-gray-800",
  };

  const shapeStyles = {
    full: "rounded-full",
    md: "rounded-md",
    none: "",
  };

  return (
    <span
      className={classNames(
        baseStyles,
        sizeStyles[size],
        typeStyles[type],
        shapeStyles[rounded],
        className
      )}
    >
      {label}
    </span>
  );
};

Badge.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["info", "success", "warning", "error", "neutral"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  rounded: PropTypes.oneOf(["full", "md", "none"]),
  className: PropTypes.string,
};

export default Badge;
