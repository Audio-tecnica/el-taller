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

    console.log('🔌 Socket conectado para usuario:', currentUser.id);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket.id);
    });

    socket.on('turno_cerrado', (data) => {
      console.log('🔒 Turno cerrado recibido:', data);
      
      const esMiTurno = 
        data.usuario_id === currentUser.id || 
        data.cajero_id === currentUser.id;
      
      if (esMiTurno) {
        toast.error('Tu turno ha sido cerrado', {
          duration: 3000,
          icon: '🔒',
        });

        setTimeout(() => {
          authService.logout();
          navigate('/login', { replace: true });
          window.location.reload();
        }, 2000);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);
};