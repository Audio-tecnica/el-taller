import { useState, useEffect } from 'react';
import pagosB2BService from '../../services/pagosB2BService';
import FormularioPagoB2B from './FormularioPagoB2B';
import DetallePagoB2B from './DetallePagoB2B';

export default function PagosB2B() {
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState({
    totalPagos: 0,
    cantidadPagos: 0,
    porMetodo: []
  });
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  
  const [filtros, setFiltros] = useState({
    metodo_pago: '',
    estado: 'Aplicado',
    pagina: 1,
    limite: 20
  });

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [pagosData, resumenData] = await Promise.all([
        pagosB2BService.obtenerPagos(filtros),
        pagosB2BService.obtenerResumenPagos()
      ]);
      setPagos(pagosData.pagos || []);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleVerDetalle = async (pago) => {
    try {
      const pagoCompleto = await pagosB2BService.obtenerPagoPorId(pago.id);
      setPagoSeleccionado(pagoCompleto);
      setMostrarDetalle(true);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      alert('Error al cargar detalle del pago');
    }
  };

  const handleNuevoPago = () => {
    setMostrarFormulario(true);
  };

  const handlePagoCreado = () => {
    setMostrarFormulario(false);
    cargarDatos();
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Aplicado': 'bg-green-100 text-green-800',
      'Anulado': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Cargando pagos...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Pagos B2B</h1>
        <p className="text-gray-600">Registro de pagos y cartera</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Total Cobrado</div>
          <div className="text-2xl font-bold text-green-600">
            {formatearMoneda(resumen.totalPagos)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {resumen.cantidadPagos} pagos
          </div>
        </div>

        {resumen.porMetodo?.map((metodo, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">{metodo.metodo}</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatearMoneda(metodo.total)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {metodo.cantidad} pagos
            </div>
          </div>
        ))}
      </div>

      {/* Filtros y Acciones */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4">
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value, pagina: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
            >
              <option value="Aplicado">Aplicados</option>
              <option value="Anulado">Anulados</option>
              <option value="">Todos</option>
            </select>

            <select
              value={filtros.metodo_pago}
              onChange={(e) => setFiltros({ ...filtros, metodo_pago: e.target.value, pagina: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">Todos los métodos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Cheque">Cheque</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>

          <button
            onClick={handleNuevoPago}
            className="px-6 py-2 bg-[#D4B896] text-black font-semibold rounded-lg hover:bg-[#c4a886] transition whitespace-nowrap"
          >
            + Registrar Pago
          </button>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recibo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-lg">No hay pagos registrados</div>
                    <button
                      onClick={handleNuevoPago}
                      className="mt-4 text-[#D4B896] hover:text-[#c4a886] font-semibold"
                    >
                      Registrar primer pago
                    </button>
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {pago.numero_recibo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {pago.cliente?.razon_social}
                      </div>
                      <div className="text-xs text-gray-500">
                        {pago.cliente?.numero_documento}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pago.venta?.numero_factura}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatearFecha(pago.fecha_pago)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pago.metodo_pago}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatearMoneda(pago.monto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(pago.estado)}`}>
                        {pago.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleVerDetalle(pago)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {mostrarFormulario && (
        <FormularioPagoB2B
          onClose={() => setMostrarFormulario(false)}
          onGuardar={handlePagoCreado}
        />
      )}

      {mostrarDetalle && pagoSeleccionado && (
        <DetallePagoB2B
          pago={pagoSeleccionado}
          onClose={() => {
            setMostrarDetalle(false);
            setPagoSeleccionado(null);
          }}
          onActualizar={cargarDatos}
        />
      )}
    </div>
  );
}