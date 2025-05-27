import React from 'react';
import PropTypes from 'prop-types';

// 🎨 Small colored circle based on WebSocket connection status
const getStatusColor = (connected) => {
  if (connected === true) return 'bg-green-500';   // 🟢 Connected
  if (connected === false) return 'bg-red-500';    // 🔴 Disconnected
  return 'bg-yellow-500';                           // 🟡 Connecting
};

/**
 * WebSocketStatus Component
 *
 * @param {boolean|null} connected - true (connected), false (disconnected), null (connecting)
 * @param {Function} [onReconnect] - Optional manual reconnect handler
 */
const WebSocketStatus = ({ connected, onReconnect }) => {
  const statusLabel = connected === true
    ? 'Connected'
    : connected === false
    ? 'Disconnected'
    : 'Connecting...';

  // Handle null or undefined 'connected' prop
  const isConnected = connected !== null && connected !== undefined;

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-gray-100 dark:bg-gray-800" aria-live="polite">
      <div 
        className={`w-3 h-3 rounded-full ${getStatusColor(connected)}`} 
        aria-label={`WebSocket is ${statusLabel.toLowerCase()}`}
      >
        {/* Pulsating effect for 'connecting' state */}
        {connected === null && (
          <div className="animate-ping w-3 h-3 bg-yellow-500 rounded-full" />
        )}
      </div>
      <span className="text-sm font-medium">{statusLabel}</span>

      {connected === false && onReconnect && (
        <button
          onClick={onReconnect}
          className="ml-4 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
          aria-label="Attempt to reconnect to WebSocket"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};

// ✅ Type checking
WebSocketStatus.propTypes = {
  connected: PropTypes.bool,  // true (connected), false (disconnected), null (connecting)
  onReconnect: PropTypes.func,
};

// ✅ Defaults
WebSocketStatus.defaultProps = {
  connected: null, // Default to null for the "connecting" state
  onReconnect: null,
};

export default WebSocketStatus;
