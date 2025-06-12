//Users/patrick/Projects/Teralynk_Old/frontend/src/services/websocketService.js
import { createWebSocket } from '@/utils/mywebsocketClient';
import logger from '@/utils/logging/logging';

/**
 * WebSocket Service
 * 
 * Provides a clean abstraction around WebSocket connection, sending, and reconnecting logic.
 * Centralizes WebSocket management across the frontend app.
 */

let wsInstance = null;

/**
 * Connect to WebSocket server
 * 
 * @param {Object} handlers - Custom event handlers (onOpen, onMessage, onError, onClose)
 * @param {string} [path='/ws'] - WebSocket endpoint path
 */
export const connectWebSocket = (handlers = {}, path = '/ws') => {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    logger.warn('⚠️ WebSocket already connected. Closing existing connection first.');
    wsInstance.close();
  }

  try {
    wsInstance = createWebSocket(path, handlers);
    logger.info('✅ WebSocket connection initialized via websocketService');
  } catch (error) {
    logger.error('❌ Error initializing WebSocket connection', error);
  }
};

/**
 * Send a message through WebSocket
 * 
 * @param {Object|string} message - Message payload to send
 */
export const sendWebSocketMessage = (message) => {
  if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
    logger.error('❌ Cannot send message. WebSocket not connected.');
    return;
  }

  try {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    wsInstance.send(payload);
    logger.debug('📤 Message sent via WebSocket', { payload });
  } catch (error) {
    logger.error('❌ Failed to send WebSocket message', error);
  }
};

/**
 * Cleanly close the WebSocket connection
 */
export const closeWebSocketConnection = () => {
  if (!wsInstance) {
    logger.warn('⚠️ No active WebSocket to close.');
    return;
  }

  try {
    wsInstance.close();
    wsInstance = null;
    logger.info('🛑 WebSocket connection closed via websocketService');
  } catch (error) {
    logger.error('❌ Error while closing WebSocket', error);
  }
};

/**
 * Check if WebSocket is currently connected
 * 
 * @returns {boolean} True if connected, false otherwise
 */
export const isWebSocketConnected = () => {
  return wsInstance && wsInstance.readyState === WebSocket.OPEN;
};

/**
 * Handle WebSocket reconnect attempts
 * 
 * @param {number} retryCount - Number of retries attempted
 * @param {Function} reconnectHandler - Callback function to initiate reconnect
 */
export const handleReconnect = (retryCount, reconnectHandler) => {
  if (retryCount < 3) {
    setTimeout(() => {
      logger.warn(`🔄 Reconnecting WebSocket (Attempt ${retryCount + 1})...`);
      reconnectHandler();
    }, 3000 * (retryCount + 1)); // Exponential backoff
  } else {
    logger.error('❌ Reconnect failed after multiple attempts');
  }
};
