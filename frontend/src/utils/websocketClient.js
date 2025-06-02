import { getToken } from './tokenManager';
import logger from './logging/logging';

/**
 * WebSocket Client Utility with Auto-Reconnect and Timeout Handling
 * Improved for better compatibility and resilience
 */

// ✅ Build WebSocket URL using dynamic protocol and host
const buildWebSocketUrl = (path = '/ws') => {
  // Determine WebSocket protocol based on page protocol
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.hostname;
  const wsPort = window.location.port || (wsProtocol === 'wss:' ? '443' : '80');
  
  // Ensure path starts with a slash
  const wsPath = path.startsWith('/') ? path : `/${path}`;
  
  // Get authentication token
  const token = getToken ? getToken() : null;
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
  
  // Build full WebSocket URL
  const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}${wsPath}${tokenQuery}`;
  
  // Log for debugging
  console.log('🔍 DEBUG: Using WebSocket URL:', wsUrl);
  logger.info('🔗 WebSocket URL constructed', { wsUrl });
  
  return wsUrl;
};

// Mock WebSocket for development if needed
const createMockWebSocket = (path) => {
  // Create a mock implementation that simulates WebSocket behavior
  const mockWs = {
    readyState: 1, // WebSocket.OPEN
    send: (data) => {
      console.log('📤 Mock WebSocket: Message sent', data);
      // Simulate response after a short delay
      setTimeout(() => {
        if (typeof mockWs.onmessage === 'function') {
          mockWs.onmessage({ 
            data: JSON.stringify({ 
              type: 'response', 
              message: 'Mock response',
              path: path
            })
          });
        }
      }, 500);
    },
    close: () => {
      console.log('🛑 Mock WebSocket: Connection closed');
      mockWs.readyState = 3; // WebSocket.CLOSED
      if (typeof mockWs.onclose === 'function') {
        mockWs.onclose({ code: 1000, reason: 'Normal closure' });
      }
    }
  };
  
  // Simulate connection success after a short delay
  setTimeout(() => {
    if (typeof mockWs.onopen === 'function') {
      mockWs.onopen({});
    }
    
    // Start sending periodic health messages if this is a health endpoint
    if (path === '/health') {
      const interval = setInterval(() => {
        if (mockWs.readyState === 1 && typeof mockWs.onmessage === 'function') {
          mockWs.onmessage({
            data: JSON.stringify({ type: 'health', status: 'ok' })
          });
        } else {
          clearInterval(interval);
        }
      }, 5000);
    }
  }, 1000);
  
  return mockWs;
};

/**
 * Create a managed WebSocket client with handlers for open, message, error, and close events.
 */
export function createWebSocket(path = '/ws', { onOpen, onMessage, onError, onClose } = {}) {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
  
  // For health checks in development, use mock WebSocket
  if (isDevelopment && path === '/health') {
    logger.info('🔧 Using mock WebSocket for health checks in development');
    const mockWs = createMockWebSocket(path);
    mockWs.onopen = onOpen;
    mockWs.onmessage = onMessage ? (event) => onMessage(JSON.parse(event.data)) : undefined;
    mockWs.onerror = onError;
    mockWs.onclose = onClose;
    
    return {
      close: () => mockWs.close(),
      send: (data) => mockWs.send(data),
      getStatus: () => ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][mockWs.readyState]
    };
  }
  
  // For real WebSocket connections
  const wsUrl = buildWebSocketUrl(path);
  logger.info('🔗 Connecting WebSocket', { wsUrl });

  let ws;
  let shouldReconnect = true;
  let timeoutId;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = () => {
    try {
      // Create WebSocket connection
      ws = new WebSocket(wsUrl);

      // Set connection timeout
      timeoutId = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          logger.error('⏰ WebSocket connection timeout, closing...');
          ws.close();
        }
      }, 10000);  // 10 seconds timeout (increased from 5s)

      // WebSocket open event
      ws.onopen = (event) => {
        clearTimeout(timeoutId);
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        logger.info('✅ WebSocket connected', { url: wsUrl });
        onOpen?.(event);
      };

      // WebSocket message event
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          logger.debug('📩 WebSocket message received:', data);
          onMessage?.(data);
        } catch (err) {
          logger.error('❌ WebSocket message parsing error', err);
          // Try to handle as plain text if JSON parsing fails
          onMessage?.(event.data);
        }
      };

      // WebSocket error event
      ws.onerror = (event) => {
        logger.error('❌ WebSocket error', { url: wsUrl });
        onError?.(event);
      };

      // WebSocket close event
      ws.onclose = (event) => {
        clearTimeout(timeoutId);
        logger.warn(`⚡ WebSocket closed (code=${event.code}, reason=${event.reason || 'No reason provided'})`);
        onClose?.(event);

        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff with max 30s
          logger.info(`⏳ Reconnecting WebSocket in ${delay/1000} seconds... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          setTimeout(connect, delay);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          logger.error('❌ Maximum reconnection attempts reached. Giving up.');
        }
      };
    } catch (err) {
      logger.error('❌ WebSocket connection failed', { url: wsUrl, error: err.message });
      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        setTimeout(connect, delay);
      }
    }
  };

  connect();

  return {
    close: () => {
      shouldReconnect = false;
      if (ws) {
        ws.close();
        ws = null;
        logger.info('🛑 WebSocket connection closed manually');
      }
    },
    send: (data) => {
      if (ws?.readyState === WebSocket.OPEN) {
        try {
          const payload = typeof data === 'string' ? data : JSON.stringify(data);
          ws.send(payload);
          logger.debug('📤 WebSocket message sent', { data });
        } catch (err) {
          logger.error('❌ Failed to send WebSocket message', err);
        }
      } else {
        logger.warn('⚠️ Tried to send message but WebSocket is not open', { 
          status: ws ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState] : 'NO_SOCKET' 
        });
      }
    },
    getStatus: () => {
      if (!ws) return 'CLOSED';
      switch (ws.readyState) {
        case WebSocket.CONNECTING: return 'CONNECTING';
        case WebSocket.OPEN: return 'OPEN';
        case WebSocket.CLOSING: return 'CLOSING';
        case WebSocket.CLOSED: return 'CLOSED';
        default: return 'UNKNOWN';
      }
    }
  };
}
