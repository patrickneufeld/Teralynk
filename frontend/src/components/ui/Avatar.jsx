// File: /frontend/src/components/ui/Avatar.jsx

import React, { useState } from "react";
import PropTypes from "prop-types";

/**
 * ✅ Avatar component for Teralynk UI System
 * - Renders a profile image or fallback initials/text
 * - Supports strict numeric or named sizes
 * - Forces image to respect exact px dimensions
 */
export const Avatar = ({
  src,
  alt = "User Avatar",
  size = 32, // default to 32px
  fallbackText = "",
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  const namedSizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 80,
  };

  const numericSize = typeof size === "number" ? size : namedSizeMap[size] || 32;

  const wrapperStyle = {
    width: `${numericSize}px`,
    height: `${numericSize}px`,
    fontSize: `${Math.round(numericSize * 0.4)}px`,
  };

  const imgStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "9999px",
    display: "block",
  };

  const baseClasses = `inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-semibold overflow-hidden ${className}`;

  return (
    <div
      className={baseClasses}
      role="img"
      aria-label={alt}
      title={alt}
      style={wrapperStyle}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          style={imgStyle}
          onError={() => setImageError(true)}
        />
      ) : (
        <span>{fallbackText}</span>
      )}
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.oneOfType([
    PropTypes.oneOf(["sm", "md", "lg", "xl"]),
    PropTypes.number,
  ]),
  fallbackText: PropTypes.string,
  className: PropTypes.string,
};

export default Avatar;
