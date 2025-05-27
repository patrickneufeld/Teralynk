import { useState, useEffect, useCallback } from 'react';
import { createWebSocket } from '../utils/websocketClient';
import { WS_EVENTS, WS_STATUS } from './constants'; // Now importing from the created file

const useWebSocket = (path = '/ws', options = {}) => {
  const [status, setStatus] = useState(WS_STATUS.CONNECTING);
  const [lastMessage, setLastMessage] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = createWebSocket(path, {
      onOpen: (event) => {
        setStatus(WS_STATUS.CONNECTED);
        options.onOpen?.(event);
      },
      onMessage: (data) => {
        setLastMessage(data);
        options.onMessage?.(data);
      },
      onError: (error) => {
        setStatus(WS_STATUS.ERROR);
        options.onError?.(error);
      },
      onClose: (event) => {
        setStatus(WS_STATUS.DISCONNECTED);
        options.onClose?.(event);
      }
    });

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [path]);

  const sendMessage = useCallback((data) => {
    if (socket) {
      socket.send(data);
      return true;
    }
    return false;
  }, [socket]);

  return {
    status,
    lastMessage,
    sendMessage,
    isConnected: status === WS_STATUS.CONNECTED
  };
};

export default useWebSocket;
