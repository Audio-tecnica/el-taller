import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { reportesService } from "../../services/reportesService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function Reportes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ventasHoy, setVentasHoy] = useState(null);
  const [ventasRango, setVentasRango] = useState(null);
  const [productosTop, setProductosTop] = useState([]);
  const [ventasCategorias, setVentasCategorias] = useState([]);
  const [cortesias, setCortesias] = useState(null);
  const [tabActiva, setTabActiva] = useState("resumen");
  
  // Filtros de fecha
  const hoy = new Date().toISOString().split('T')[0];
  const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [fechaInicio, setFechaInicio] = useState(hace7Dias);
  const [fechaFin, setFechaFin] = useState(hoy);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [ventasHoyData, ventasRangoData, productosData, categoriasData, cortesiasData] = await Promise.all([
        reportesService.getVentasHoy(),
        reportesService.getVentasPorRango(fechaInicio, fechaFin),
        reportesService.getProductosTop(fechaInicio, fechaFin, 10),
        reportesService.getVentasPorCategoria(fechaInicio, fechaFin),
        reportesService.getCortesias(fechaInicio, fechaFin)
      ]);
      setVentasHoy(ventasHoyData);
      setVentasRango(ventasRangoData);
      setProductosTop(productosData);
      setVentasCategorias(categoriasData);
      setCortesias(cortesiasData);
    } catch {
      toast.error("Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const formatMoney = (value) => {
    return "$" + Number(value || 0).toLocaleString();
  };

  if (loading && !ventasHoy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg">Cargando reportes...</p>
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
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <img src={logo} alt="El Taller" className="w-10 h-10 rounded-xl object-contain bg-black" />
              <div>
                <h1 className="text-xl font-black text-white">Reportes</h1>
                <p className="text-xs text-[#D4B896]">Estadisticas y Analisis</p>
              </div>
            </button>

            <div className="flex items-center gap-3">
              {/* Filtro de fechas */}
              <div className="hidden md:flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-1">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="px-3 py-1.5 bg-transparent border-none text-white text-sm focus:outline-none"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="px-3 py-1.5 bg-transparent border-none text-white text-sm focus:outline-none"
                />
              </div>

              {/* Botones rápidos */}
              <div className="hidden lg:flex gap-1">
                <button
                  onClick={() => { setFechaInicio(hoy); setFechaFin(hoy); }}
                  className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-gray-400 rounded-lg hover:text-white transition"
                >
                  Hoy
                </button>
                <button
                  onClick={() => { setFechaInicio(hace7Dias); setFechaFin(hoy); }}
                  className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-gray-400 rounded-lg hover:text-white transition"
                >
                  7 dias
                </button>
                <button
                  onClick={() => { setFechaInicio(hace30Dias); setFechaFin(hoy); }}
                  className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-gray-400 rounded-lg hover:text-white transition"
                >
                  30 dias
                </button>
              </div>

              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros en móvil */}
      <div className="md:hidden max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-2">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="flex-1 px-2 py-1 bg-transparent border-none text-white text-sm focus:outline-none"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="flex-1 px-2 py-1 bg-transparent border-none text-white text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "resumen", label: "Resumen", icon: "📊" },
            { id: "productos", label: "Productos", icon: "🏆" },
            { id: "categorias", label: "Categorias", icon: "📦" },
            { id: "cortesias", label: "Cortesias", icon: "🎁" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={
                "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition flex items-center gap-2 " +
                (tabActiva === tab.id
                  ? "bg-[#D4B896] text-[#0a0a0a]"
                  : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]")
              }
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Tab Resumen */}
        {tabActiva === "resumen" && (
          <div className="space-y-6">
            {/* Cards principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-5">
                <p className="text-emerald-400 text-sm mb-1">Ventas Hoy</p>
                <p className="text-3xl font-black text-white">{formatMoney(ventasHoy?.totalVentas)}</p>
                <p className="text-xs text-emerald-400/70 mt-1">{ventasHoy?.cantidadPedidos || 0} pedidos</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-5">
                <p className="text-blue-400 text-sm mb-1">Periodo Seleccionado</p>
                <p className="text-3xl font-black text-white">{formatMoney(ventasRango?.totalVentas)}</p>
                <p className="text-xs text-blue-400/70 mt-1">{ventasRango?.cantidadPedidos || 0} pedidos</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-5">
                <p className="text-purple-400 text-sm mb-1">Ticket Promedio</p>
                <p className="text-3xl font-black text-white">{formatMoney(ventasRango?.ticketPromedio)}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-2xl p-5">
                <p className="text-orange-400 text-sm mb-1">Cortesias</p>
                <p className="text-3xl font-black text-white">{formatMoney(ventasRango?.totalCortesias)}</p>
              </div>
            </div>

            {/* Ventas por día */}
            {ventasRango?.ventasPorDia && ventasRango.ventasPorDia.length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Ventas por Dia</h3>
                <div className="space-y-2">
                  {ventasRango.ventasPorDia.map((dia) => {
                    const maxVenta = Math.max(...ventasRango.ventasPorDia.map(d => d.total));
                    const porcentaje = maxVenta > 0 ? (dia.total / maxVenta) * 100 : 0;
                    return (
                      <div key={dia.fecha} className="flex items-center gap-4">
                        <span className="text-gray-500 text-sm w-24">{dia.fecha}</span>
                        <div className="flex-1 h-8 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-[#D4B896] to-[#C4A576] rounded-lg transition-all duration-500"
                            style={{ width: porcentaje + "%" }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                            {formatMoney(dia.total)}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs w-16 text-right">{dia.cantidad} ped.</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ventas por método de pago */}
            {ventasHoy?.ventasPorMetodo && Object.keys(ventasHoy.ventasPorMetodo).length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Metodos de Pago (Hoy)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(ventasHoy.ventasPorMetodo).map(([metodo, data]) => (
                    <div key={metodo} className="bg-[#1a1a1a] rounded-xl p-4 text-center">
                      <p className="text-2xl mb-2">
                        {metodo === 'efectivo' ? '💵' : metodo === 'transferencia' ? '🏦' : '📱'}
                      </p>
                      <p className="text-white font-bold">{formatMoney(data.total)}</p>
                      <p className="text-xs text-gray-500 capitalize">{metodo}</p>
                      <p className="text-xs text-gray-600">{data.cantidad} pedidos</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ventas por local hoy */}
            {ventasHoy?.ventasPorLocal && Object.keys(ventasHoy.ventasPorLocal).length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Ventas por Local (Hoy)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(ventasHoy.ventasPorLocal).map(([local, data]) => (
                    <div key={local} className="bg-[#1a1a1a] rounded-xl p-4">
                      <p className="text-gray-400 text-sm">{local}</p>
                      <p className="text-2xl font-bold text-[#D4B896]">{formatMoney(data.total)}</p>
                      <p className="text-xs text-gray-500">{data.cantidad} pedidos</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Productos */}
        {tabActiva === "productos" && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#2a2a2a]">
              <h3 className="text-white font-bold">Top 10 Productos Mas Vendidos</h3>
              <p className="text-xs text-gray-500">Periodo: {fechaInicio} al {fechaFin}</p>
            </div>
            <div className="divide-y divide-[#2a2a2a]">
              {productosTop.map((prod) => (
                <div key={prod.producto_id} className="flex items-center gap-4 p-4 hover:bg-[#1a1a1a] transition">
                  <div className={
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg " +
                    (prod.posicion === 1 ? "bg-yellow-500/20 text-yellow-400" :
                     prod.posicion === 2 ? "bg-gray-400/20 text-gray-400" :
                     prod.posicion === 3 ? "bg-orange-500/20 text-orange-400" :
                     "bg-[#1a1a1a] text-gray-500")
                  }>
                    {prod.posicion}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{prod.nombre}</p>
                    <p className="text-xs text-gray-500">{prod.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D4B896] font-bold">{prod.cantidadVendida} uds</p>
                    <p className="text-xs text-gray-500">{formatMoney(prod.totalVentas)}</p>
                  </div>
                </div>
              ))}
              {productosTop.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No hay datos para el periodo seleccionado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Categorías */}
        {tabActiva === "categorias" && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#2a2a2a]">
              <h3 className="text-white font-bold">Ventas por Categoria</h3>
              <p className="text-xs text-gray-500">Periodo: {fechaInicio} al {fechaFin}</p>
            </div>
            <div className="p-4 space-y-3">
              {ventasCategorias.map((cat) => {
                const maxVenta = Math.max(...ventasCategorias.map(c => c.totalVentas));
                const porcentaje = maxVenta > 0 ? (cat.totalVentas / maxVenta) * 100 : 0;
                return (
                  <div key={cat.nombre} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white flex items-center gap-2">
                        <span>{cat.icono}</span>
                        {cat.nombre}
                      </span>
                      <span className="text-[#D4B896] font-bold">{formatMoney(cat.totalVentas)}</span>
                    </div>
                    <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4B896] to-[#C4A576] rounded-full transition-all duration-500"
                        style={{ width: porcentaje + "%" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-right">{cat.cantidadVendida} unidades vendidas</p>
                  </div>
                );
              })}
              {ventasCategorias.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No hay datos para el periodo seleccionado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Cortesías */}
        {tabActiva === "cortesias" && cortesias && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Total Cortesias</p>
                <p className="text-3xl font-black text-[#D4B896]">{formatMoney(cortesias.totalCortesias)}</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Pedidos con Cortesia</p>
                <p className="text-3xl font-black text-white">{cortesias.cantidadPedidosConCortesia}</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Promedio por Cortesia</p>
                <p className="text-3xl font-black text-white">
                  {formatMoney(cortesias.cantidadPedidosConCortesia > 0 
                    ? cortesias.totalCortesias / cortesias.cantidadPedidosConCortesia 
                    : 0)}
                </p>
              </div>
            </div>

            {/* Por razón */}
            {cortesias.porRazon && cortesias.porRazon.length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Por Razon</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {cortesias.porRazon.map((item) => (
                    <div key={item.razon} className="bg-[#1a1a1a] rounded-xl p-4">
                      <p className="text-white font-medium capitalize">{item.razon.replace(/_/g, ' ')}</p>
                      <p className="text-[#D4B896] font-bold">{formatMoney(item.total)}</p>
                      <p className="text-xs text-gray-500">{item.cantidad} veces</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalle */}
            {cortesias.detalle && cortesias.detalle.length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#2a2a2a]">
                  <h3 className="text-white font-bold">Detalle de Cortesias</h3>
                </div>
                <div className="divide-y divide-[#2a2a2a] max-h-96 overflow-y-auto">
                  {cortesias.detalle.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition">
                      <div>
                        <p className="text-white font-medium">Mesa {item.mesa} - {item.local}</p>
                        <p className="text-xs text-gray-500">{item.usuario} - {new Date(item.fecha).toLocaleString()}</p>
                        <p className="text-xs text-gray-600 capitalize">{item.razon?.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#D4B896] font-bold">-{formatMoney(item.monto_cortesia)}</p>
                        <p className="text-xs text-gray-500">de {formatMoney(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cortesias.cantidadPedidosConCortesia === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
                  <span className="text-4xl">🎁</span>
                </div>
                <p className="text-gray-500">No hay cortesias en el periodo seleccionado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}