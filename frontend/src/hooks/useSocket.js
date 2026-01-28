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
      console.log('⚠️ No hay usuario autenticado - Socket no se iniciará');
      return;
    }

    console.log('🔌 Iniciando Socket para usuario:', currentUser.id, currentUser.nombre);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Socket conectado exitosamente:', socket.id);
    });

    socket.on('turno_cerrado', (data) => {
      console.log('🔒 ===== EVENTO TURNO_CERRADO RECIBIDO =====');
      console.log('📦 Data completa:', JSON.stringify(data, null, 2));
      console.log('👤 Current User ID:', currentUser.id);
      console.log('👤 Current User Nombre:', currentUser.nombre);
      console.log('🔑 data.usuario_id:', data.usuario_id);
      console.log('🔑 data.cajero_id:', data.cajero_id);
      
      const esMiTurno = 
        data.usuario_id === currentUser.id || 
        data.cajero_id === currentUser.id;
      
      console.log('✅ ¿Es mi turno?:', esMiTurno);
      console.log('🔍 Comparación 1 (usuario_id === currentUser.id):', data.usuario_id === currentUser.id);
      console.log('🔍 Comparación 2 (cajero_id === currentUser.id):', data.cajero_id === currentUser.id);
      console.log('🔍 Tipo de dato usuario_id:', typeof data.usuario_id);
      console.log('🔍 Tipo de dato cajero_id:', typeof data.cajero_id);
      console.log('🔍 Tipo de dato currentUser.id:', typeof currentUser.id);
      console.log('==========================================');
      
      if (esMiTurno) {
        console.log('⚠️ ¡MI TURNO FUE CERRADO! - Iniciando cierre de sesión...');
        
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
          console.log('🚪 Ejecutando logout y redirect...');
          authService.logout();
          navigate('/login', { replace: true });
          window.location.reload();
        }, 2500);
      } else {
        console.log('ℹ️ Evento de cierre de turno para otro usuario (ignorado)');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.IO:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket desconectado. Razón:', reason);
    });

    return () => {
      console.log('🧹 Limpiando conexión de Socket');
      socket.disconnect();
    };
  }, [navigate]);
};