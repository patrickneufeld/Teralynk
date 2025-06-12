// ================================================
// ✅ FILE: /frontend/src/components/common/WebSocketHealthBanner.jsx
// WebSocket Health Banner Component
// ================================================

import React, { useState, useEffect } from 'react';

const WebSocketHealthBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // In development mode, just show a mock message
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 WebSocketHealthBanner: Using mock connection in development mode');
      return;
    }
    
    // In production, we would check the actual WebSocket connection
    // This is just a placeholder implementation
    const checkWebSocketHealth = () => {
      // Implement actual WebSocket health check logic here
    };
    
    const interval = setInterval(checkWebSocketHealth, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '0.5rem',
        textAlign: 'center',
        zIndex: 1000
      }}
    >
      WebSocket connection issue detected. Some real-time features may be unavailable.
      <button 
        onClick={() => setIsVisible(false)}
        style={{
          marginLeft: '1rem',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        ×
      </button>
    </div>
  );
};

export default WebSocketHealthBanner;
