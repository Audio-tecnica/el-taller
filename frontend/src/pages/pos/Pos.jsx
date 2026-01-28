import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { mesasService } from "../../services/mesasService";
import { pedidosService } from "../../services/pedidosService";
import { turnosService } from "../../services/turnosService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function POS() {
  const navigate = useNavigate();
  const [mesas, setMesas] = useState([]);
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroLocal, setFiltroLocal] = useState("");
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [localTurno, setLocalTurno] = useState(null);
  const [cargandoTurno, setCargandoTurno] = useState(true);
  
  // ⭐ Obtener rol del usuario (no cambia durante la sesión)
  const userInicial = JSON.parse(localStorage.getItem('user') || '{}');
  const esCajero = userInicial?.rol === 'cajero';

  // ⭐ Obtener turno activo del cajero
  const obtenerTurnoActivo = useCallback(async () => {
    try {
      if (!esCajero) {
        setLocalTurno(null);
        setCargandoTurno(false);
        return;
      }

      try {
        const turno = await turnosService.getMiTurnoActivo();
        setTurnoActivo(turno);
        setLocalTurno(turno.local_id);
        
        // Actualizar localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...user, local_asignado_id: turno.local_id }));
        
        console.log(`✅ Turno encontrado - Local: ${turno.local?.nombre} (${turno.local_id})`);
      } catch {
        toast.error('No tienes un turno abierto. Contacta al administrador.');
        setLocalTurno(null);
        setTurnoActivo(null);
      }
    } catch (error) {
      console.error('Error obteniendo turno:', error);
    } finally {
      setCargandoTurno(false);
    }
  }, [esCajero]);

  // ⭐ Cargar mesas - SIEMPRE filtra por localTurno si es cajero
  const cargarDatos = useCallback(async () => {
    try {
      // ⭐ CLAVE: Si es cajero, SOLO cargar mesas del local del turno
      const localParaCargar = esCajero ? localTurno : null;
      
      console.log(`📦 Cargando mesas para local: ${localParaCargar || 'TODOS'}`);
      
      const mesasData = await mesasService.getMesas(localParaCargar);
      const localesData = await mesasService.getLocales();
      
      setMesas(mesasData);
      setLocales(localesData);
      
      console.log(`📦 Mesas cargadas: ${mesasData.length}`);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [localTurno, esCajero]);

  // Obtener turno al montar
  useEffect(() => {
    obtenerTurnoActivo();
  }, [obtenerTurnoActivo]);

  // Cargar datos cuando el turno esté listo
  useEffect(() => {
    if (!cargandoTurno) {
      // Si es cajero, esperar a que localTurno tenga valor
      if (esCajero && !localTurno) {
        console.log('⏳ Esperando local del turno...');
        return;
      }
      cargarDatos();
    }
  }, [cargarDatos, cargandoTurno, localTurno, esCajero]);

  // Refrescar periódicamente
  useEffect(() => {
    if (cargandoTurno) return;
    if (esCajero && !localTurno) return;
    
    const interval = setInterval(cargarDatos, 7000);
    return () => clearInterval(interval);
  }, [cargarDatos, cargandoTurno, localTurno, esCajero]);

  // Refrescar al volver a la pestaña
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !cargandoTurno) {
        if (!esCajero || (esCajero && localTurno)) {
          cargarDatos();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [cargarDatos, cargandoTurno, localTurno, esCajero]);

  const handleMesaClick = async (mesa) => {
    try {
      if (mesa.estado === "disponible") {
        const pedido = await pedidosService.abrirPedido(mesa.id);
        toast.success("Pedido abierto en " + mesa.numero);
        await cargarDatos();
        navigate("/pos/pedido/" + pedido.id);
      } else if (mesa.estado === "ocupada") {
        try {
          const pedido = await pedidosService.getPedidoMesa(mesa.id);
          navigate("/pos/pedido/" + pedido.id);
        } catch {
          toast.error("No se encontró el pedido. Actualizando...");
          await cargarDatos();
        }
      }
    } catch (error) {
      if (error.response?.data?.pedido_id) {
        navigate("/pos/pedido/" + error.response.data.pedido_id);
      } else {
        toast.error(error.response?.data?.error || "Error al procesar");
        await cargarDatos();
      }
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await cargarDatos();
    toast.success("Actualizado", { duration: 1500 });
  };

  // ⭐ FILTROS SIMPLIFICADOS
  // Para cajeros: NO hay filtro manual, solo ven su local
  // Para admin: pueden filtrar manualmente
  const mesasFiltradas = esCajero 
    ? mesas // Ya vienen filtradas del backend
    : (filtroLocal ? mesas.filter(m => m.local_id === filtroLocal) : mesas);

  // Para cajeros: solo mostrar el local de su turno
  const localesMostrar = esCajero && localTurno
    ? locales.filter(l => l.id === localTurno)
    : locales;

  const mesasPorLocal = localesMostrar
    .map(local => ({
      ...local,
      mesas: mesasFiltradas.filter(m => m.local_id === local.id),
    }))
    .filter(local => local.mesas.length > 0);

  // Estadísticas (solo de las mesas visibles)
  const totalMesas = mesasFiltradas.length;
  const mesasOcupadas = mesasFiltradas.filter(m => m.estado === "ocupada").length;
  const mesasDisponibles = mesasFiltradas.filter(m => m.estado === "disponible").length;

  // ⭐ Pantalla de carga
  if (cargandoTurno || (loading && mesas.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg">
            {cargandoTurno ? 'Verificando turno...' : 'Cargando mesas...'}
          </p>
        </div>
      </div>
    );
  }

  // ⭐ Cajero sin turno
  if (esCajero && !turnoActivo) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#141414] border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Sin Turno Abierto</h2>
          <p className="text-gray-400 mb-6">
            No tienes un turno abierto. Contacta al administrador para que abra un turno en tu nombre.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#c4a886] transition"
            >
              Volver al Dashboard
            </button>
            <button
              onClick={obtenerTurnoActivo}
              className="w-full px-6 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
            >
              🔄 Verificar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#D4B896]/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 hover:opacity-80 transition group"
            >
              <div className="relative">
                <img src={logo} alt="El Taller" className="w-12 h-12 rounded-xl object-contain bg-black ring-2 ring-[#D4B896]/30 group-hover:ring-[#D4B896] transition" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0a]"></div>
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">EL TALLER</h1>
                <p className="text-xs text-[#D4B896]">Punto de Venta</p>
              </div>
            </button>

            {/* ⭐ Badge del local para cajeros */}
            {esCajero && turnoActivo && (
              <div className="hidden md:flex items-center gap-3 bg-[#141414] border border-emerald-500/30 rounded-xl px-4 py-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tu Local</p>
                  <p className="text-sm font-bold text-emerald-500">{turnoActivo.local?.nombre}</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-400">{mesasDisponibles}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Disponibles</p>
              </div>
              <div className="w-px h-8 bg-[#2a2a2a]"></div>
              <div className="text-center">
                <p className="text-2xl font-black text-red-400">{mesasOcupadas}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ocupadas</p>
              </div>
              <div className="w-px h-8 bg-[#2a2a2a]"></div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#D4B896]">{totalMesas}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#D4B896] hover:bg-[#D4B896]/10 transition-all duration-300 group"
            >
              <svg className={"w-5 h-5 text-[#D4B896] group-hover:rotate-180 transition-transform duration-500" + (loading ? " animate-spin" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Stats móvil */}
          <div className="mt-3 grid grid-cols-3 gap-2 md:hidden">
            <div className="bg-[#141414] rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Libres</p>
              <p className="text-xl font-black text-emerald-400">{mesasDisponibles}</p>
            </div>
            <div className="bg-[#141414] rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Ocupadas</p>
              <p className="text-xl font-black text-red-400">{mesasOcupadas}</p>
            </div>
            <div className="bg-[#141414] rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-black text-[#D4B896]">{totalMesas}</p>
            </div>
          </div>

          {/* ⭐ Badge móvil para cajeros */}
          {esCajero && turnoActivo && (
            <div className="mt-2 md:hidden bg-[#141414] border border-emerald-500/30 rounded-lg px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Tu Local</p>
                <p className="text-sm font-bold text-emerald-500">{turnoActivo.local?.nombre}</p>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </header>

      {/* ⭐ Filtros de local - SOLO para administradores */}
      {!esCajero && locales.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFiltroLocal("")}
              className={"px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap " + (!filtroLocal ? "bg-[#D4B896] text-[#0a0a0a]" : "bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]")}
            >
              Todos los locales
            </button>
            {locales.map(local => (
              <button
                key={local.id}
                onClick={() => setFiltroLocal(local.id)}
                className={"px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap " + (filtroLocal === local.id ? "bg-[#D4B896] text-[#0a0a0a]" : "bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]")}
              >
                {local.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mesas */}
      <div className="max-w-7xl mx-auto px-4 pb-8 space-y-8">
        {mesasPorLocal.map(local => (
          <div key={local.id} className="space-y-4">
            {/* Header del local - solo para admin sin filtro */}
            {!esCajero && !filtroLocal && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4B896]/20 to-[#D4B896]/5 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#D4B896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{local.nombre}</h2>
                    <p className="text-xs text-gray-500">
                      <span className="text-emerald-400">{local.mesas.filter(m => m.estado === "disponible").length} libres</span>
                      {local.mesas.filter(m => m.estado === "ocupada").length > 0 && (
                        <span className="text-red-400 ml-2">{local.mesas.filter(m => m.estado === "ocupada").length} ocupadas</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-[#D4B896]/30 to-transparent"></div>
              </div>
            )}

            {/* Grid de mesas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {local.mesas.map(mesa => {
                const esOcupada = mesa.estado === "ocupada";
                const esReservada = mesa.estado === "reservada";
                
                return (
                  <button
                    key={mesa.id}
                    onClick={() => handleMesaClick(mesa)}
                    className={"group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 " +
                      (esOcupada
                        ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20"
                        : esReservada
                          ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/50 hover:border-yellow-400"
                          : "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/50 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20")}
                  >
                    <div className="absolute top-3 right-3">
                      <div className={"w-3 h-3 rounded-full " + (esOcupada ? "bg-red-500" : esReservada ? "bg-yellow-500" : "bg-emerald-500")}>
                        {!esOcupada && !esReservada && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></div>}
                      </div>
                    </div>

                    <div className={"w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-300 " +
                      (esOcupada ? "bg-red-500/20 group-hover:bg-red-500/30" : esReservada ? "bg-yellow-500/20" : "bg-emerald-500/20 group-hover:bg-emerald-500/30")}>
                      {esOcupada ? (
                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      )}
                    </div>

                    <p className="text-white font-bold text-center text-sm leading-tight mb-1">{mesa.numero}</p>
                    <p className={"text-[10px] text-center font-medium uppercase tracking-wider " +
                      (esOcupada ? "text-red-400" : esReservada ? "text-yellow-400" : "text-emerald-400")}>
                      {esOcupada ? "En servicio" : esReservada ? "Reservada" : "Disponible"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {mesasFiltradas.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No hay mesas disponibles</p>
          </div>
        )}
      </div>

      {/* Leyenda móvil */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1a1a1a]/95 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-3 flex justify-around">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-xs text-gray-400">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs text-gray-400">Ocupada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-gray-400">Reservada</span>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && mesas.length > 0 && (
        <div className="fixed bottom-20 md:bottom-4 right-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2 flex items-center gap-2 shadow-xl">
          <div className="w-4 h-4 border-2 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-400">Actualizando...</span>
        </div>
      )}
    </div>
  );
}