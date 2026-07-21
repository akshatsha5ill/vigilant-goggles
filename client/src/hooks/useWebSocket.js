import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

let sharedSocket = null;

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

      sharedSocket.on('connect', () => {
        console.log('WebSocket connected');
      });

      sharedSocket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      sharedSocket.on('reconnect', (attempt) => {
        console.log('WebSocket reconnected after', attempt, 'attempts');
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

  return { emit, subscribe, socket: socketRef.current };
};
