import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

let sharedSocket = null;

export const disconnectSocket = () => {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
};

export const useWebSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!sharedSocket) {
      sharedSocket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

    }

    socketRef.current = sharedSocket;

    return () => {
      // Don't disconnect the shared socket on component unmount
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const subscribe = useCallback((event, callback) => {
    const socket = socketRef.current;
    if (socket) {
      socket.on(event, callback);
    }
    return () => {
      if (socket) {
        socket.off(event, callback);
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
  }, []);

  return { emit, subscribe, disconnect, socket: socketRef.current };
};
