// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/Loader.jsx

import React from "react";

export const Loader = ({ size = "md", className = "" }) => {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-4 border-t-blue-500 border-gray-200 ${sizeMap[size]}`}
      />
    </div>
  );
};

export default Loader;
