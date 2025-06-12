// ✅ FILE: /frontend/src/components/ui/LiquidGlassIcon.jsx
import React from "react";
import PropTypes from "prop-types";
import "./LiquidGlassIcon.css";

const LiquidGlassIcon = ({ src, size = 80, alt = "icon" }) => (
  <div className="liquid-glass-wrapper" style={{ width: size, height: size }}>
    <img src={src} alt={alt} className="liquid-glass-icon" />
  </div>
);

LiquidGlassIcon.propTypes = {
  src: PropTypes.string.isRequired,
  size: PropTypes.number,
  alt: PropTypes.string,
};

export default LiquidGlassIcon;
