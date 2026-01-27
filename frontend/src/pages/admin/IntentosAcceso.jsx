import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function IntentosAcceso() {
  const navigate = useNavigate();
  const [intentos, setIntentos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [soloBloqueados, setSoloBloqueados] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [soloBloqueados]);

  const cargarDatos = async () => {
    try {
      setActualizando(true);
      const [intentosRes, statsRes] = await Promise.all([
        api.get(`/auth/intentos-acceso?solo_bloqueados=${soloBloqueados}`),
        api.get('/auth/estadisticas-intentos')
      ]);
      
      setIntentos(intentosRes.data);
      setEstadisticas(statsRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar intentos de acceso');
    } finally {
      setLoading(false);
      setActualizando(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">🔐 Intentos de Acceso</h1>
            <p className="text-gray-500 mt-1">Historial de inicios de sesión y seguridad</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={cargarDatos}
              disabled={actualizando}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#2a2a2a] transition disabled:opacity-50"
            >
              {actualizando ? '⟳ Actualizando...' : '🔄 Actualizar'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#2a2a2a] transition"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Total Hoy</p>
                  <p className="text-3xl font-bold text-white">{estadisticas.hoy.total}</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>
            
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 hover:border-emerald-500/30 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Exitosos</p>
                  <p className="text-3xl font-bold text-emerald-500">{estadisticas.hoy.exitosos}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>
            
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 hover:border-red-500/30 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Bloqueados</p>
                  <p className="text-3xl font-bold text-red-500">{estadisticas.hoy.bloqueados}</p>
                </div>
                <div className="text-4xl">🚫</div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={() => setSoloBloqueados(!soloBloqueados)}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
              soloBloqueados
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]'
            }`}
          >
            {soloBloqueados ? '🚫 Solo Bloqueados' : '📋 Todos los Intentos'}
          </button>
          
          <div className="text-sm text-gray-500">
            Mostrando {intentos.length} registros
          </div>
        </div>

        {/* Tabla de Intentos */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
          {intentos.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">
                {soloBloqueados ? 'No hay intentos bloqueados' : 'No hay intentos de acceso'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">Fecha y Hora</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Usuario</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Motivo</th>
                    <th className="text-left p-4 text-gray-400 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {intentos.map((intento, index) => (
                    <tr 
                      key={intento.id} 
                      className={`border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition ${
                        !intento.exitoso ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="p-4 text-white text-sm font-mono">
                        {formatearFecha(intento.fecha_intento)}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">
                            {intento.usuario?.nombre || 'Desconocido'}
                          </p>
                          {intento.usuario?.rol && (
                            <p className="text-xs text-gray-500 capitalize">
                              {intento.usuario.rol}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-400 text-sm font-mono">
                        {intento.email}
                      </td>
                      <td className="p-4">
                        {intento.exitoso ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Exitoso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Bloqueado
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {intento.motivo_rechazo ? (
                          <span className="text-gray-400 text-sm">
                            {intento.motivo_rechazo}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 text-xs font-mono">
                        {intento.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Nota informativa */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="text-sm text-blue-400">
              <p className="font-medium mb-1">Acerca del sistema de control de acceso</p>
              <p className="text-blue-300/80">
                Los cajeros solo pueden iniciar sesión cuando tienen un turno abierto. 
                Todos los intentos de acceso quedan registrados para auditoría y seguridad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
