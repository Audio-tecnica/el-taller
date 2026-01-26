import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { inventarioKardexService } from "../../services/inventarioKardexService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function InventarioValorizado() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState({ productos: [], totales: {} });
  const [localFiltro, setLocalFiltro] = useState(null);
  const [ordenPor, setOrdenPor] = useState("valor_desc");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarDatos();
  }, [localFiltro]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await inventarioKardexService.getInventarioValorizado(localFiltro);
      setDatos(data);
    } catch {
      toast.error("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value) => {
    return "$" + Number(value || 0).toLocaleString();
  };

  const productosFiltrados = datos.productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    switch (ordenPor) {
      case "valor_desc":
        return b.valor_inventario_costo - a.valor_inventario_costo;
      case "valor_asc":
        return a.valor_inventario_costo - b.valor_inventario_costo;
      case "margen_desc":
        return parseFloat(b.margen_porcentaje) - parseFloat(a.margen_porcentaje);
      case "margen_asc":
        return parseFloat(a.margen_porcentaje) - parseFloat(b.margen_porcentaje);
      case "stock_desc":
        return b.stock - a.stock;
      case "stock_asc":
        return a.stock - b.stock;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg font-medium">Cargando inventario...</p>
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
              onClick={() => navigate("/inventario")}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <img src={logo} alt="El Taller" className="w-10 h-10 rounded-xl object-contain bg-black" />
              <div>
                <h1 className="text-xl font-black text-white">Inventario Valorizado</h1>
                <p className="text-xs text-[#D4B896]">Análisis Financiero de Inventario</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/inventario")}
              className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
            >
              Volver
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Cards de Totales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-5">
            <p className="text-blue-400 text-sm mb-1">Total Productos</p>
            <p className="text-3xl font-black text-white">{datos.totales.total_productos || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-5">
            <p className="text-emerald-400 text-sm mb-1">Valor Costo</p>
            <p className="text-3xl font-black text-white">{formatMoney(datos.totales.valor_total_costo)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-5">
            <p className="text-purple-400 text-sm mb-1">Valor Venta</p>
            <p className="text-3xl font-black text-white">{formatMoney(datos.totales.valor_total_venta)}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-5">
            <p className="text-amber-400 text-sm mb-1">Utilidad Potencial</p>
            <p className="text-3xl font-black text-white">{formatMoney(datos.totales.utilidad_potencial_total)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Buscar</label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, código o categoría..."
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
              </select>
            </div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {productosOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                      No se encontraron productos
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
                          (producto.stock_bajo ? "bg-red-500/20 text-red-400" : "text-white")
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
