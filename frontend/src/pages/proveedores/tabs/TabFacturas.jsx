import { useState, useEffect } from "react";
import { proveedoresService } from "../../../services/proveedoresService";
import { facturasCompraService } from "../../../services/facturasCompraService";
import toast from "react-hot-toast";

export default function TabFacturas({ proveedorId }) {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaInicio: "",
    fechaFin: "",
    estado: "todas"
  });
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  useEffect(() => {
    cargarFacturas();
  }, [proveedorId]);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const data = await proveedoresService.getCompras(
        proveedorId,
        filtros.fechaInicio,
        filtros.fechaFin
      );
      setFacturas(data.compras || []);
    } catch (error) {
      console.error("Error al cargar facturas:", error);
      toast.error("Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    cargarFacturas();
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: "",
      fechaFin: "",
      estado: "todas"
    });
    cargarFacturas();
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
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

  const facturasFiltradas = facturas.filter(f => {
    if (filtros.estado === "todas") return true;
    return f.estado === filtros.estado;
  });

const descargarPDF = async (factura) => {
    try {
      if (factura.factura_pdf_url) {
        await facturasCompraService.descargarPDF(factura.id);
        toast.success("PDF descargado exitosamente");
      } else {
        toast.loading("Generando PDF...", { id: "gen-pdf" });
        await facturasCompraService.generarPDF(factura.id);
        toast.success("PDF generado", { id: "gen-pdf" });
        
        await facturasCompraService.descargarPDF(factura.id);
        toast.success("PDF descargado");
        
        cargarFacturas();
      }
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      toast.error("Error al descargar PDF: " + (error.response?.data?.error || error.message));
    }
  };

  const imprimirFactura = async (factura) => {
    try {
      if (!factura.factura_pdf_url) {
        toast.loading("Generando PDF para imprimir...", { id: "gen-pdf-print" });
        await facturasCompraService.generarPDF(factura.id);
        toast.success("PDF generado", { id: "gen-pdf-print" });
        cargarFacturas();
      }
      
      const pdfURL = facturasCompraService.obtenerURLPDF(factura.id);
      const printWindow = window.open(pdfURL, '_blank');
      
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      } else {
        toast.error("Por favor, permite ventanas emergentes para imprimir");
      }
    } catch (error) {
      console.error("Error al imprimir factura:", error);
      toast.error("Error al imprimir: " + (error.response?.data?.error || error.message));
    }
  };

  const verDetalle = (factura) => {
    setFacturaSeleccionada(factura);
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
      {/* Filtros */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#D4B896] transition"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#D4B896] transition"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-2">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-[#D4B896] transition"
            >
              <option value="todas">Todas</option>
              <option value="pendiente">Pendiente</option>
              <option value="recibida">Recibida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={aplicarFiltros}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] rounded-lg font-bold hover:shadow-lg hover:shadow-[#D4B896]/30 transition"
            >
              Aplicar
            </button>
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-[#2a2a2a] text-gray-400 rounded-lg hover:bg-[#3a3a3a] transition"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <span className="text-xs text-gray-500">Total Facturas</span>
          <p className="text-2xl font-black text-white mt-1">{facturasFiltradas.length}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <span className="text-xs text-gray-500">Facturas Recibidas</span>
          <p className="text-2xl font-black text-green-400 mt-1">
            {facturasFiltradas.filter(f => f.estado === 'recibida').length}
          </p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
          <span className="text-xs text-gray-500">Monto Total</span>
          <p className="text-2xl font-black text-[#D4B896] mt-1">
            {formatearMoneda(facturasFiltradas.reduce((sum, f) => sum + parseFloat(f.total || 0), 0))}
          </p>
        </div>
      </div>

      {/* Lista de Facturas */}
      {facturasFiltradas.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
          <span className="text-6xl mb-4 block">🧾</span>
          <p className="text-gray-400 text-lg">No hay facturas registradas</p>
          <p className="text-gray-600 text-sm mt-2">Las facturas de compra aparecerán aquí</p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    N° Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    N° Compra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    IVA
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {facturasFiltradas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-[#0a0a0a] transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatearFecha(factura.fecha_factura || factura.fecha_compra)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                      {factura.numero_factura || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                      {factura.numero_compra}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded-full
                        ${factura.estado === 'recibida' 
                          ? 'bg-green-500/10 text-green-400' 
                          : factura.estado === 'pendiente'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-red-500/10 text-red-400'
                        }
                      `}>
                        {factura.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                      {formatearMoneda(factura.subtotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-400">
                      {formatearMoneda(factura.impuestos)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#D4B896] font-bold">
                      {formatearMoneda(factura.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {factura.factura_pdf_url && (
                          <span className="text-green-400" title="PDF generado">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                              <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                            </svg>
                          </span>
                        )}
                        
                        <button
                          onClick={() => verDetalle(factura)}
                          className="p-2 text-gray-400 hover:text-[#D4B896] hover:bg-[#2a2a2a] rounded-lg transition"
                          title="Ver detalle"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => descargarPDF(factura)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-[#2a2a2a] rounded-lg transition"
                          title={factura.factura_pdf_url ? "Descargar PDF" : "Generar y descargar PDF"}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => imprimirFactura(factura)}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-[#2a2a2a] rounded-lg transition"
                          title="Imprimir"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Factura */}
      {facturaSeleccionada && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#2a2a2a] p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Detalle de Factura</h3>
                <p className="text-sm text-gray-400 font-mono mt-1">
                  {facturaSeleccionada.numero_factura || facturaSeleccionada.numero_compra}
                </p>
              </div>
              <button
                onClick={() => setFacturaSeleccionada(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Fecha de Factura</span>
                  <p className="text-white font-medium">
                    {formatearFecha(facturaSeleccionada.fecha_factura || facturaSeleccionada.fecha_compra)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Estado</span>
                  <p>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${facturaSeleccionada.estado === 'recibida' 
                        ? 'bg-green-500/10 text-green-400' 
                        : facturaSeleccionada.estado === 'pendiente'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-red-500/10 text-red-400'
                      }
                    `}>
                      {facturaSeleccionada.estado}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white font-medium">{formatearMoneda(facturaSeleccionada.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">IVA ({facturaSeleccionada.iva_porcentaje}%)</span>
                    <span className="text-white font-medium">{formatearMoneda(facturaSeleccionada.impuestos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Descuento</span>
                    <span className="text-white font-medium">{formatearMoneda(facturaSeleccionada.descuento)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#2a2a2a]">
                    <span className="text-white font-bold text-lg">Total</span>
                    <span className="text-[#D4B896] font-black text-2xl">{formatearMoneda(facturaSeleccionada.total)}</span>
                  </div>
                </div>
              </div>

              {facturaSeleccionada.observaciones && (
                <div className="border-t border-[#2a2a2a] pt-4">
                  <span className="text-xs text-gray-500">Observaciones</span>
                  <p className="text-white mt-1">{facturaSeleccionada.observaciones}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => descargarPDF(facturaSeleccionada)}
                  className="flex-1 px-4 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg font-bold hover:bg-blue-500/20 transition"
                >
                  📥 Descargar PDF
                </button>
                <button
                  onClick={() => imprimirFactura(facturaSeleccionada)}
                  className="flex-1 px-4 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg font-bold hover:bg-green-500/20 transition"
                >
                  🖨️ Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}