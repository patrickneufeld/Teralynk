// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/CardHeader.jsx

import React from "react";

const CardHeader = ({ children, className = "" }) => {
  return (
    <div className={`px-4 pt-4 pb-2 text-lg font-semibold border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export default CardHeader;
