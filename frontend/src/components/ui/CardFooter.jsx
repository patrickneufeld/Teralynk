// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/CardFooter.jsx

import React from "react";

const CardFooter = ({ children, className = "" }) => {
  return (
    <div className={`px-4 py-3 border-t border-gray-200 text-right ${className}`}>
      {children}
    </div>
  );
};

export default CardFooter;
