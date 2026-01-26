import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mesasService } from '../../services/mesasService';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.jpeg';

export default function Mesas() {
  const navigate = useNavigate();
  const [mesas, setMesas] = useState([]);
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mesaEditar, setMesaEditar] = useState(null);
  const [filtroLocal, setFiltroLocal] = useState('');

  const [formData, setFormData] = useState({
    numero: '',
    local_id: '',
    capacidad: 4
  });

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
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mesaEditar) {
        await mesasService.actualizarMesa(mesaEditar.id, formData);
        toast.success('Mesa actualizada');
      } else {
        await mesasService.crearMesa(formData);
        toast.success('Mesa creada');
      }
      setModalOpen(false);
      resetForm();
      cargarDatos();
    } catch {
      toast.error('Error al guardar mesa');
    }
  };

  const handleEditar = (mesa) => {
    setMesaEditar(mesa);
    setFormData({
      numero: mesa.numero,
      local_id: mesa.local_id,
      capacidad: mesa.capacidad
    });
    setModalOpen(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Eliminar esta mesa?')) {
      try {
        await mesasService.eliminarMesa(id);
        toast.success('Mesa eliminada');
        cargarDatos();
      } catch {
        toast.error('Error al eliminar');
      }
    }
  };

  const resetForm = () => {
    setMesaEditar(null);
    setFormData({
      numero: '',
      local_id: locales[0]?.id || '',
      capacidad: 4
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'disponible': return 'border-emerald-500 bg-emerald-500/10';
      case 'ocupada': return 'border-red-500 bg-red-500/10';
      case 'reservada': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-gray-600';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'disponible': return { texto: 'Disponible', color: 'text-emerald-500' };
      case 'ocupada': return { texto: 'Ocupada', color: 'text-red-500' };
      case 'reservada': return { texto: 'Reservada', color: 'text-yellow-500' };
      default: return { texto: estado, color: 'text-gray-500' };
    }
  };

  const mesasFiltradas = filtroLocal
    ? mesas.filter(m => m.local_id === filtroLocal)
    : mesas;

  const mesasPorLocal = locales.map(local => ({
    ...local,
    mesas: mesasFiltradas.filter(m => m.local_id === local.id)
  }));

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
                <p className="text-xs text-gray-500">Gestión de Mesas</p>
              </div>
            </button>
          </div>
          <button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="px-5 py-2.5 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C4A576] transition"
          >
            + Nueva Mesa
          </button>
        </div>
      </header>

      {/* Filtros */}
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
            Todos los locales
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

      {/* Leyenda */}
      <div className="max-w-7xl mx-auto px-4 pb-2">
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-gray-400">Disponible</span>
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Ocupada</span>
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-400">Reservada</span>
          </span>
        </div>
      </div>

      {/* Mesas por Local */}
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-8">
        {mesasPorLocal.filter(l => l.mesas.length > 0 || !filtroLocal).map(local => (
          <div key={local.id}>
            {!filtroLocal && (
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                📍 {local.nombre}
                <span className="text-sm text-gray-500 font-normal">({local.mesas.length} mesas)</span>
              </h2>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {local.mesas.map(mesa => {
                const estadoInfo = getEstadoTexto(mesa.estado);
                return (
                  <div
                    key={mesa.id}
                    className={`relative bg-[#141414] rounded-xl p-4 border-2 ${getEstadoColor(mesa.estado)} transition-all hover:scale-105 cursor-pointer group`}
                    onClick={() => handleEditar(mesa)}
                  >
                    {/* Número de mesa grande */}
                    <div className="text-center">
                      <span className="text-3xl font-bold text-white">{mesa.numero}</span>
                      <p className={`text-xs font-medium mt-1 ${estadoInfo.color}`}>
                        {estadoInfo.texto}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        👥 {mesa.capacidad} personas
                      </p>
                    </div>

                    {/* Botón eliminar (aparece en hover) */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEliminar(mesa.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500/40"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {local.mesas.length === 0 && (
              <div className="text-center py-8 bg-[#141414] rounded-xl border border-[#2a2a2a]">
                <p className="text-gray-500">No hay mesas en este local</p>
              </div>
            )}
          </div>
        ))}

        {mesas.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🪑</div>
            <p className="text-gray-400 text-lg mb-2">No hay mesas creadas</p>
            <p className="text-gray-600 text-sm mb-6">Agrega mesas para empezar a tomar pedidos</p>
            <button
              onClick={() => { resetForm(); setModalOpen(true); }}
              className="px-6 py-3 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C4A576] transition"
            >
              Crear primera mesa
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-xl font-bold text-white">
                {mesaEditar ? 'Editar Mesa' : 'Nueva Mesa'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Número/Nombre de Mesa</label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({...formData, numero: e.target.value})}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896] focus:border-transparent"
                  placeholder="Ej: 1, 2, Barra, VIP..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Local</label>
                <select
                  value={formData.local_id}
                  onChange={(e) => setFormData({...formData, local_id: e.target.value})}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                  required
                >
                  <option value="">Seleccionar local</option>
                  {locales.map(local => (
                    <option key={local.id} value={local.id}>{local.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Capacidad (personas)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({...formData, capacidad: parseInt(e.target.value) || 1})}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                />
              </div>

              {mesaEditar && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Estado</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['disponible', 'ocupada', 'reservada'].map(estado => (
                      <button
                        key={estado}
                        type="button"
                        onClick={() => setFormData({...formData, estado})}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                          formData.estado === estado || (mesaEditar.estado === estado && !formData.estado)
                            ? estado === 'disponible' ? 'bg-emerald-500 text-white' 
                              : estado === 'ocupada' ? 'bg-red-500 text-white'
                              : 'bg-yellow-500 text-black'
                            : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
                        }`}
                      >
                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C4A576] transition"
                >
                  {mesaEditar ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}