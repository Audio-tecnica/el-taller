import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Productos from './pages/productos/Productos';
import Mesas from './pages/mesas/Mesas';
import POS from './pages/pos/Pos';
import Pedido from './pages/pos/Pedido';
import Caja from './pages/caja/Caja';
import { AuthProvider } from './context/AuthContext';
import Inventario from './pages/inventario/Inventario';

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
          <Route path="/" element={<Login />} />
          <Route path="/inventario" element={<Inventario />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;