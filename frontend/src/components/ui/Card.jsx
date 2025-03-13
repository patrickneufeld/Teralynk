// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/Card.jsx

import React from "react";

export const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = "" }) => {
  return (
    <div className={`mt-2 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
