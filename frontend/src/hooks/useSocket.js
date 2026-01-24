import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://el-taller.onrender.com';

// Singleton para mantener una única conexión
let socket = null;
let connectionPromise = null;

const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('🔌 Socket conectado:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Error de conexión Socket:', error.message);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconectado después de', attemptNumber, 'intentos');
    });
  }
  return socket;
};

export function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = getSocket();
    
    return () => {
      // No desconectamos el socket al desmontar, lo mantenemos vivo
    };
  }, []);

  // Unirse a un local
  const joinLocal = useCallback((local) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_local', local);
    }
  }, []);

  // Unirse a una mesa
  const joinMesa = useCallback((mesaId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_mesa', mesaId);
    }
  }, []);

  // Salir de una mesa
  const leaveMesa = useCallback((mesaId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_mesa', mesaId);
    }
  }, []);

  // Escuchar evento
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  // Dejar de escuchar evento
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Emitir evento
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    joinLocal,
    joinMesa,
    leaveMesa,
    on,
    off,
    emit
  };
}

// Eventos disponibles:
// - mesa_actualizada: cuando cambia el estado de una mesa
// - pedido_actualizado: cuando se actualiza un pedido
// - producto_agregado: cuando se agrega producto a un pedido
// - barril_actualizado: cuando cambia el estado de un barril
// - turno_actualizado: cuando hay cambios en el turno

export default useSocket;