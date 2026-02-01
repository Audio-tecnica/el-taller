import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://el-taller.onrender.com';

export const useSocket = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser || !currentUser.id) {
      return;
    }

    console.log('🔌 Iniciando Socket para usuario:', currentUser.id, currentUser.nombre);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      // ⭐ Agregar path explícito
      path: '/socket.io/'
    });

    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket.id);
    });

    socket.on('turno_cerrado', (data) => {
      const esMiTurno = 
        data.usuario_id === currentUser.id || 
        data.cajero_id === currentUser.id;
      
      if (esMiTurno) {
        toast.error('Tu turno ha sido cerrado por el administrador', {
          duration: 4000,
          icon: '🔒',
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: 'bold',
          }
        });

        setTimeout(() => {
          authService.logout();
          navigate('/login', { replace: true });
          window.location.reload();
        }, 2500);
      }
    });

    // ⭐ Capturar TODOS los tipos de errores
    socket.on('connect_error', (error) => {
      // Solo logear errores que NO sean de namespace
      if (!error.message?.includes('Invalid namespace')) {
        console.error('Socket connect_error:', error.message);
      }
    });

    socket.on('error', (error) => {
      if (!error.message?.includes('Invalid namespace')) {
        console.error('Socket error:', error.message);
      }
    });

    socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        console.log('Socket desconectado:', reason);
      }
    });

    // ⭐ Prevenir propagación de errores no manejados
    socket.io.on('error', () => {
      // Silenciar errores de namespace
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);
};