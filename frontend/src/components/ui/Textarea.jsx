// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/Textarea.jsx

import React from "react";

export const Textarea = ({ value, onChange, placeholder, rows = 5, className = "" }) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`border border-gray-300 rounded-md p-2 w-full resize-none ${className}`}
    />
  );
};

export default Textarea;
