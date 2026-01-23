import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mesasService } from '../../services/mesasService';
import { pedidosService } from '../../services/pedidosService';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.jpeg';

export default function POS() {
  const navigate = useNavigate();
  const [mesas, setMesas] = useState([]);
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroLocal, setFiltroLocal] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [mesasData, localesData] = await Promise.all([
        mesasService.getMesas(),
        mesasService.getLocales()
      ]);
      setMesas(mesasData);
      setLocales(localesData);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleMesaClick = async (mesa) => {
    try {
      if (mesa.estado === 'disponible') {
        // Abrir nuevo pedido
        const pedido = await pedidosService.abrirPedido(mesa.id);
        toast.success(`Pedido abierto en Mesa ${mesa.numero}`);
        navigate(`/pos/pedido/${pedido.id}`);
      } else if (mesa.estado === 'ocupada') {
        // Ir al pedido existente
        try {
          const pedido = await pedidosService.getPedidoMesa(mesa.id);
          navigate(`/pos/pedido/${pedido.id}`);
        } catch (error) {
          toast.error('No se encontró el pedido');
        }
      }
    } catch (error) {
      if (error.response?.data?.pedido_id) {
        navigate(`/pos/pedido/${error.response.data.pedido_id}`);
      } else {
        toast.error(error.response?.data?.error || 'Error al procesar');
      }
    }
  };

  const getEstadoStyles = (estado) => {
    switch (estado) {
      case 'disponible': 
        return 'border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20';
      case 'ocupada': 
        return 'border-red-500 bg-red-500/10 hover:bg-red-500/20';
      case 'reservada': 
        return 'border-yellow-500 bg-yellow-500/10';
      default: 
        return 'border-gray-600';
    }
  };

  const mesasFiltradas = filtroLocal
    ? mesas.filter(m => m.local_id === filtroLocal)
    : mesas;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4B896] text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-4 hover:opacity-80 transition">
              <img src={logo} alt="El Taller" className="w-12 h-12 rounded-full object-contain bg-black" />
              <div>
                <h1 className="text-lg font-bold text-[#D4B896] tracking-wide">EL TALLER</h1>
                <p className="text-xs text-gray-500">Punto de Venta</p>
              </div>
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Selecciona una mesa</p>
            <p className="text-xs text-gray-600">Verde = disponible • Rojo = ocupada</p>
          </div>
        </div>
      </header>

      {/* Filtro de locales */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltroLocal('')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filtroLocal === '' 
                ? 'bg-[#D4B896] text-[#0a0a0a]' 
                : 'bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]'
            }`}
          >
            Todos
          </button>
          {locales.map(local => (
            <button
              key={local.id}
              onClick={() => setFiltroLocal(local.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filtroLocal === local.id 
                  ? 'bg-[#D4B896] text-[#0a0a0a]' 
                  : 'bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]'
              }`}
            >
              📍 {local.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Mesas */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {locales.map(local => {
          const mesasLocal = mesasFiltradas.filter(m => m.local_id === local.id);
          if (mesasLocal.length === 0 && filtroLocal) return null;
          if (mesasLocal.length === 0) return null;

          return (
            <div key={local.id} className="mb-8">
              {!filtroLocal && (
                <h2 className="text-lg font-semibold text-white mb-4">📍 {local.nombre}</h2>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {mesasLocal.map(mesa => (
                  <button
                    key={mesa.id}
                    onClick={() => handleMesaClick(mesa)}
                    disabled={mesa.estado === 'reservada'}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${getEstadoStyles(mesa.estado)} ${
                      mesa.estado !== 'reservada' ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-2xl font-bold text-white block">{mesa.numero}</span>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {mesa.estado === 'disponible' && '✓ Libre'}
                        {mesa.estado === 'ocupada' && '● En uso'}
                        {mesa.estado === 'reservada' && '◐ Reservada'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {mesasFiltradas.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🪑</div>
            <p className="text-gray-400 text-lg">No hay mesas disponibles</p>
            <button
              onClick={() => navigate('/mesas')}
              className="mt-4 px-6 py-3 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg"
            >
              Ir a gestionar mesas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}