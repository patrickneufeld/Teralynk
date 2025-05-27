import React, { useState, useEffect } from 'react';
import { createWebSocket } from '../../utils/websocketClient';

/**
 * WebSocketHealthBanner Component
 * Shows connection status for WebSocket health checks
 * Disabled in development mode to avoid connection issues
 */
const WebSocketHealthBanner = () => {
  const [status, setStatus] = useState('CONNECTING');
  const [visible, setVisible] = useState(false);
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';

  useEffect(() => {
    // In development mode, use a mock connection that always shows as connected
    if (isDevelopment) {
      console.log('🔧 WebSocketHealthBanner: Using mock connection in development mode');
      setStatus('CONNECTED');
      // Show briefly then hide
      setVisible(true);
      setTimeout(() => setVisible(false), 2000);
      return () => {}; // No cleanup needed for mock
    }
    
    // In production, use real WebSocket connection
    const ws = createWebSocket('/health', {
      onOpen: () => {
        console.log('✅ Health WebSocket connected');
        setStatus('CONNECTED');
        setTimeout(() => setVisible(false), 2000); // Hide after 2 seconds when connected
      },
      onMessage: (data) => {
        // Handle health check messages
        if (data && data.status === 'ok') {
          setStatus('CONNECTED');
          setVisible(false);
        } else {
          setStatus('WARNING');
          setVisible(true);
        }
      },
      onClose: () => {
        console.log('⚠️ Health WebSocket closed');
        setStatus('DISCONNECTED');
        setVisible(true);
      },
      onError: () => {
        console.log('❌ Health WebSocket error');
        setStatus('ERROR');
        setVisible(true);
      }
    });

    // Show initially
    setVisible(true);

    return () => {
      ws.close();
    };
  }, [isDevelopment]);

  // Don't render anything if not visible or in development mode with no issues
  if (!visible || (isDevelopment && status === 'CONNECTED')) return null;

  return (
    <div 
      className={`websocket-health-banner ${status.toLowerCase()}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '8px 16px',
        textAlign: 'center',
        zIndex: 9999,
        backgroundColor: status === 'CONNECTED' ? '#4caf50' : 
                         status === 'CONNECTING' ? '#2196f3' : '#f44336',
        color: 'white',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease'
      }}
    >
      <span 
        className="status-indicator"
        style={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: status === 'CONNECTED' ? '#8bc34a' : 
                           status === 'CONNECTING' ? '#03a9f4' : '#e53935',
          marginRight: '8px',
          boxShadow: '0 0 5px rgba(255,255,255,0.5)'
        }}
      ></span>
      <span className="status-text">
        {status === 'CONNECTED' ? 'WebSocket Connected' : 
         status === 'CONNECTING' ? 'Connecting to Server...' : 
         'Connection Lost - Reconnecting...'}
      </span>
    </div>
  );
};

export default WebSocketHealthBanner;
