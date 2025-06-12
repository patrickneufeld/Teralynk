// File Path: /frontend/src/components/ui/Tooltip.jsx

import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

/**
 * ✅ Tooltip Component for Teralynk UI System
 * - Provides contextual help or hints
 * - Accessible with keyboard and screen readers
 * - Configurable position and delay
 */
export const Tooltip = ({
  children,
  content,
  position = "top",
  className = "",
  delay = 200,
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);
  const tooltipId = `tooltip-${Math.random().toString(36).substring(2, 9)}`;

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const tooltipPosition = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {React.cloneElement(children, {
        "aria-describedby": tooltipId,
      })}
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={clsx(
            "absolute z-50 px-2 py-1 text-sm text-white bg-gray-800 rounded shadow-lg whitespace-nowrap pointer-events-none",
            tooltipPosition[position],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.element.isRequired,
  content: PropTypes.string.isRequired,
  position: PropTypes.oneOf(["top", "bottom", "left", "right"]),
  className: PropTypes.string,
  delay: PropTypes.number,
};

export default Tooltip;
