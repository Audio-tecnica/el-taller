import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { inventarioKardexService } from "../../services/inventarioKardexService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function InventarioValorizado() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState({ 
    productos: [], 
    totales: {}, 
    desglosePorLocal: null,
    topProductos: {}
  });
  
  // Filtros
  const [localFiltro, setLocalFiltro] = useState(null);
  const [ordenPor, setOrdenPor] = useState("valor_desc");
  const [busqueda, setBusqueda] = useState("");
  const [filtroRotacion, setFiltroRotacion] = useState("todos");
  const [filtroStock, setFiltroStock] = useState("todos");
  
  // Vista activa
  const [vistaActiva, setVistaActiva] = useState("dashboard"); // dashboard, tabla, analisis

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFiltro]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await inventarioKardexService.getInventarioValorizado(localFiltro);
      setDatos(data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      toast.error("Error al cargar inventario: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value) => {
    return "$" + Number(value || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });
  };

  // Aplicar filtros a productos
  let productosFiltrados = datos.productos.filter(p => {
    // Filtro de búsqueda
    const matchBusqueda = !busqueda || 
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(busqueda.toLowerCase());
    
    // Filtro de rotación
    const matchRotacion = filtroRotacion === "todos" || 
      p.clasificacion_rotacion === filtroRotacion;
    
    // Filtro de stock
    let matchStock = true;
    if (filtroStock === "critico") matchStock = p.stock_critico;
    else if (filtroStock === "bajo") matchStock = p.stock_bajo;
    else if (filtroStock === "sin_stock") matchStock = p.sin_stock;
    else if (filtroStock === "disponible") matchStock = p.stock > 0;
    
    return matchBusqueda && matchRotacion && matchStock;
  });

  // Ordenar productos
  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    switch (ordenPor) {
      case "valor_desc": return b.valor_inventario_costo - a.valor_inventario_costo;
      case "valor_asc": return a.valor_inventario_costo - b.valor_inventario_costo;
      case "margen_desc": return parseFloat(b.margen_porcentaje) - parseFloat(a.margen_porcentaje);
      case "margen_asc": return parseFloat(a.margen_porcentaje) - parseFloat(b.margen_porcentaje);
      case "stock_desc": return b.stock - a.stock;
      case "stock_asc": return a.stock - b.stock;
      case "rotacion_desc": return b.ventas_90_dias - a.ventas_90_dias;
      case "rotacion_asc": return a.ventas_90_dias - b.ventas_90_dias;
      case "nombre_asc": return a.nombre.localeCompare(b.nombre);
      case "nombre_desc": return b.nombre.localeCompare(a.nombre);
      default: return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg font-medium">Analizando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#D4B896]/20 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="El Taller" className="w-10 h-10 rounded-xl object-contain bg-black" />
              <div>
                <h1 className="text-xl font-black text-white">Inventario Valorizado</h1>
                <p className="text-xs text-[#D4B896]">Análisis Completo • Control Financiero • Rotación</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botones de vista */}
              <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-[#2a2a2a]">
                <button
                  onClick={() => setVistaActiva("dashboard")}
                  className={`px-4 py-2 rounded text-sm font-medium transition ${
                    vistaActiva === "dashboard"
                      ? "bg-[#D4B896] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setVistaActiva("tabla")}
                  className={`px-4 py-2 rounded text-sm font-medium transition ${
                    vistaActiva === "tabla"
                      ? "bg-[#D4B896] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  📋 Tabla
                </button>
                <button
                  onClick={() => setVistaActiva("analisis")}
                  className={`px-4 py-2 rounded text-sm font-medium transition ${
                    vistaActiva === "analisis"
                      ? "bg-[#D4B896] text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  📈 Análisis
                </button>
              </div>

              <button
                onClick={() => navigate("/inventario")}
                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* ============================================ */}
        {/* VISTA DASHBOARD */}
        {/* ============================================ */}
        {vistaActiva === "dashboard" && (
          <div className="space-y-6">
            {/* Métricas Principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-5">
                <p className="text-blue-400 text-sm mb-1">Total Productos</p>
                <p className="text-3xl font-black text-white">{datos.totales.total_productos || 0}</p>
                <p className="text-xs text-blue-300 mt-1">
                  {datos.totales.total_productos_activos || 0} con stock
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-5">
                <p className="text-emerald-400 text-sm mb-1">Valor Inventario</p>
                <p className="text-3xl font-black text-white">{formatMoney(datos.totales.valor_total_costo)}</p>
                <p className="text-xs text-emerald-300 mt-1">Capital invertido</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-5">
                <p className="text-purple-400 text-sm mb-1">Valor Potencial</p>
                <p className="text-3xl font-black text-white">{formatMoney(datos.totales.valor_total_venta)}</p>
                <p className="text-xs text-purple-300 mt-1">Si se vende todo</p>
              </div>

              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-5">
                <p className="text-amber-400 text-sm mb-1">Utilidad Potencial</p>
                <p className="text-3xl font-black text-white">{formatMoney(datos.totales.utilidad_potencial_total)}</p>
                <p className="text-xs text-amber-300 mt-1">
                  Margen: {datos.totales.margen_promedio_ponderado}%
                </p>
              </div>
            </div>

            {/* Alertas y Rotación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Alertas de Stock */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  Alertas de Stock
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-400">Sin Stock</p>
                      <p className="text-2xl font-bold text-red-400">{datos.totales.productos_sin_stock || 0}</p>
                    </div>
                    <span className="text-3xl">🚨</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-400">Stock Crítico</p>
                      <p className="text-2xl font-bold text-orange-400">{datos.totales.productos_stock_critico || 0}</p>
                    </div>
                    <span className="text-3xl">⚡</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-400">Stock Bajo</p>
                      <p className="text-2xl font-bold text-yellow-400">{datos.totales.productos_stock_bajo || 0}</p>
                    </div>
                    <span className="text-3xl">⚠️</span>
                  </div>
                </div>
              </div>

              {/* Análisis de Rotación */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  Análisis de Rotación (90 días)
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-400">Alta Rotación</p>
                      <p className="text-2xl font-bold text-emerald-400">{datos.totales.productos_alta_rotacion || 0}</p>
                    </div>
                    <span className="text-3xl">🚀</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-400">Rotación Media</p>
                      <p className="text-2xl font-bold text-blue-400">{datos.totales.productos_media_rotacion || 0}</p>
                    </div>
                    <span className="text-3xl">📊</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-400">Sin Movimiento</p>
                      <p className="text-2xl font-bold text-red-400">{datos.totales.productos_sin_movimiento || 0}</p>
                    </div>
                    <span className="text-3xl">💤</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desglose por Local */}
            {datos.desglosePorLocal && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">🏢</span>
                  Desglose por Local
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Castellana */}
                  <div className="border border-[#3a3a3a] rounded-xl p-4">
                    <h4 className="text-md font-bold text-[#D4B896] mb-3">Castellana</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Productos con stock:</span>
                        <span className="text-sm font-bold text-white">
                          {datos.desglosePorLocal.castellana.productos_con_stock}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Valor costo:</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatMoney(datos.desglosePorLocal.castellana.valor_costo)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Valor venta:</span>
                        <span className="text-sm font-bold text-purple-400">
                          {formatMoney(datos.desglosePorLocal.castellana.valor_venta)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#2a2a2a]">
                        <span className="text-sm text-gray-400">Utilidad potencial:</span>
                        <span className="text-sm font-bold text-amber-400">
                          {formatMoney(datos.desglosePorLocal.castellana.utilidad_potencial)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Avenida 1ra */}
                  <div className="border border-[#3a3a3a] rounded-xl p-4">
                    <h4 className="text-md font-bold text-[#D4B896] mb-3">Avenida 1ra</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Productos con stock:</span>
                        <span className="text-sm font-bold text-white">
                          {datos.desglosePorLocal.avenida_1ra.productos_con_stock}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Valor costo:</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatMoney(datos.desglosePorLocal.avenida_1ra.valor_costo)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Valor venta:</span>
                        <span className="text-sm font-bold text-purple-400">
                          {formatMoney(datos.desglosePorLocal.avenida_1ra.valor_venta)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#2a2a2a]">
                        <span className="text-sm text-gray-400">Utilidad potencial:</span>
                        <span className="text-sm font-bold text-amber-400">
                          {formatMoney(datos.desglosePorLocal.avenida_1ra.utilidad_potencial)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mayor Valor en Inventario */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  Top 5 - Mayor Valor en Inventario
                </h3>
                <div className="space-y-2">
                  {datos.topProductos.mayor_valor?.map((p, i) => (
                    <div key={p.producto_id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl font-black text-emerald-500/50">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{p.nombre}</p>
                          <p className="text-xs text-gray-500">{p.stock} unidades</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatMoney(p.valor_inventario_costo)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mayor Rotación */}
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  Top 5 - Mayor Rotación (90 días)
                </h3>
                <div className="space-y-2">
                  {datos.topProductos.mayor_rotacion?.map((p, i) => (
                    <div key={p.producto_id} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl font-black text-orange-500/50">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{p.nombre}</p>
                          <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-orange-400">
                        {p.ventas_90_dias} ventas
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* VISTA TABLA */}
        {/* ============================================ */}
        {vistaActiva === "tabla" && (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Buscar</label>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Nombre, código..."
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Local</label>
                  <select
                    value={localFiltro || ""}
                    onChange={(e) => setLocalFiltro(e.target.value || null)}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                  >
                    <option value="">Todos los locales</option>
                    <option value="00000000-0000-0000-0000-000000000001">Castellana</option>
                    <option value="00000000-0000-0000-0000-000000000002">Avenida 1ra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Rotación</label>
                  <select
                    value={filtroRotacion}
                    onChange={(e) => setFiltroRotacion(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                  >
                    <option value="todos">Todas</option>
                    <option value="Alta rotación">Alta rotación</option>
                    <option value="Rotación media">Media</option>
                    <option value="Baja rotación">Baja</option>
                    <option value="Sin movimiento">Sin movimiento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Stock</label>
                  <select
                    value={filtroStock}
                    onChange={(e) => setFiltroStock(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                  >
                    <option value="todos">Todos</option>
                    <option value="disponible">Con stock</option>
                    <option value="sin_stock">Sin stock</option>
                    <option value="bajo">Stock bajo</option>
                    <option value="critico">Stock crítico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ordenar por</label>
                  <select
                    value={ordenPor}
                    onChange={(e) => setOrdenPor(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                  >
                    <option value="valor_desc">Mayor valor</option>
                    <option value="valor_asc">Menor valor</option>
                    <option value="margen_desc">Mayor margen</option>
                    <option value="margen_asc">Menor margen</option>
                    <option value="stock_desc">Mayor stock</option>
                    <option value="stock_asc">Menor stock</option>
                    <option value="rotacion_desc">Mayor rotación</option>
                    <option value="rotacion_asc">Menor rotación</option>
                    <option value="nombre_asc">Nombre A-Z</option>
                    <option value="nombre_desc">Nombre Z-A</option>
                  </select>
                </div>
              </div>

              {/* Contador de resultados */}
              <div className="flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-[#2a2a2a]">
                <span>Mostrando {productosOrdenados.length} de {datos.productos.length} productos</span>
                {(busqueda || filtroRotacion !== "todos" || filtroStock !== "todos") && (
                  <button
                    onClick={() => {
                      setBusqueda("");
                      setFiltroRotacion("todos");
                      setFiltroStock("todos");
                    }}
                    className="text-[#D4B896] hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Tabla de Productos */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Producto</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Stock</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Costo Prom.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">P. Venta</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Valor Costo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Valor Venta</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Utilidad</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Margen</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Rotación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {productosOrdenados.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                          No se encontraron productos con los filtros aplicados
                        </td>
                      </tr>
                    ) : (
                      productosOrdenados.map((producto) => (
                        <tr key={producto.producto_id} className="hover:bg-[#1a1a1a] transition">
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-white font-medium">{producto.nombre}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{producto.codigo}</span>
                                {producto.categoria && (
                                  <span className="text-xs text-gray-600">• {producto.categoria}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={
                              "px-2 py-1 rounded text-sm font-medium " +
                              (producto.stock_critico 
                                ? "bg-red-500/20 text-red-400" 
                                : producto.stock_bajo 
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "text-white")
                            }>
                              {producto.stock}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-gray-400 text-sm">
                            {formatMoney(producto.costo_promedio)}
                          </td>
                          <td className="px-4 py-4 text-right text-white text-sm font-medium">
                            {formatMoney(producto.precio_venta)}
                          </td>
                          <td className="px-4 py-4 text-right text-white font-medium">
                            {formatMoney(producto.valor_inventario_costo)}
                          </td>
                          <td className="px-4 py-4 text-right text-emerald-400 font-medium">
                            {formatMoney(producto.valor_inventario_venta)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={
                              "font-bold " +
                              (producto.utilidad_potencial > 0 ? "text-emerald-400" : "text-red-400")
                            }>
                              {formatMoney(producto.utilidad_potencial)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={
                              "px-3 py-1 rounded-full text-sm font-bold " +
                              (parseFloat(producto.margen_porcentaje) >= 50 
                                ? "bg-emerald-500/20 text-emerald-400"
                                : parseFloat(producto.margen_porcentaje) >= 30
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-red-500/20 text-red-400")
                            }>
                              {producto.margen_porcentaje}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={
                                "px-2 py-1 rounded text-xs font-bold " +
                                (producto.color_rotacion === 'green' 
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : producto.color_rotacion === 'yellow'
                                  ? "bg-blue-500/20 text-blue-400"
                                  : producto.color_rotacion === 'orange'
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-red-500/20 text-red-400")
                              }>
                                {producto.ventas_90_dias} uds
                              </span>
                              <span className="text-xs text-gray-500">
                                {producto.dias_inventario} días
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* VISTA ANÁLISIS */}
        {/* ============================================ */}
        {vistaActiva === "analisis" && (
          <div className="space-y-6">
            {/* Productos Críticos */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                Productos Sin Movimiento (Capital Inmovilizado)
              </h3>
              <div className="space-y-2">
                {datos.topProductos.sin_movimiento?.length > 0 ? (
                  datos.topProductos.sin_movimiento.map((p) => (
                    <div key={p.producto_id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-red-500/30">
                      <div>
                        <p className="text-sm font-medium text-white">{p.nombre}</p>
                        <p className="text-xs text-gray-500">{p.stock} unidades • {p.categoria}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-400">{formatMoney(p.valor_inventario_costo)}</p>
                        <p className="text-xs text-gray-500">Capital inmovilizado</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">¡Excelente! No hay productos sin movimiento</p>
                )}
              </div>
            </div>

            {/* Productos con Mayor Utilidad */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">💎</span>
                Top 5 - Mayor Utilidad Potencial
              </h3>
              <div className="space-y-2">
                {datos.topProductos.mayor_utilidad?.map((p, i) => (
                  <div key={p.producto_id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-emerald-500/30">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-3xl font-black text-emerald-500/50">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{p.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {p.stock} uds × {formatMoney(p.margen_absoluto)} margen/ud
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">{formatMoney(p.utilidad_potencial)}</p>
                      <p className="text-xs text-emerald-300">{p.margen_porcentaje}% margen</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen Total */}
            <div className="bg-gradient-to-br from-[#D4B896]/10 to-[#D4B896]/5 border border-[#D4B896]/30 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-[#D4B896] mb-4">📊 Resumen Global</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Capital Total Invertido</p>
                  <p className="text-3xl font-black text-white mb-1">{formatMoney(datos.totales.valor_total_costo)}</p>
                  <p className="text-xs text-gray-500">
                    En {datos.totales.total_productos_activos} productos con stock
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Utilidad Potencial Total</p>
                  <p className="text-3xl font-black text-emerald-400 mb-1">{formatMoney(datos.totales.utilidad_potencial_total)}</p>
                  <p className="text-xs text-gray-500">
                    Margen promedio ponderado: {datos.totales.margen_promedio_ponderado}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}