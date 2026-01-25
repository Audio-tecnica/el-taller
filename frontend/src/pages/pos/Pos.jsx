import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { mesasService } from "../../services/mesasService";
import { pedidosService } from "../../services/pedidosService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function POS() {
  const navigate = useNavigate();
  const [mesas, setMesas] = useState([]);
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroLocal, setFiltroLocal] = useState("");

  const cargarDatos = useCallback(async () => {
    try {
      const [mesasData, localesData] = await Promise.all([
        mesasService.getMesas(),
        mesasService.getLocales(),
      ]);
      setMesas(mesasData);
      setLocales(localesData);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    const interval = setInterval(() => {
      cargarDatos();
    }, 7000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        cargarDatos();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [cargarDatos]);

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
          toast.error("No se encontro el pedido. Actualizando...");
          await cargarDatos();
        }
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.pedido_id) {
        navigate("/pos/pedido/" + error.response.data.pedido_id);
      } else {
        const mensaje = error.response && error.response.data && error.response.data.error
          ? error.response.data.error
          : "Error al procesar";
        toast.error(mensaje);
        await cargarDatos();
      }
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await cargarDatos();
    toast.success("Actualizado", { duration: 1500 });
  };

  const mesasFiltradas = filtroLocal
    ? mesas.filter((m) => m.local_id === filtroLocal)
    : mesas;

  const mesasPorLocal = locales
    .map((local) => ({
      ...local,
      mesas: mesasFiltradas.filter((m) => m.local_id === local.id),
    }))
    .filter((local) => local.mesas.length > 0);

  // Estadísticas
  const totalMesas = mesas.length;
  const mesasOcupadas = mesas.filter((m) => m.estado === "ocupada").length;
  const mesasDisponibles = mesas.filter((m) => m.estado === "disponible").length;

  if (loading && mesas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg">Cargando mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
      {/* Header Premium */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#D4B896]/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 hover:opacity-80 transition group"
            >
              <div className="relative">
                <img
                  src={logo}
                  alt="El Taller"
                  className="w-12 h-12 rounded-xl object-contain bg-black ring-2 ring-[#D4B896]/30 group-hover:ring-[#D4B896] transition"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0a]"></div>
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  EL TALLER
                </h1>
                <p className="text-xs text-[#D4B896]">Punto de Venta</p>
              </div>
            </button>

            {/* Stats rápidos */}
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

            {/* Botón refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#D4B896] hover:bg-[#D4B896]/10 transition-all duration-300 group"
              title="Actualizar"
            >
              <svg
                className={"w-5 h-5 text-[#D4B896] group-hover:rotate-180 transition-transform duration-500" + (loading ? " animate-spin" : "")}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Filtros con estilo pill */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltroLocal("")}
            className={
              "px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 " +
              (filtroLocal === ""
                ? "bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] shadow-lg shadow-[#D4B896]/25"
                : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]/50 hover:text-[#D4B896]")
            }
          >
            Todos los locales
          </button>
          {locales.map((local) => {
            const mesasLocal = mesas.filter((m) => m.local_id === local.id);
            const ocupadas = mesasLocal.filter((m) => m.estado === "ocupada").length;
            return (
              <button
                key={local.id}
                onClick={() => setFiltroLocal(local.id)}
                className={
                  "px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 " +
                  (filtroLocal === local.id
                    ? "bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] shadow-lg shadow-[#D4B896]/25"
                    : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]/50 hover:text-[#D4B896]")
                }
              >
                {local.nombre}
                {ocupadas > 0 && (
                  <span className={
                    "text-xs px-2 py-0.5 rounded-full " +
                    (filtroLocal === local.id
                      ? "bg-[#0a0a0a]/20 text-[#0a0a0a]"
                      : "bg-red-500/20 text-red-400")
                  }>
                    {ocupadas}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mesas por local */}
      <div className="max-w-7xl mx-auto px-4 pb-8 space-y-8">
        {mesasPorLocal.map((local) => {
          const disponibles = local.mesas.filter((m) => m.estado === "disponible").length;
          const ocupadas = local.mesas.filter((m) => m.estado === "ocupada").length;
          
          return (
            <div key={local.id} className="space-y-4">
              {/* Header del local */}
              {!filtroLocal && (
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
                        <span className="text-emerald-400">{disponibles} libres</span>
                        {ocupadas > 0 && (
                          <span className="text-red-400 ml-2">{ocupadas} ocupadas</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#D4B896]/30 to-transparent"></div>
                </div>
              )}

              {/* Grid de mesas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {local.mesas.map((mesa) => {
                  const esOcupada = mesa.estado === "ocupada";
                  const esReservada = mesa.estado === "reservada";
                  
                  return (
                    <button
                      key={mesa.id}
                      onClick={() => handleMesaClick(mesa)}
                      className={
                        "group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 " +
                        (esOcupada
                          ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/50 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20"
                          : esReservada
                            ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/50 hover:border-yellow-400"
                            : "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/50 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20")
                      }
                    >
                      {/* Indicador de estado pulsante */}
                      <div className="absolute top-3 right-3">
                        <div className={
                          "w-3 h-3 rounded-full " +
                          (esOcupada
                            ? "bg-red-500"
                            : esReservada
                              ? "bg-yellow-500"
                              : "bg-emerald-500")
                        }>
                          {!esOcupada && !esReservada && (
                            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                          )}
                        </div>
                      </div>

                      {/* Icono de mesa */}
                      <div className={
                        "w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-300 " +
                        (esOcupada
                          ? "bg-red-500/20 group-hover:bg-red-500/30"
                          : esReservada
                            ? "bg-yellow-500/20"
                            : "bg-emerald-500/20 group-hover:bg-emerald-500/30")
                      }>
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

                      {/* Nombre de mesa */}
                      <p className="text-white font-bold text-center text-sm leading-tight mb-1">
                        {mesa.numero}
                      </p>

                      {/* Estado */}
                      <p className={
                        "text-[10px] text-center font-medium uppercase tracking-wider " +
                        (esOcupada
                          ? "text-red-400"
                          : esReservada
                            ? "text-yellow-400"
                            : "text-emerald-400")
                      }>
                        {esOcupada ? "En servicio" : esReservada ? "Reservada" : "Disponible"}
                      </p>

                      {/* Hover effect - flecha */}
                      <div className={
                        "absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 " +
                        (esOcupada ? "text-red-400" : "text-emerald-400")
                      }>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {mesasFiltradas.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No hay mesas en este local</p>
          </div>
        )}
      </div>

      {/* Leyenda flotante en móvil */}
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

      {/* Indicador de carga */}
      {loading && mesas.length > 0 && (
        <div className="fixed bottom-20 md:bottom-4 right-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2 flex items-center gap-2 shadow-xl">
          <div className="w-4 h-4 border-2 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-400">Actualizando...</span>
        </div>
      )}
    </div>
  );
}