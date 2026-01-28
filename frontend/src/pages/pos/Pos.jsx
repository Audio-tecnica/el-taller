import { useState, useEffect } from "react";
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
  const [localDelTurno, setLocalDelTurno] = useState(null);
  const [inicializado, setInicializado] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false); // ⭐ Nuevo estado

  // ⭐ FUNCIÓN SIMPLE para cargar mesas (recibe el local directamente)
  const cargarMesas = async (localId) => {
    try {
      console.log(`📦 Cargando mesas para local: ${localId || 'TODOS'}`);
      const [mesasData, localesData] = await Promise.all([
        mesasService.getMesas(localId),
        mesasService.getLocales()
      ]);
      setMesas(mesasData);
      setLocales(localesData);
      console.log(`✅ Mesas cargadas: ${mesasData.length}`);
    } catch (err) {
      console.error('Error cargando mesas:', err);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ EFECTO PRINCIPAL: Detectar si tiene turno (cajero) o no (admin)
  useEffect(() => {
    const inicializar = async () => {
      try {
        console.log('🔍 Verificando si el usuario tiene un turno activo...');
        
        // Intentar obtener turno activo
        const turno = await turnosService.getMiTurnoActivo();
        
        // ⭐ TIENE TURNO = ES CAJERO con local asignado
        const localId = turno.local?.id || turno.local_id || turno.localId;
        
        console.log('✅ USUARIO CON TURNO ACTIVO (Cajero)', {
          local: turno.local?.nombre,
          localId: localId
        });
        
        if (!localId) {
          console.error('❌ Turno sin local_id');
          throw new Error('Turno sin local_id');
        }
        
        setTurnoActivo(turno);
        setLocalDelTurno(localId);
        setEsAdmin(false); // ⭐ No es admin
        
        // Cargar SOLO mesas de su local
        await cargarMesas(localId);
        
      } catch {
        // ⭐ NO TIENE TURNO = ES ADMIN
        console.log('ℹ️ Usuario sin turno activo = ADMIN con acceso total');
        
        setTurnoActivo(null);
        setLocalDelTurno(null);
        setEsAdmin(true); // ⭐ Es admin
        
        // Cargar TODAS las mesas
        await cargarMesas(null);
      }
      
      setInicializado(true);
    };

    inicializar();
  }, []); // ⭐ Solo ejecutar una vez al montar

  // Refrescar periódicamente
  useEffect(() => {
    if (!inicializado) return;
    
    // Determinar qué local cargar
    const localACargar = esAdmin ? null : localDelTurno;
    
    if (!esAdmin && !localDelTurno) {
      console.log('⏸️ Refresh pausado - cajero sin localDelTurno');
      return;
    }

    console.log(`🔄 Iniciando refresh automático`, {
      esAdmin,
      localDelTurno,
      localACargar: localACargar || 'TODOS'
    });

    const interval = setInterval(() => {
      console.log(`⏰ Tick refresh - local: ${localACargar || 'TODOS'}`);
      cargarMesas(localACargar);
    }, 7000);

    return () => {
      console.log(`🛑 Limpiando interval`);
      clearInterval(interval);
    };
  }, [inicializado, esAdmin, localDelTurno]);

  // Refrescar al volver a la pestaña
  useEffect(() => {
    if (!inicializado) return;
    
    const localACargar = esAdmin ? null : localDelTurno;
    
    if (!esAdmin && !localDelTurno) {
      console.log('⏸️ Visibility listener pausado - cajero sin localDelTurno');
      return;
    }

    console.log(`👁️ Configurando visibility listener`, {
      esAdmin,
      localACargar: localACargar || 'TODOS'
    });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        console.log(`👁️ Pestaña visible - refrescando: ${localACargar || 'TODOS'}`);
        cargarMesas(localACargar);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      console.log(`🛑 Limpiando visibility listener`);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [inicializado, esAdmin, localDelTurno]);

  const handleMesaClick = async (mesa) => {
    const localACargar = esAdmin ? null : localDelTurno;
    
    try {
      if (mesa.estado === "disponible") {
        const pedido = await pedidosService.abrirPedido(mesa.id);
        toast.success("Pedido abierto en " + mesa.numero);
        await cargarMesas(localACargar);
        navigate("/pos/pedido/" + pedido.id);
      } else if (mesa.estado === "ocupada") {
        try {
          const pedido = await pedidosService.getPedidoMesa(mesa.id);
          navigate("/pos/pedido/" + pedido.id);
        } catch {
          toast.error("No se encontró el pedido");
          await cargarMesas(localACargar);
        }
      }
    } catch (error) {
      if (error.response?.data?.pedido_id) {
        navigate("/pos/pedido/" + error.response.data.pedido_id);
      } else {
        toast.error(error.response?.data?.error || "Error al procesar");
        await cargarMesas(localACargar);
      }
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    const localACargar = esAdmin ? null : localDelTurno;
    await cargarMesas(localACargar);
    toast.success("Actualizado", { duration: 1500 });
  };

  // Filtrar mesas (cajero ya viene filtrado del backend)
  const mesasMostrar = esAdmin 
    ? (filtroLocal ? mesas.filter(m => m.local_id === filtroLocal) : mesas)
    : mesas; // Cajero: ya vienen filtradas del backend

  // Locales a mostrar (cajero solo ve su local)
  const localesMostrar = !esAdmin && localDelTurno
    ? locales.filter(l => l.id === localDelTurno)
    : locales;

  const mesasPorLocal = localesMostrar
    .map(local => ({
      ...local,
      mesas: mesasMostrar.filter(m => m.local_id === local.id),
    }))
    .filter(local => local.mesas.length > 0);

  // Stats
  const totalMesas = mesasMostrar.length;
  const mesasOcupadas = mesasMostrar.filter(m => m.estado === "ocupada").length;
  const mesasDisponibles = mesasMostrar.filter(m => m.estado === "disponible").length;

  // ⭐ LOADING
  if (!inicializado || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg">
            {inicializado ? 'Cargando mesas...' : 'Verificando acceso...'}
          </p>
        </div>
      </div>
    );
  }

  // ⭐ CAJERO SIN TURNO
  if (!esAdmin && !turnoActivo) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#141414] border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Sin Turno Abierto</h2>
          <p className="text-gray-400 mb-6">
            No tienes un turno abierto. Contacta al administrador.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg"
          >
            Volver al Dashboard
          </button>
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
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-3 hover:opacity-80 transition group">
              <div className="relative">
                <img src={logo} alt="El Taller" className="w-12 h-12 rounded-xl object-contain bg-black ring-2 ring-[#D4B896]/30" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0a]"></div>
              </div>
              <div>
                <h1 className="text-xl font-black text-white">EL TALLER</h1>
                <p className="text-xs text-[#D4B896]">Punto de Venta</p>
              </div>
            </button>

            {/* Badge local cajero */}
            {!esAdmin && turnoActivo && (
              <div className="hidden md:flex items-center gap-3 bg-[#141414] border border-emerald-500/30 rounded-xl px-4 py-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Tu Local</p>
                  <p className="text-sm font-bold text-emerald-500">{turnoActivo.local?.nombre}</p>
                </div>
              </div>
            )}

            {/* Stats desktop */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-400">{mesasDisponibles}</p>
                <p className="text-[10px] text-gray-500 uppercase">Disponibles</p>
              </div>
              <div className="w-px h-8 bg-[#2a2a2a]"></div>
              <div className="text-center">
                <p className="text-2xl font-black text-red-400">{mesasOcupadas}</p>
                <p className="text-[10px] text-gray-500 uppercase">Ocupadas</p>
              </div>
              <div className="w-px h-8 bg-[#2a2a2a]"></div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#D4B896]">{totalMesas}</p>
                <p className="text-[10px] text-gray-500 uppercase">Total</p>
              </div>
            </div>

            <button onClick={handleRefresh} disabled={loading} className="p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#D4B896]">
              <svg className={"w-5 h-5 text-[#D4B896]" + (loading ? " animate-spin" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Badge móvil cajero */}
          {!esAdmin && turnoActivo && (
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

      {/* ⭐ FILTROS - SOLO ADMIN */}
      {esAdmin && locales.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFiltroLocal("")}
              className={"px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap " + (!filtroLocal ? "bg-[#D4B896] text-[#0a0a0a]" : "bg-[#1a1a1a] text-gray-400")}
            >
              Todos
            </button>
            {locales.map(local => (
              <button
                key={local.id}
                onClick={() => setFiltroLocal(local.id)}
                className={"px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap " + (filtroLocal === local.id ? "bg-[#D4B896] text-[#0a0a0a]" : "bg-[#1a1a1a] text-gray-400")}
              >
                {local.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MESAS */}
      <div className="max-w-7xl mx-auto px-4 pb-8 space-y-8">
        {mesasPorLocal.map(local => (
          <div key={local.id} className="space-y-4">
            {esAdmin && !filtroLocal && (
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-white">{local.nombre}</h2>
                <div className="flex-1 h-px bg-[#D4B896]/30"></div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {local.mesas.map(mesa => {
                const esOcupada = mesa.estado === "ocupada";
                return (
                  <button
                    key={mesa.id}
                    onClick={() => handleMesaClick(mesa)}
                    className={"group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 " +
                      (esOcupada
                        ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/50"
                        : "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/50")}
                  >
                    <div className="absolute top-3 right-3">
                      <div className={"w-3 h-3 rounded-full " + (esOcupada ? "bg-red-500" : "bg-emerald-500")}>
                        {!esOcupada && <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></div>}
                      </div>
                    </div>

                    <div className={"w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center " + (esOcupada ? "bg-red-500/20" : "bg-emerald-500/20")}>
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

                    <p className="text-white font-bold text-center text-sm mb-1">{mesa.numero}</p>
                    <p className={"text-[10px] text-center font-medium uppercase " + (esOcupada ? "text-red-400" : "text-emerald-400")}>
                      {esOcupada ? "En servicio" : "Disponible"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {mesasMostrar.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No hay mesas</p>
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
      </div>
    </div>
  );
}
