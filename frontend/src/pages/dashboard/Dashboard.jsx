import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.jpeg';

export default function Dashboard() {
  const navigate = useNavigate();
  const usuario = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const modulos = [
    { nombre: 'Productos', icono: '📦', ruta: '/productos', desc: 'Gestión de inventario' },
    { nombre: 'Mesas', icono: '🪑', ruta: '/mesas', desc: 'Control de mesas' },
    { nombre: 'Punto de Venta', icono: '🍺', ruta: '/pos', desc: 'Tomar pedidos' },
    { nombre: 'Caja', icono: '💰', ruta: '/caja', desc: 'Turnos y arqueo' },
    { nombre: 'Clientes B2B', icono: '🏢', ruta: '/clientes-b2b', desc: 'Ventas mayoristas' },
    { nombre: 'Reportes', icono: '📊', ruta: '/reportes', desc: 'Estadísticas' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src={logo} alt="El Taller" className="w-14 h-14 rounded-full object-cover" />
            <div>
              <h1 className="text-xl font-bold text-[#D4B896] tracking-wide">EL TALLER</h1>
              <p className="text-xs text-gray-500">Beers and Games • Montería</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{usuario?.nombre}</p>
              <p className="text-xs text-[#D4B896]">{usuario?.rol}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] hover:text-white transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Bienvenida */}
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#141414] border border-[#2a2a2a] rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">
            Bienvenido, {usuario?.nombre}
          </h2>
          <p className="text-[#D4B896]">
            Sistema de gestión El Taller
          </p>
        </div>

        {/* Módulos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {modulos.map((modulo) => (
            <button
              key={modulo.nombre}
              onClick={() => navigate(modulo.ruta)}
              className="bg-[#141414] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#D4B896] rounded-xl p-5 text-center transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-[#1a1a1a] group-hover:bg-[#D4B896]/10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                <span className="text-2xl">{modulo.icono}</span>
              </div>
              <p className="text-white font-medium text-sm">{modulo.nombre}</p>
              <p className="text-gray-600 text-xs mt-1">{modulo.desc}</p>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-gray-500 text-sm mb-1">Ventas Hoy</p>
            <p className="text-3xl font-bold text-[#D4B896]">$0</p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-gray-500 text-sm mb-1">Mesas Activas</p>
            <p className="text-3xl font-bold text-emerald-500">0</p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-gray-500 text-sm mb-1">Productos</p>
            <p className="text-3xl font-bold text-white">1</p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-gray-500 text-sm mb-1">Stock Bajo</p>
            <p className="text-3xl font-bold text-red-500">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}