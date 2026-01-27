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
    
    // Solo conectar socket para cajeros
    if (!currentUser || currentUser.rol !== 'cajero') {
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('🔌 Socket conectado');
    });

    // ⭐ Escuchar evento de turno cerrado
    socket.on('turno_cerrado', (data) => {
      console.log('🔒 Turno cerrado detectado:', data);
      
      // Verificar si es el usuario actual
      if (data.usuario_id === currentUser.id) {
        toast.error('Tu turno ha sido cerrado. Cerrando sesión...', {
          duration: 3000,
          icon: '🔒'
        });

        // Esperar 2 segundos y cerrar sesión
        setTimeout(() => {
          authService.logout();
          navigate('/login');
          toast.success('Sesión cerrada');
        }, 2000);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [navigate]);
};