// ✅ FILE: /src/components/common/Loading.jsx

import React from "react";
import PropTypes from "prop-types";
import "../styles/components/Loading.css"; // Ensure consistent styling

const Loading = ({ message = "Loading...", size = "medium" }) => {
  return (
    <div className={`loading-container loading-${size}`}>
      <div className="spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

Loading.propTypes = {
  message: PropTypes.string, // Customize loading text
  size: PropTypes.oneOf(["small", "medium", "large"]), // Customize spinner size
};

export default Loading;
