// ✅ FILE: /frontend/src/components/ui/PasswordStrengthMeter.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * PasswordStrengthMeter
 * Displays a visual strength indicator based on the password strength value
 *
 * @param {string} strength - "weak", "medium", "strong"
 */
const PasswordStrengthMeter = ({ strength }) => {
  if (!strength) return null;

  const getStrengthLabel = () => {
    switch (strength) {
      case "strong":
        return { color: "bg-green-500", label: "Strong" };
      case "medium":
        return { color: "bg-yellow-500", label: "Medium" };
      case "weak":
      default:
        return { color: "bg-red-500", label: "Weak" };
    }
  };

  const { color, label } = getStrengthLabel();

  return (
    <div className="password-strength-meter mt-2">
      <div className="w-full bg-gray-200 rounded h-2">
        <div className={`h-2 rounded ${color}`} style={{ width: "100%" }}></div>
      </div>
      <p className="text-xs mt-1 text-gray-700">Strength: {label}</p>
    </div>
  );
};

PasswordStrengthMeter.propTypes = {
  strength: PropTypes.oneOf(["weak", "medium", "strong"]),
};

export default PasswordStrengthMeter;
