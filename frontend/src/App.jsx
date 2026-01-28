import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Productos from "./pages/productos/Productos";
import Mesas from "./pages/mesas/Mesas";
import POS from "./pages/pos/Pos";
import Pedido from "./pages/pos/Pedido";
import Caja from "./pages/caja/Caja";
import Reportes from "./pages/reportes/Reportes";
import { AuthProvider } from "./context/AuthContext";

// ⭐ NUEVAS RUTAS KARDEX - Ajustar paths
import Proveedores from "./pages/proveedores/Proveedores";
import RegistrarCompra from "./pages/compras/RegistrarCompra";
import InventarioValorizado from "./pages/productos/InventarioValorizado";
import { Navigate } from "react-router-dom";
import IntentosAcceso from "./pages/admin/IntentosAcceso";
import GestionUsuarios from "./pages/admin/GestionUsuarios";
import { useSocket } from './hooks/useSocket';
import { authService } from './services/authService';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://el-taller.onrender.com';

// ⭐ Hook global para monitorear cierre de turno
function useTurnoCerradoGlobal() {
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    // Solo activar para usuarios autenticados
    if (!currentUser || !currentUser.id) {
      return;
    }

    // No activar para admins (ellos cierran los turnos)
    if (currentUser.rol === 'admin') {
      return;
    }

    console.log('🔒 Monitoreo de turno_cerrado activo para:', currentUser.nombre, `(ID: ${currentUser.id})`);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log('✅ Socket turno_cerrado conectado:', socket.id);
    });

    socket.on('turno_cerrado', (data) => {
      console.log('🔒 Evento turno_cerrado recibido:', data);
      
      // Verificar si este evento es para el usuario actual
      const esMiTurno = 
        data.usuario_id === currentUser.id || 
        data.cajero_id === currentUser.id;
      
      if (esMiTurno) {
        console.log('⚠️ MI TURNO FUE CERRADO - Cerrando sesión automáticamente...');
        
        // Mostrar notificación al usuario
        toast.error('Tu turno ha sido cerrado por el administrador', {
          duration: 4000,
          icon: '🔒',
          position: 'top-center',
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '16px'
          }
        });

        // Cerrar sesión después de 2 segundos
        setTimeout(() => {
          console.log('🚪 Cerrando sesión...');
          authService.logout();
          navigate('/login', { replace: true });
          window.location.reload();
        }, 2000);
      } else {
        console.log('ℹ️ Evento de cierre de turno para otro usuario:', data.usuario_id);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.IO:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket turno_cerrado desconectado:', reason);
    });

    // Cleanup al desmontar
    return () => {
      console.log('🧹 Limpiando socket turno_cerrado');
      socket.disconnect();
    };
  }, [navigate]);
}

// ⭐ Componente interno que usa hooks dentro del Router
function AppContent() {
  useSocket(); // Socket para mesas y otros eventos
  useTurnoCerradoGlobal(); // ⭐ Socket para monitorear cierre de turno (GLOBAL)
  
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/mesas" element={<Mesas />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/pos/pedido/:pedido_id" element={<Pedido />} />
        <Route path="/caja" element={<Caja />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/admin/intentos-acceso" element={<IntentosAcceso />} />
        <Route path="/admin/usuarios" element={<GestionUsuarios />} />
        
        {/* ⭐ Rutas Kardex Premium */}
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/compras/nueva" element={<RegistrarCompra />} />
        <Route path="/inventario/valorizado" element={<InventarioValorizado />} />
        <Route path="/inventario" element={<Navigate to="/productos" replace />} />
        
        <Route path="/" element={<Login />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;