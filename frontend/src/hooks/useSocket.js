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
    
    // ⭐ CAMBIADO: No verificar por rol, sino verificar si hay usuario
    // (Ya aprendimos que no hay campo "rol", la detección es por turno)
    if (!currentUser || !currentUser.id) {
      return;
    }

    console.log('🔌 Iniciando conexión Socket.IO para usuario:', currentUser.id);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Socket conectado:', socket.id);
    });

    // ⭐ Escuchar evento de turno cerrado
    socket.on('turno_cerrado', (data) => {
      console.log('🔒 Evento turno_cerrado recibido:', data);
      console.log('👤 Usuario actual:', currentUser.id);
      console.log('🎯 Comparando con:', data.cajero_id, data.usuario_id);
      
      // ⭐ Verificar si es el usuario actual (usando ambos IDs por si acaso)
      const esMiTurno = 
        data.usuario_id === currentUser.id || 
        data.cajero_id === currentUser.id;
      
      if (esMiTurno) {
        console.log('⚠️ ES MI TURNO - Cerrando sesión...');
        
        toast.error('Tu turno ha sido cerrado por un administrador', {
          duration: 3000,
          icon: '🔒',
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '16px'
          }
        });

        // Esperar 2 segundos y cerrar sesión
        setTimeout(() => {
          authService.logout();
          navigate('/login', { replace: true });
          window.location.reload(); // Forzar recarga para limpiar todo
        }, 2000);
      } else {
        console.log('ℹ️ Evento de turno cerrado, pero no es para este usuario');
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Error de conexión Socket:', error);
    });

    // Cleanup
    return () => {
      console.log('🧹 Limpiando socket...');
      socket.disconnect();
    };
  }, [navigate]);
};