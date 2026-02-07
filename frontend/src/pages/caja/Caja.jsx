import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { turnosService } from "../../services/turnosService";
import { mesasService } from "../../services/mesasService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function Caja() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [locales, setLocales] = useState([]);
  const [localSeleccionado, setLocalSeleccionado] = useState("");
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalCerrar, setModalCerrar] = useState(false);
  const [efectivoInicial, setEfectivoInicial] = useState("");
  const [efectivoReal, setEfectivoReal] = useState("");
  const [notasCierre, setNotasCierre] = useState("");
  const [historial, setHistorial] = useState([]);
  const [verHistorial, setVerHistorial] = useState(false);
  const [cajeros, setCajeros] = useState([]);
  const [cajeroSeleccionado, setCajeroSeleccionado] = useState("");

  // Estados para manejar turnos de ambos locales
  const [turnosLocales, setTurnosLocales] = useState({});
  const [cajerosLocales, setCajerosLocales] = useState({});

  useEffect(() => {
    cargarLocales();
  }, []);

  useEffect(() => {
    if (locales.length > 0) {
      // Cargar turnos y cajeros para todos los locales
      locales.forEach(local => {
        cargarTurnoLocal(local.id);
        cargarCajerosLocal(local.id);
      });
    }
  }, [locales]);

  useEffect(() => {
    if (localSeleccionado) {
      cargarTurno();
      cargarCajeros();
    }
  }, [localSeleccionado]);

  useEffect(() => {
    if (user && cajeros.length === 0 && localSeleccionado) {
      console.log('👤 Usuario detectado del contexto, recargando cajeros...');
      cargarCajeros();
    }
  }, [user, localSeleccionado]);

  const cargarLocales = async () => {
    try {
      const data = await mesasService.getLocales();
      setLocales(data);
      if (data.length > 0) {
        setLocalSeleccionado(data[0].id);
      }
    } catch {
      toast.error("Error al cargar locales");
    } finally {
      setLoading(false);
    }
  };

  const cargarTurno = async () => {
    try {
      const turno = await turnosService.getTurnoActivo(localSeleccionado);
      setTurnoActivo(turno);
    } catch {
      setTurnoActivo(null);
    }
  };

  const cargarTurnoLocal = async (localId) => {
    try {
      const turno = await turnosService.getTurnoActivo(localId);
      setTurnosLocales(prev => ({ ...prev, [localId]: turno }));
    } catch {
      setTurnosLocales(prev => ({ ...prev, [localId]: null }));
    }
  };

  const cargarCajeros = async () => {
    console.log('🔄 ===== INICIANDO CARGA DE CAJEROS =====');
    try {
      console.log(`📡 Haciendo fetch a: ${import.meta.env.VITE_API_URL}/auth/cajeros?local_id=${localSeleccionado}`);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/cajeros?local_id=${localSeleccionado}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const usuariosData = await response.json();
      console.log('📋 Usuarios del backend:', usuariosData);
      console.log('📊 Cantidad de usuarios:', usuariosData.length);
      
      setCajeros(usuariosData);
      console.log('✅ setCajeros ejecutado con', usuariosData.length, 'usuarios');
      
      if (user && usuariosData.length === 1 && usuariosData[0].id === user.id) {
        setCajeroSeleccionado(user.id);
        console.log('🎯 Usuario auto-seleccionado');
      }
      
      console.log('✅ ===== CARGA DE CAJEROS COMPLETADA =====');
      
    } catch (error) {
      console.error('❌ ===== ERROR EN CARGA DE CAJEROS =====');
      console.error('Error completo:', error);
      toast.error("Error al cargar usuarios: " + error.message);
      setCajeros([]);
    }
  };

  const cargarCajerosLocal = async (localId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/cajeros?local_id=${localId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const usuariosData = await response.json();
      setCajerosLocales(prev => ({ ...prev, [localId]: usuariosData }));
      
    } catch (error) {
      console.error('Error al cargar cajeros del local:', localId, error);
      setCajerosLocales(prev => ({ ...prev, [localId]: [] }));
    }
  };

  const cargarHistorial = async () => {
    try {
      const data = await turnosService.getHistorial(localSeleccionado);
      setHistorial(data);
      setVerHistorial(true);
    } catch {
      toast.error("Error al cargar historial");
    }
  };

  const handleOpenModalAbrir = (localId) => {
    console.log('🔓 ===== ABRIENDO MODAL ABRIR TURNO =====');
    setLocalSeleccionado(localId);
    
    const cajerosLocal = cajerosLocales[localId] || [];
    console.log('📊 Cajeros disponibles:', cajerosLocal);
    console.log('📊 Cantidad de cajeros:', cajerosLocal.length);
    
    if (cajerosLocal.length === 0) {
      console.warn('⚠️ ¡ADVERTENCIA! No hay cajeros en la lista');
      console.warn('Usuario del contexto:', user);
    }
    
    setCajeros(cajerosLocal);
    setModalAbrir(true);
    console.log('✅ Modal abierto');
  };

  const handleAbrirTurno = async () => {
    if (!cajeroSeleccionado) {
      toast.error("Selecciona un cajero");
      return;
    }

    console.log('💰 Abriendo turno para cajero:', cajeroSeleccionado);

    try {
      await turnosService.abrirTurno(
        localSeleccionado,
        parseFloat(efectivoInicial) || 0,
        cajeroSeleccionado,
      );
      toast.success("Turno abierto");
      setModalAbrir(false);
      setEfectivoInicial("");
      setCajeroSeleccionado("");
      cargarTurnoLocal(localSeleccionado);
      cargarTurno();
    } catch (error) {
      console.error('❌ Error al abrir turno:', error);
      toast.error(error.response?.data?.error || "Error al abrir turno");
    }
  };

  const handleOpenModalCerrar = (localId) => {
    setLocalSeleccionado(localId);
    setTurnoActivo(turnosLocales[localId]);
    setModalCerrar(true);
  };

  const handleCerrarTurno = async () => {
    if (!efectivoReal) {
      toast.error("Ingresa el efectivo en caja");
      return;
    }
    try {
      await turnosService.cerrarTurno(
        turnoActivo.id,
        parseFloat(efectivoReal),
        notasCierre,
      );
      toast.success("Turno cerrado");
      setModalCerrar(false);
      setEfectivoReal("");
      setNotasCierre("");
      setTurnoActivo(null);
      cargarTurnoLocal(localSeleccionado);
    } catch {
      toast.error("Error al cerrar turno");
    }
  };

  const formatMoney = (value) => {
    return "$" + Number(value || 0).toLocaleString();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

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
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-3 hover:opacity-80 transition"
          >
            <img
              src={logo}
              alt="El Taller"
              className="w-12 h-12 rounded-full object-contain bg-black"
            />
            <div>
              <h1 className="text-lg font-bold text-[#D4B896] tracking-wide">
                EL TALLER
              </h1>
              <p className="text-xs text-gray-500">Caja y Turnos</p>
            </div>
          </button>

          {/* Botones de navegación a locales (opcional) */}
          <div className="flex gap-3">
            {locales.map((local, index) => (
              <button
                key={local.id}
                onClick={() => {
                  const element = document.getElementById(`local-${local.id}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  index === 0
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                }`}
              >
                {index === 0 ? '🏪' : '🏬'} {local.nombre}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Container Principal - Dos Columnas */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {locales.map((local, index) => {
            const turnoLocal = turnosLocales[local.id];
            const colorScheme = index === 0 
              ? { 
                  bg: 'bg-purple-500/10', 
                  border: 'border-purple-500/30',
                  text: 'text-purple-300',
                  button: 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
                  icon: '🏪'
                }
              : { 
                  bg: 'bg-amber-500/10', 
                  border: 'border-amber-500/30',
                  text: 'text-amber-300',
                  button: 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30',
                  icon: '🏬'
                };

            return (
              <div 
                key={local.id} 
                id={`local-${local.id}`}
                className={`border-2 rounded-2xl ${colorScheme.border} ${colorScheme.bg} overflow-hidden`}
              >
                {/* Header del Local */}
                <div className={`p-4 border-b-2 ${colorScheme.border}`}>
                  <h2 className={`text-xl font-bold flex items-center gap-3 ${colorScheme.text}`}>
                    <span className="text-3xl">{colorScheme.icon}</span>
                    {local.nombre.toUpperCase()}
                  </h2>
                </div>

                {/* Contenido del Local */}
                <div className="p-6">
                  {turnoLocal ? (
                    // Turno Activo
                    <div className="space-y-4">
                      {/* Estado y Acciones */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-emerald-500 font-medium text-sm">
                              Turno Abierto
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs">
                            {formatDate(turnoLocal.fecha_apertura)}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Por: {turnoLocal.usuario?.nombre}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenModalCerrar(local.id)}
                          className="px-3 py-1.5 text-sm bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition border border-red-500/30"
                        >
                          Cerrar Turno
                        </button>
                      </div>

                      {/* Resumen Compacto */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#1a1a1a] rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Ventas</p>
                          <p className="text-lg font-bold text-[#D4B896]">
                            {formatMoney(turnoLocal.resumen?.total_ventas)}
                          </p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Pedidos</p>
                          <p className="text-lg font-bold text-white">
                            {turnoLocal.resumen?.cantidad_pedidos || 0}
                          </p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Cortesías</p>
                          <p className="text-lg font-bold text-orange-500">
                            {formatMoney(turnoLocal.resumen?.total_cortesias)}
                          </p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Efectivo Esp.</p>
                          <p className="text-lg font-bold text-emerald-500">
                            {formatMoney(turnoLocal.resumen?.efectivo_esperado)}
                          </p>
                        </div>
                      </div>

                      {/* Métodos de Pago */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#1a1a1a] rounded-lg p-2 text-center">
                          <p className="text-lg mb-0.5">💵</p>
                          <p className="text-gray-500 text-xs">Efectivo</p>
                          <p className="text-sm font-bold text-white">
                            {formatMoney(turnoLocal.resumen?.total_efectivo)}
                          </p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-2 text-center">
                          <p className="text-lg mb-0.5">🏦</p>
                          <p className="text-gray-500 text-xs">Transfer.</p>
                          <p className="text-sm font-bold text-white">
                            {formatMoney(turnoLocal.resumen?.total_transferencias)}
                          </p>
                        </div>
                        <div className="bg-[#1a1a1a] rounded-lg p-2 text-center">
                          <p className="text-lg mb-0.5">📱</p>
                          <p className="text-gray-500 text-xs">Nequi</p>
                          <p className="text-sm font-bold text-white">
                            {formatMoney(turnoLocal.resumen?.total_nequi)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Sin Turno
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">💰</div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        No hay turno abierto
                      </h3>
                      <p className="text-gray-500 text-sm mb-6">
                        Abre un turno para comenzar a registrar ventas
                      </p>
                      <button
                        onClick={() => handleOpenModalAbrir(local.id)}
                        className={`px-6 py-2.5 font-semibold rounded-lg transition border ${colorScheme.button}`}
                      >
                        Abrir Turno
                      </button>
                    </div>
                  )}

                  {/* Botón Ver Historial */}
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setLocalSeleccionado(local.id);
                        cargarHistorial();
                      }}
                      className="w-full py-2 text-sm bg-[#141414] text-gray-400 rounded-lg hover:bg-[#1a1a1a] transition border border-[#2a2a2a]"
                    >
                      📋 Ver Historial de Turnos
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Historial (se muestra abajo de todo) */}
        {verHistorial && (
          <div className="mt-6 bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#2a2a2a] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                Historial de Turnos - {locales.find(l => l.id === localSeleccionado)?.nombre}
              </h3>
              <button
                onClick={() => setVerHistorial(false)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {historial.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay turnos anteriores
                </p>
              ) : (
                historial.map((turno) => (
                  <div
                    key={turno.id}
                    className="p-4 border-b border-[#2a2a2a] last:border-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">
                          {turno.local?.nombre}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {formatDate(turno.fecha_apertura)}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Por: {turno.usuario?.nombre}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#D4B896] font-bold">
                          {formatMoney(turno.total_ventas)}
                        </p>
                        <p
                          className={`text-sm ${turno.diferencia >= 0 ? "text-emerald-500" : "text-red-500"}`}
                        >
                          Dif: {formatMoney(turno.diferencia)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Abrir Turno */}
      {modalAbrir && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-xl font-bold text-white">Abrir Turno</h2>
              <p className="text-gray-500">
                {locales.find((l) => l.id === localSeleccionado)?.nombre}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Selector de Cajero */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Cajero {cajeros.length > 0 && `(${cajeros.length} disponible${cajeros.length > 1 ? 's' : ''})`}
                </label>
                <select
                  value={cajeroSeleccionado}
                  onChange={(e) => {
                    console.log('📌 Cajero seleccionado:', e.target.value);
                    setCajeroSeleccionado(e.target.value);
                  }}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
                  required
                >
                  <option value="">Seleccionar cajero...</option>
                  {cajeros.map((cajero) => {
                    const esAdmin = cajero.rol === 'administrador';
                    const esYo = cajero.id === user?.id;
                    
                    let nombreDisplay = cajero.nombre;
                    if (esYo) {
                      nombreDisplay = `${cajero.nombre} (Yo${esAdmin ? ' - Admin' : ''})`;
                    } else if (esAdmin) {
                      nombreDisplay = `${cajero.nombre} (Admin)`;
                    }
                    
                    return (
                      <option 
                        key={cajero.id} 
                        value={cajero.id}
                        className={esAdmin ? "font-semibold" : ""}
                      >
                        {nombreDisplay}
                      </option>
                    );
                  })}
                </select>
                
                {/* Mensajes de ayuda */}
                {cajeros.length === 0 && (
                  <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-xs text-red-400 font-semibold mb-1">
                      ⚠️ No hay usuarios disponibles
                    </p>
                    <p className="text-xs text-red-300">
                      Por favor, cierra sesión y vuelve a iniciar sesión, luego intenta de nuevo.
                    </p>
                  </div>
                )}
                {cajeros.length === 1 && (
                  <p className="text-xs text-[#D4B896] mt-2 bg-[#D4B896]/10 p-2 rounded">
                    💡 Eres el único usuario autorizado para abrir turno en este local
                  </p>
                )}
                {cajeros.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {cajeros.filter(c => c.rol === 'administrador').length > 0 
                      ? 'Los administradores pueden abrir turno en cualquier local'
                      : 'Selecciona quién operará este turno'
                    }
                  </p>
                )}
              </div>

              {/* Efectivo Inicial */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Efectivo inicial en caja
                </label>
                <input
                  type="number"
                  value={efectivoInicial}
                  onChange={(e) => setEfectivoInicial(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-xl focus:ring-2 focus:ring-[#D4B896]"
                  placeholder="0"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setModalAbrir(false);
                    setCajeroSeleccionado("");
                    setEfectivoInicial("");
                  }}
                  className="flex-1 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] hover:bg-[#2a2a2a]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAbrirTurno}
                  disabled={!cajeroSeleccionado}
                  className={`flex-1 py-3 font-semibold rounded-lg transition ${
                    cajeroSeleccionado 
                      ? 'bg-[#D4B896] text-[#0a0a0a] hover:bg-[#C4A576]' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Abrir Turno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar Turno */}
      {modalCerrar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-xl font-bold text-white">Cerrar Turno</h2>
              <p className="text-gray-500">Arqueo de caja</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-[#1a1a1a] rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Efectivo esperado</span>
                  <span className="text-white font-bold">
                    {formatMoney(turnoActivo?.resumen?.efectivo_esperado)}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  (Inicial: {formatMoney(turnoActivo?.efectivo_inicial)} +
                  Ventas efectivo:{" "}
                  {formatMoney(turnoActivo?.resumen?.total_efectivo)})
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Total recaudado
                </label>
                <input
                  type="number"
                  value={efectivoReal}
                  onChange={(e) => setEfectivoReal(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-xl focus:ring-2 focus:ring-[#D4B896]"
                  placeholder="ingresar total recaudado..."
                />
              </div>

              {efectivoReal && (
                <div
                  className={`p-4 rounded-xl ${parseFloat(efectivoReal) - (turnoActivo?.resumen?.efectivo_esperado || 0) >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"}`}
                >
                  <p className="text-sm text-gray-400">Diferencia</p>
                  <p
                    className={`text-2xl font-bold ${parseFloat(efectivoReal) - (turnoActivo?.resumen?.efectivo_esperado || 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {formatMoney(
                      parseFloat(efectivoReal) -
                        (turnoActivo?.resumen?.efectivo_esperado || 0),
                    )}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notasCierre}
                  onChange={(e) => setNotasCierre(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white resize-none"
                  rows="2"
                  placeholder="Observaciones..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setModalCerrar(false)}
                  className="flex-1 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCerrarTurno}
                  className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-lg"
                >
                  Cerrar Turno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}