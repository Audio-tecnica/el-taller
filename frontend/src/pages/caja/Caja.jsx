import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // ⭐ NUEVO: Usar contexto
import { turnosService } from "../../services/turnosService";
import { mesasService } from "../../services/mesasService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function Caja() {
  const navigate = useNavigate();
  const { user } = useAuth(); // ⭐ NUEVO: Obtener usuario del contexto
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

  useEffect(() => {
    cargarLocales();
  }, []);

  useEffect(() => {
    if (localSeleccionado) {
      cargarTurno();
      cargarCajeros();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSeleccionado]);

  // ⭐ NUEVO: Efecto para auto-seleccionar cajero si el user está disponible
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

  // ⭐ SIMPLIFICADO: El backend ahora incluye administradores automáticamente
  const cargarCajeros = async () => {
    console.log('🔄 ===== INICIANDO CARGA DE CAJEROS =====');
    try {
      // Cargar usuarios disponibles del backend (incluye cajeros + administradores)
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
      
      // El backend ya incluye administradores, simplemente usar los datos
      setCajeros(usuariosData);
      console.log('✅ setCajeros ejecutado con', usuariosData.length, 'usuarios');
      
      // Auto-seleccionar si hay usuario en contexto y es el único disponible
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

  const cargarHistorial = async () => {
    try {
      const data = await turnosService.getHistorial(localSeleccionado);
      setHistorial(data);
      setVerHistorial(true);
    } catch {
      toast.error("Error al cargar historial");
    }
  };

  const handleOpenModalAbrir = () => {
    console.log('🔓 ===== ABRIENDO MODAL ABRIR TURNO =====');
    console.log('📊 Cajeros disponibles:', cajeros);
    console.log('📊 Cantidad de cajeros:', cajeros.length);
    console.log('📊 Cajero seleccionado actual:', cajeroSeleccionado);
    
    if (cajeros.length === 0) {
      console.warn('⚠️ ¡ADVERTENCIA! No hay cajeros en la lista');
      console.warn('Usuario del contexto:', user);
      console.warn('Usuario de localStorage:', localStorage.getItem('user'));
    }
    
    cajeros.forEach((cajero, index) => {
      console.log(`  ${index + 1}. ID: ${cajero.id} | Nombre: ${cajero.nombre} | Admin: ${cajero.esAdmin || false}`);
    });
    
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
      cargarTurno();
    } catch (error) {
      console.error('❌ Error al abrir turno:', error);
      toast.error(error.response?.data?.error || "Error al abrir turno");
    }
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
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
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
          </div>

          {/* Selector de local */}
          <select
            value={localSeleccionado}
            onChange={(e) => setLocalSeleccionado(e.target.value)}
            className="px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white"
          >
            {locales.map((local) => (
              <option key={local.id} value={local.id}>
                {local.nombre}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Estado del turno */}
        {turnoActivo ? (
          <div className="space-y-6">
            {/* Turno activo */}
            <div className="bg-[#141414] border border-emerald-500/30 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-500 font-medium">
                      Turno Abierto
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Abierto: {formatDate(turnoActivo.fecha_apertura)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Por: {turnoActivo.usuario?.nombre}
                  </p>
                </div>
                <button
                  onClick={() => setModalCerrar(true)}
                  className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition border border-red-500/30"
                >
                  Cerrar Turno
                </button>
              </div>

              {/* Resumen de ventas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Ventas Totales</p>
                  <p className="text-2xl font-bold text-[#D4B896]">
                    {formatMoney(turnoActivo.resumen?.total_ventas)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Pedidos</p>
                  <p className="text-2xl font-bold text-white">
                    {turnoActivo.resumen?.cantidad_pedidos || 0}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Cortesías</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {formatMoney(turnoActivo.resumen?.total_cortesias)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Efectivo Esperado</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {formatMoney(turnoActivo.resumen?.efectivo_esperado)}
                  </p>
                </div>
              </div>

              {/* Desglose por método */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1">💵</p>
                  <p className="text-gray-500 text-sm">Efectivo</p>
                  <p className="text-lg font-bold text-white">
                    {formatMoney(turnoActivo.resumen?.total_efectivo)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1">🏦</p>
                  <p className="text-gray-500 text-sm">Transferencias</p>
                  <p className="text-lg font-bold text-white">
                    {formatMoney(turnoActivo.resumen?.total_transferencias)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
                  <p className="text-2xl mb-1">📱</p>
                  <p className="text-gray-500 text-sm">Nequi</p>
                  <p className="text-lg font-bold text-white">
                    {formatMoney(turnoActivo.resumen?.total_nequi)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sin turno activo */
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-xl font-bold text-white mb-2">
              No hay turno abierto
            </h2>
            <p className="text-gray-500 mb-6">
              Abre un turno para comenzar a registrar ventas
            </p>
            <button
              onClick={handleOpenModalAbrir}
              className="px-6 py-3 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C4A576] transition"
            >
              Abrir Turno
            </button>
          </div>
        )}

        {/* Botón historial */}
        <div className="mt-6">
          <button
            onClick={cargarHistorial}
            className="w-full py-3 bg-[#141414] text-gray-400 rounded-xl hover:bg-[#1a1a1a] transition border border-[#2a2a2a]"
          >
            📋 Ver Historial de Turnos
          </button>
        </div>

        {/* Historial */}
        {verHistorial && (
          <div className="mt-6 bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#2a2a2a] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                Historial de Turnos
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
                  Efectivo real en caja
                </label>
                <input
                  type="number"
                  value={efectivoReal}
                  onChange={(e) => setEfectivoReal(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-xl focus:ring-2 focus:ring-[#D4B896]"
                  placeholder="Contar efectivo..."
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