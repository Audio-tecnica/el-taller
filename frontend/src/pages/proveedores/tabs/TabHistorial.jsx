import { useState, useEffect } from "react";
import { proveedoresService } from "../../../services/proveedoresService";

export default function TabHistorial({ proveedorId }) {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroFechas, setFiltroFechas] = useState({
    fechaInicio: "",
    fechaFin: ""
  });

  useEffect(() => {
    cargarHistorial();
  }, [proveedorId]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const data = await proveedoresService.getCompras(
        proveedorId,
        filtroFechas.fechaInicio,
        filtroFechas.fechaFin
      );
      setCompras(data.compras || []);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltro = () => {
    cargarHistorial();
  };

  const limpiarFiltro = () => {
    setFiltroFechas({ fechaInicio: "", fechaFin: "" });
    cargarHistorial();
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const agruparPorMes = () => {
    const grupos = {};
    compras.forEach(compra => {
      const fecha = new Date(compra.fecha_compra);
      const mesAnio = fecha.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
      if (!grupos[mesAnio]) {
        grupos[mesAnio] = {
          compras: [],
          total: 0,
          cantidad: 0
        };
      }
      grupos[mesAnio].compras.push(compra);
      grupos[mesAnio].total += parseFloat(compra.total || 0);
      grupos[mesAnio].cantidad += 1;
    });
    return grupos;
  };

  const gruposPorMes = agruparPorMes();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Filtrar por Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filtroFechas.fechaInicio}
              onChange={(e) => setFiltroFechas({ ...filtroFechas, fechaInicio: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#D4B896] transition"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filtroFechas.fechaFin}
              onChange={(e) => setFiltroFechas({ ...filtroFechas, fechaFin: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#D4B896] transition"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={aplicarFiltro}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] rounded-lg font-bold hover:shadow-lg hover:shadow-[#D4B896]/30 transition"
            >
              Aplicar
            </button>
            <button
              onClick={limpiarFiltro}
              className="px-4 py-2 bg-[#2a2a2a] text-gray-400 rounded-lg hover:bg-[#3a3a3a] transition"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Timeline por Mes */}
      {Object.keys(gruposPorMes).length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
          <span className="text-6xl mb-4 block">📅</span>
          <p className="text-gray-400 text-lg">No hay compras en el período seleccionado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(gruposPorMes).map(([mes, data]) => (
            <div key={mes} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
              {/* Header del Mes */}
              <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border-b border-[#2a2a2a] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white capitalize">{mes}</h3>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Compras</span>
                      <span className="text-white font-bold">{data.cantidad}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Total</span>
                      <span className="text-[#D4B896] font-bold">{formatearMoneda(data.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Compras */}
              <div className="p-4 space-y-3">
                {data.compras.map((compra, index) => (
                  <div
                    key={compra.id}
                    className="flex items-start gap-4 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg hover:border-[#D4B896]/30 transition"
                  >
                    {/* Indicador Visual */}
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-3 h-3 rounded-full
                        ${compra.estado === 'recibida' 
                          ? 'bg-green-400' 
                          : compra.estado === 'pendiente'
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                        }
                      `}></div>
                      {index < data.compras.length - 1 && (
                        <div className="w-0.5 h-full bg-[#2a2a2a] mt-2"></div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white font-medium">
                            Factura: <span className="font-mono text-[#D4B896]">
                              {compra.numero_factura || compra.numero_compra}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatearFecha(compra.fecha_compra)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#D4B896]">
                            {formatearMoneda(compra.total)}
                          </p>
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
                        </div>
                      </div>

                      {/* Detalles */}
                      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-[#2a2a2a]">
                        <div>
                          <span className="text-xs text-gray-600">Subtotal</span>
                          <p className="text-sm text-white">{formatearMoneda(compra.subtotal)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">IVA</span>
                          <p className="text-sm text-white">{formatearMoneda(compra.impuestos)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">Descuento</span>
                          <p className="text-sm text-white">{formatearMoneda(compra.descuento)}</p>
                        </div>
                      </div>

                      {compra.observaciones && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                          <p className="text-xs text-gray-500 mb-1">Observaciones:</p>
                          <p className="text-sm text-gray-300">{compra.observaciones}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen General */}
      {compras.length > 0 && (
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-[#D4B896]/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>📊</span>
            Resumen del Período
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#0a0a0a] rounded-lg">
              <span className="text-xs text-gray-500 block mb-2">Total Compras</span>
              <span className="text-3xl font-black text-white">{compras.length}</span>
            </div>
            <div className="text-center p-4 bg-[#0a0a0a] rounded-lg">
              <span className="text-xs text-gray-500 block mb-2">Recibidas</span>
              <span className="text-3xl font-black text-green-400">
                {compras.filter(c => c.estado === 'recibida').length}
              </span>
            </div>
            <div className="text-center p-4 bg-[#0a0a0a] rounded-lg">
              <span className="text-xs text-gray-500 block mb-2">Pendientes</span>
              <span className="text-3xl font-black text-yellow-400">
                {compras.filter(c => c.estado === 'pendiente').length}
              </span>
            </div>
            <div className="text-center p-4 bg-[#0a0a0a] rounded-lg">
              <span className="text-xs text-gray-500 block mb-2">Monto Total</span>
              <span className="text-2xl font-black text-[#D4B896]">
                {formatearMoneda(compras.reduce((sum, c) => sum + parseFloat(c.total || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}