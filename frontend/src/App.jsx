import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Productos from "./pages/productos/Productos";
import Mesas from "./pages/mesas/Mesas";
import POS from "./pages/pos/Pos";
import Pedido from "./pages/pos/Pedido";
import Caja from "./pages/caja/Caja";
import Reportes from "./pages/reportes/Reportes";
import { AuthProvider } from "./context/AuthContext";
import ClientesB2B from './pages/clientesB2B/ClientesB2B';
import PagosB2B from './pages/pagosB2B/pagosB2B';

// ⭐ NUEVAS RUTAS KARDEX - Ajustar paths
import Proveedores from "./pages/proveedores/Proveedores";
import RegistrarCompra from "./pages/compras/RegistrarCompra";
import InventarioValorizado from "./pages/productos/InventarioValorizado";
import { Navigate } from "react-router-dom";
import IntentosAcceso from "./pages/admin/IntentosAcceso";
import GestionUsuarios from "./pages/admin/GestionUsuarios";
import { useSocket } from './hooks/useSocket';
import VentasB2B from './pages/ventasB2B/VentasB2B';

// ⭐ Componente interno que usa useSocket dentro del Router
function AppContent() {
  // ⭐ UN SOLO SOCKET - Ya maneja tanto mesas como turno_cerrado
  useSocket();
  
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
        <Route path="/clientes-b2b" element={<ClientesB2B />} />
        <Route path="/ventas-b2b" element={<VentasB2B />} />
        <Route path="/pagos-b2b" element={<PagosB2B />} />
        
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