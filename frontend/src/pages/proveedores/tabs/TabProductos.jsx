import { useState, useEffect } from "react";
import { proveedoresService } from "../../../services/proveedoresService";

export default function TabProductos({ proveedorId }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordenamiento, setOrdenamiento] = useState("monto");

  useEffect(() => {
    cargarProductos();
  }, [proveedorId]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await proveedoresService.getProductos(proveedorId);
      setProductos(data.productos || []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  const productosOrdenados = [...productos].sort((a, b) => {
    switch (ordenamiento) {
      case "monto":
        return b.monto_total - a.monto_total;
      case "cantidad":
        return b.cantidad_total - a.cantidad_total;
      case "nombre":
        return (a.nombre || "").localeCompare(b.nombre || "");
      default:
        return 0;
    }
  });

  const totalMonto = productos.reduce((sum, p) => sum + p.monto_total, 0);
  const totalCantidad = productos.reduce((sum, p) => sum + p.cantidad_total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">📦</span>
            <span className="text-xs text-gray-500 font-mono">PRODUCTOS</span>
          </div>
          <h3 className="text-3xl font-black text-white mb-1">
            {productos.length}
          </h3>
          <p className="text-sm text-gray-400">Productos únicos</p>
        </div>

        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">📊</span>
            <span className="text-xs text-gray-500 font-mono">UNIDADES</span>
          </div>
          <h3 className="text-3xl font-black text-blue-400 mb-1">
            {totalCantidad.toFixed(0)}
          </h3>
          <p className="text-sm text-gray-400">Unidades compradas</p>
        </div>

        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">💰</span>
            <span className="text-xs text-gray-500 font-mono">VALOR</span>
          </div>
          <h3 className="text-2xl font-black text-[#D4B896] mb-1">
            {formatearMoneda(totalMonto)}
          </h3>
          <p className="text-sm text-gray-400">Monto total invertido</p>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Lista de Productos</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Ordenar por:</span>
          <select
            value={ordenamiento}
            onChange={(e) => setOrdenamiento(e.target.value)}
            className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#D4B896] transition"
          >
            <option value="monto">Mayor monto</option>
            <option value="cantidad">Mayor cantidad</option>
            <option value="nombre">Nombre A-Z</option>
          </select>
        </div>
      </div>

      {/* Lista de Productos */}
      {productosOrdenados.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
          <span className="text-6xl mb-4 block">📦</span>
          <p className="text-gray-400 text-lg">No hay productos comprados</p>
          <p className="text-gray-600 text-sm mt-2">Registra compras para ver el historial de productos</p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Compras
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Cantidad Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Costo Promedio
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Monto Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {productosOrdenados.map((producto, index) => (
                  <tr key={producto.producto_id || index} className="hover:bg-[#0a0a0a] transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{producto.nombre}</p>
                        {producto.codigo && (
                          <p className="text-xs text-gray-500 font-mono mt-1">{producto.codigo}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {producto.categoria ? (
                        <span className="px-2 py-1 bg-[#2a2a2a] text-gray-300 text-xs rounded-full">
                          {producto.categoria}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">Sin categoría</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm font-bold rounded-full">
                        {producto.numero_compras}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white font-medium">
                      {producto.cantidad_total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                      {formatearMoneda(producto.costo_promedio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-[#D4B896]">
                      {formatearMoneda(producto.monto_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#0a0a0a]">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right text-sm font-bold text-white">
                    TOTALES:
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-white">
                    {totalCantidad.toFixed(2)}
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-right text-sm font-black text-[#D4B896]">
                    {formatearMoneda(totalMonto)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Top 5 Productos */}
      {productos.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🏆</span>
            Top 5 Productos por Monto
          </h3>
          <div className="space-y-3">
            {productosOrdenados.slice(0, 5).map((producto, index) => {
              const porcentaje = (producto.monto_total / totalMonto) * 100;
              return (
                <div key={producto.producto_id || index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium flex items-center gap-2">
                      <span className="text-[#D4B896] font-black">#{index + 1}</span>
                      {producto.nombre}
                    </span>
                    <span className="text-[#D4B896] font-bold">{formatearMoneda(producto.monto_total)}</span>
                  </div>
                  <div className="w-full bg-[#0a0a0a] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#D4B896] to-[#C4A576] h-full rounded-full transition-all"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{porcentaje.toFixed(1)}% del total</span>
                    <span>{producto.numero_compras} compras</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}