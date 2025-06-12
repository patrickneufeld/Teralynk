// src/files/useSocket.js

import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { SOCKET_EVENTS } from './constants';

// =======================================
// 🌐 Dynamic WebSocket URL Builder
// =======================================
const getWebSocketUrl = () => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';

  const WS_HOST = import.meta.env.VITE_WS_HOST || '127.0.0.1';
  const WS_PORT = import.meta.env.VITE_WS_PORT || '5173';
  const WS_PATH = import.meta.env.VITE_WS_PATH || '/ws';

  if (isLocalhost) {
    return {
      url: `${protocol}://${WS_HOST}:${WS_PORT}`,
      path: WS_PATH
    };
  }

  return {
    url: `${protocol}://${window.location.hostname}`,
    path: WS_PATH
  };
};

const { url: WS_URL, path: WS_PATH } = getWebSocketUrl();

console.log('🚀 Dynamic WebSocket Setup:', {
  WS_URL,
  WS_PATH
});

// =======================================
// 🎯 useSocketConnection Hook
// =======================================
export const useSocketConnection = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    try {
      console.log('🔌 Attempting to connect to:', WS_URL);

      const newSocket = io(WS_URL, {
        path: WS_PATH,
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        timeout: 10000,
        forceNew: true
      });

      newSocket.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
      });

      newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
        console.warn('⚠️ WebSocket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
        console.error('❌ Connection error:', error);
        setConnectionError(error);
        setReconnectAttempts(prev => prev + 1);
      });

      newSocket.on(SOCKET_EVENTS.RECONNECT, (attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
        setReconnectAttempts(attemptNumber);
      });

      newSocket.on(SOCKET_EVENTS.RECONNECT_ERROR, (error) => {
        console.error('❌ Reconnection error:', error);
        setConnectionError(error);
      });

      newSocket.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, (attemptNumber) => {
        console.log(`🔄 Reconnect attempt ${attemptNumber}`);
      });

      newSocket.on(SOCKET_EVENTS.RECONNECT_FAILED, () => {
        console.error('❌ Reconnect failed');
        setConnectionError(new Error('Reconnect failed'));
      });

      setSocket(newSocket);
      return newSocket;
    } catch (error) {
      console.error('❌ WebSocket initialization failed:', error);
      setConnectionError(error);
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      console.log('🚪 Disconnecting WebSocket');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      setReconnectAttempts(0);
    }
  }, [socket]);

  useEffect(() => {
    console.log('🔄 Setting up WebSocket connection...');
    const socketInstance = connect();

    return () => {
      if (socketInstance) {
        console.log('🧹 Cleaning up WebSocket connection...');
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectionError(null);
        setReconnectAttempts(0);
      }
    };
  }, [connect]);

  return {
    socket,
    isConnected,
    connectionError,
    reconnectAttempts,
    connect,
    disconnect
  };
};

export default useSocketConnection;
