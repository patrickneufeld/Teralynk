import React, { forwardRef } from "react";

const Input = forwardRef(
  (
    {
      type = "text",
      placeholder = "",
      value,
      onChange,
      className = "",
      id,
      name,
      required = false,
      disabled = false,
      autoComplete = "off",
      maxLength,
      minLength,
      pattern,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    return (
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        ref={ref}
        aria-label={ariaLabel || placeholder || name}
        className={`border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );
  }
);

export default Input;
