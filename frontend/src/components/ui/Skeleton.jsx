// ✅ File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/Skeleton.jsx

import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

/**
 * ✅ Skeleton Loading Component
 * Renders a shimmer placeholder for loading content.
 */
const Skeleton = ({ width = "100%", height = "1rem", rounded = "md", className = "" }) => {
  const radiusMap = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  return (
    <div
      className={clsx(
        "animate-pulse bg-gray-200 dark:bg-gray-700",
        radiusMap[rounded],
        className
      )}
      style={{ width, height }}
    />
  );
};

Skeleton.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  rounded: PropTypes.oneOf(["sm", "md", "lg", "xl", "full"]),
  className: PropTypes.string,
};

export default Skeleton;
