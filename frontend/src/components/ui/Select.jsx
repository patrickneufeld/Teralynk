// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/Select.jsx

import React from "react";

export const Select = ({ value, onChange, options = [], className = "" }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`border border-gray-300 rounded-md p-2 w-full ${className}`}
    >
      {options.map((opt, idx) => (
        <option key={idx} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export const SelectItem = ({ value, label }) => {
  return <option value={value}>{label}</option>;
};

export default Select;
