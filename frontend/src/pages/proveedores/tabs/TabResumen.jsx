import { useState, useEffect } from "react";
import { proveedoresService } from "../../../services/proveedoresService";

export default function TabResumen({ proveedor, estadisticas }) {
  const [comprasRecientes, setComprasRecientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarComprasRecientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedor.id]);

  const cargarComprasRecientes = async () => {
    try {
      setLoading(true);
      const data = await proveedoresService.getCompras(proveedor.id);
      setComprasRecientes(data.compras?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error al cargar compras recientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Compras */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#D4B896]/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">🛒</span>
            <span className="text-xs text-gray-500 font-mono">TOTAL</span>
          </div>
          <h3 className="text-3xl font-black text-white mb-1">
            {estadisticas?.total_compras || 0}
          </h3>
          <p className="text-sm text-gray-400">Compras registradas</p>
        </div>

        {/* Compras Recibidas */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 hover:border-green-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">✅</span>
            <span className="text-xs text-gray-500 font-mono">RECIBIDAS</span>
          </div>
          <h3 className="text-3xl font-black text-green-400 mb-1">
            {estadisticas?.compras_recibidas || 0}
          </h3>
          <p className="text-sm text-gray-400">Compras completadas</p>
        </div>

        {/* Monto Total */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#D4B896]/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">💰</span>
            <span className="text-xs text-gray-500 font-mono">MONTO</span>
          </div>
          <h3 className="text-2xl font-black text-[#D4B896] mb-1">
            {formatearMoneda(estadisticas?.monto_total || 0)}
          </h3>
          <p className="text-sm text-gray-400">Valor total comprado</p>
        </div>

        {/* Monto Promedio */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl">📊</span>
            <span className="text-xs text-gray-500 font-mono">PROMEDIO</span>
          </div>
          <h3 className="text-2xl font-black text-blue-400 mb-1">
            {formatearMoneda(estadisticas?.monto_promedio || 0)}
          </h3>
          <p className="text-sm text-gray-400">Por compra</p>
        </div>
      </div>

      {/* Última Compra */}
      {estadisticas?.ultima_compra && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🕒</span>
            Última Compra
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-gray-500">Fecha</span>
              <p className="text-white font-medium">
                {formatearFecha(estadisticas.ultima_compra.fecha)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Número de Factura</span>
              <p className="text-white font-medium font-mono">
                {estadisticas.ultima_compra.numero}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Monto</span>
              <p className="text-[#D4B896] font-bold text-lg">
                {formatearMoneda(estadisticas.ultima_compra.monto)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compras Recientes */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#2a2a2a]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📋</span>
            Compras Recientes
          </h3>
        </div>

        {comprasRecientes.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-6xl mb-4 block">📦</span>
            <p className="text-gray-400">No hay compras registradas aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {comprasRecientes.map((compra) => (
                  <tr key={compra.id} className="hover:bg-[#0a0a0a] transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatearFecha(compra.fecha_compra)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                      {compra.numero_factura || compra.numero_compra}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${compra.estado === 'recibida' 
                          ? 'bg-green-500/10 text-green-400' 
                          : compra.estado === 'pendiente'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-red-500/10 text-red-400'
                        }
                      `}>
                        {compra.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#D4B896] font-bold">
                      {formatearMoneda(compra.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Productos Únicos</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">
              {estadisticas?.productos_diferentes || 0}
            </span>
            <span className="text-sm text-gray-400">productos distintos</span>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Términos de Pago</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#D4B896]">
              {proveedor.terminos_pago || 'No definido'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}