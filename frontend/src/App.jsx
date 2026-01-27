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

// ⭐ NUEVAS RUTAS KARDEX - Ajustar paths
import Proveedores from "./pages/proveedores/Proveedores";
import RegistrarCompra from "./pages/compras/RegistrarCompra";
import InventarioValorizado from "./pages/productos/InventarioValorizado";
import { Navigate } from "react-router-dom";
import IntentosAcceso from "./pages/admin/IntentosAcceso";
import GestionUsuarios from "./pages/admin/GestionUsuarios";

function App() {
  return (
    <Router>
      <AuthProvider>
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
      </AuthProvider>
    </Router>
  );
}

export default App;