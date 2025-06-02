// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/CardContent.jsx

import React from "react";

const CardContent = ({ children, className = "" }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

export default CardContent;
