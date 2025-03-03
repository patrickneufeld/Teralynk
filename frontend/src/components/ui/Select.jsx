import React from "react";

export function SelectItem({ children, value, className = "", ...props }) {
    return (
        <option value={value} className={className} {...props}>
            {children}
        </option>
    );
}

export default function Select({ options = [], onChange, className = "", defaultValue = "", disabled = false, ariaLabel = "Select an option", ...props }) {
    return (
        <select
            className={`border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            onChange={onChange}
            defaultValue={defaultValue}
            disabled={disabled}
            aria-label={ariaLabel}
            {...props}
        >
            {options.length === 0 ? (
                <SelectItem value="" disabled>No options available</SelectItem>
            ) : (
                options.map((option, index) => (
                    <SelectItem key={index} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))
            )}
        </select>
    );
}
