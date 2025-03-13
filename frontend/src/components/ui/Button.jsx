import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

/**
 * Custom Button Component
 * 
 * Features:
 * - Supports primary, secondary, and danger variants
 * - Allows full width or standard button styles
 * - Includes loading state
 * - Provides accessibility with ARIA attributes
 * - Smooth hover, focus, and disabled transitions
 * - Optionally includes icons
 */
const Button = ({
    children,
    onClick,
    className = "",
    variant = "primary",
    size = "md",
    disabled = false,
    isLoading = false,
    fullWidth = false,
    type = "button",
    ariaLabel = "Button",
    leftIcon = null,
    rightIcon = null,
    ...props
}) => {
    // Variant Styles
    const variantClasses = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white border border-blue-600",
        secondary: "bg-gray-500 hover:bg-gray-600 text-white border border-gray-500",
        danger: "bg-red-600 hover:bg-red-700 text-white border border-red-600",
        outline: "bg-transparent border border-gray-400 text-gray-600 hover:bg-gray-100"
    };

    // Size Styles
    const sizeClasses = {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-4 py-2",
        lg: "text-lg px-6 py-3"
    };

    // Concatenate classes dynamically based on the props
    const buttonClasses = clsx(
        variantClasses[variant], 
        sizeClasses[size],
        {
            "w-full": fullWidth,
            "w-auto": !fullWidth,
            "font-semibold rounded-md shadow-sm": true,
            "focus:outline-none focus:ring-2 focus:ring-offset-2": true,
            "transition-all disabled:opacity-50 disabled:cursor-not-allowed": true,
        },
        className
    );

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={buttonClasses}
            aria-label={ariaLabel}
            aria-busy={isLoading ? "true" : "false"}
            {...props}
        >
            {isLoading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-t-white border-r-white border-b-gray-400 border-l-gray-400 rounded-full"></span>
            ) : (
                <>
                    {leftIcon && <span className="mr-2">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="ml-2">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};

// PropTypes for Type Safety
Button.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    className: PropTypes.string,
    variant: PropTypes.oneOf(["primary", "secondary", "danger", "outline"]),
    size: PropTypes.oneOf(["sm", "md", "lg"]),
    disabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    fullWidth: PropTypes.bool,
    type: PropTypes.oneOf(["button", "submit", "reset"]),
    ariaLabel: PropTypes.string,
    leftIcon: PropTypes.node,
    rightIcon: PropTypes.node
};

// Default Props
Button.defaultProps = {
    onClick: () => {},
    variant: "primary",
    size: "md",
    disabled: false,
    isLoading: false,
    fullWidth: false,
    type: "button",
    ariaLabel: "Button",
    leftIcon: null,
    rightIcon: null
};

export default Button;
export { Button };
