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

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      cargarDatos();
    }, 10000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  // Refresh cuando vuelves a la pestaña/app
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

  const getEstadoStyles = (estado) => {
    switch (estado) {
      case "disponible":
        return "border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 hover:scale-105";
      case "ocupada":
        return "border-red-500 bg-red-500/10 hover:bg-red-500/20 hover:scale-105";
      case "reservada":
        return "border-yellow-500 bg-yellow-500/10 hover:scale-105";
      default:
        return "border-gray-600";
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "disponible":
        return "bg-emerald-500";
      case "ocupada":
        return "bg-red-500";
      case "reservada":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Filtrar mesas
  const mesasFiltradas = filtroLocal
    ? mesas.filter((m) => m.local_id === filtroLocal)
    : mesas;

  // Agrupar mesas por local
  const mesasPorLocal = locales
    .map((local) => ({
      ...local,
      mesas: mesasFiltradas.filter((m) => m.local_id === local.id),
    }))
    .filter((local) => local.mesas.length > 0);

  if (loading && mesas.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4B896] text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-[#2a2a2a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-3 hover:opacity-80 transition"
          >
            <img
              src={logo}
              alt="El Taller"
              className="w-10 h-10 rounded-full object-contain bg-black"
            />
            <div>
              <h1 className="text-lg font-bold text-[#D4B896] tracking-wide">
                EL TALLER
              </h1>
              <p className="text-xs text-gray-500">Punto de Venta</p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            {/* Leyenda */}
            <div className="hidden sm:flex items-center gap-4 text-xs mr-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-400">Disponible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-400">Ocupada</span>
              </div>
            </div>

            {/* Botón refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 rounded-lg bg-[#141414] border border-[#2a2a2a] hover:border-[#D4B896] transition disabled:opacity-50"
              title="Actualizar mesas"
            >
              <svg
                className={"w-5 h-5 text-[#D4B896]" + (loading ? " animate-spin" : "")}
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

      {/* Filtro de locales */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltroLocal("")}
            className={
              "px-4 py-2 rounded-lg font-medium transition text-sm " +
              (filtroLocal === ""
                ? "bg-[#D4B896] text-[#0a0a0a]"
                : "bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]")
            }
          >
            Todos
          </button>
          {locales.map((local) => (
            <button
              key={local.id}
              onClick={() => setFiltroLocal(local.id)}
              className={
                "px-4 py-2 rounded-lg font-medium transition text-sm " +
                (filtroLocal === local.id
                  ? "bg-[#D4B896] text-[#0a0a0a]"
                  : "bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]")
              }
            >
              {local.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Mesas agrupadas por local */}
      <div className="max-w-7xl mx-auto px-4 pb-8 space-y-8">
        {mesasPorLocal.map((local) => (
          <div key={local.id}>
            {/* Título del local (solo si no hay filtro) */}
            {!filtroLocal && (
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-[#D4B896]">
                  {local.nombre}
                </h2>
                <div className="flex-1 h-px bg-[#2a2a2a]"></div>
                <span className="text-xs text-gray-500">
                  {local.mesas.filter((m) => m.estado === "disponible").length}/
                  {local.mesas.length} disponibles
                </span>
              </div>
            )}

            {/* Grid de mesas */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {local.mesas.map((mesa) => (
                <button
                  key={mesa.id}
                  onClick={() => handleMesaClick(mesa)}
                  className={
                    "relative p-4 rounded-xl border-2 transition-all duration-200 aspect-square flex flex-col items-center justify-center " +
                    getEstadoStyles(mesa.estado)
                  }
                >
                  {/* Indicador de estado */}
                  <div
                    className={
                      "absolute top-2 right-2 w-2.5 h-2.5 rounded-full " +
                      getEstadoBadge(mesa.estado)
                    }
                  ></div>

                  {/* Número/Nombre de mesa */}
                  <p className="text-lg font-bold text-white text-center leading-tight">
                    {mesa.numero}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}

        {mesasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay mesas en este local</p>
          </div>
        )}
      </div>

      {/* Indicador de carga */}
      {loading && mesas.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-2 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-400">Actualizando...</span>
        </div>
      )}
    </div>
  );
}