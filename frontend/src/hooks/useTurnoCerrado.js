import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://el-taller.onrender.com';

export const useTurnoCerrado = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser || !currentUser.id) {
      return;
    }

    console.log('🔒 Hook turno_cerrado activo para:', currentUser.id);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Socket turno_cerrado conectado');
    });

    socket.on('turno_cerrado', (data) => {
      console.log('🔒 Evento turno_cerrado recibido:', data);
      
      const esMiTurno = 
        data.usuario_id === currentUser.id || 
        data.cajero_id === currentUser.id;
      
      if (esMiTurno) {
        console.log('⚠️ Es mi turno - cerrando sesión...');
        
        toast.error('Tu turno ha sido cerrado', {
          duration: 3000,
          icon: '🔒',
          position: 'top-center',
        });

        setTimeout(() => {
          authService.logout();
          navigate('/login', { replace: true });
          window.location.reload();
        }, 2000);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket turno_cerrado desconectado');
    });

    return () => {
      console.log('🧹 Limpiando socket turno_cerrado');
      socket.disconnect();
    };
  }, [navigate]);
};