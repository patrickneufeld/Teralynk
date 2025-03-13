import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

/**
 * Alert Component
 * 
 * Features:
 * - Supports different types of alerts (info, success, warning, error)
 * - Can be dismissed manually or auto-dismissed
 * - Accessible with ARIA roles
 */
const Alert = ({ message, type = "info", autoDismiss = false, duration = 5000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (autoDismiss) {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, duration);

            return () => clearTimeout(timer); // Clean up the timer on component unmount
        }
    }, [autoDismiss, duration]);

    if (!isVisible || !message) return null;

    const alertClasses = {
        info: "bg-blue-100 text-blue-700",
        success: "bg-green-100 text-green-700",
        warning: "bg-yellow-100 text-yellow-700",
        error: "bg-red-100 text-red-700",
    };

    return (
        <div
            className={`alert p-4 rounded-lg shadow-md ${alertClasses[type]}`}
            role="alert"
        >
            <div className="flex justify-between items-center">
                <span>{message}</span>
                <button
                    className="ml-4 text-xl font-semibold"
                    onClick={() => setIsVisible(false)}
                    aria-label="Close alert"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

// PropTypes for Type Safety
Alert.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["info", "success", "warning", "error"]),
    autoDismiss: PropTypes.bool,
    duration: PropTypes.number,
};

// Default Props
Alert.defaultProps = {
    type: "info",
    autoDismiss: false,
    duration: 5000, // Default to 5 seconds
};

export default Alert;
