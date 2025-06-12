// ================================================
// ✅ FILE: /frontend/src/components/ui/Spinner.jsx
// Simple Spinner Component
// ================================================

import React from 'react';

const Spinner = ({ size = 'medium', color = '#3b82f6' }) => {
  // Determine size in pixels
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48
  };
  
  const pixelSize = typeof size === 'string' ? sizeMap[size] || 24 : size;
  
  return (
    <div 
      style={{
        display: 'inline-block',
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        border: `${pixelSize/8}px solid rgba(0, 0, 0, 0.1)`,
        borderLeftColor: color,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Spinner;
