import { useState, useEffect } from 'react';
import ventasB2BService from '../../services/ventasB2BService';
import FormularioVentaB2B from './FormularioVentaB2B';
import DetalleVentaB2B from './DetalleVentaB2B';

export default function VentasB2B() {
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    totalPendiente: 0,
    totalCobrado: 0,
    cantidadVentas: 0,
    ventasCredito: 0
  });
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    estado_pago: '',
    pagina: 1,
    limite: 20
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [ventasData, resumenData] = await Promise.all([
        ventasB2BService.obtenerVentas(filtros),
        ventasB2BService.obtenerResumenVentas()
      ]);
      setVentas(ventasData.ventas || []);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleVerDetalle = async (venta) => {
    try {
      const ventaCompleta = await ventasB2BService.obtenerVentaPorId(venta.id);
      setVentaSeleccionada(ventaCompleta);
      setMostrarDetalle(true);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      alert('Error al cargar detalle de la venta');
    }
  };

  const handleNuevaVenta = () => {
    setMostrarFormulario(true);
  };

  const handleVentaCreada = () => {
    setMostrarFormulario(false);
    cargarDatos();
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Pagado': 'bg-green-100 text-green-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Parcial': 'bg-orange-100 text-orange-800',
      'Vencido': 'bg-red-100 text-red-800',
      'Anulado': 'bg-gray-100 text-gray-800'
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
      day: 'numeric'
    });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Cargando ventas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Ventas B2B</h1>
        <p className="text-gray-600">Gestión de facturas corporativas</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Total Ventas</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatearMoneda(resumen.totalVentas)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {resumen.cantidadVentas} facturas
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">Por Cobrar</div>
          <div className="text-2xl font-bold text-orange-600">
            {formatearMoneda(resumen.totalPendiente)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Pendiente</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Cobrado</div>
          <div className="text-2xl font-bold text-green-600">
            {formatearMoneda(resumen.totalCobrado)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Pagado</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">A Crédito</div>
          <div className="text-2xl font-bold text-purple-600">
            {resumen.ventasCredito || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Facturas</div>
        </div>
      </div>

      {/* Filtros y Acciones */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4">
            <select
              value={filtros.estado_pago}
              onChange={(e) => setFiltros({ ...filtros, estado_pago: e.target.value, pagina: 1 })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="Pagado">Pagado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Parcial">Parcial</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>

          <button
            onClick={handleNuevaVenta}
            className="px-6 py-2 bg-[#D4B896] text-black font-semibold rounded-lg hover:bg-[#c4a886] transition whitespace-nowrap"
          >
            + Nueva Factura
          </button>
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo
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
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-lg">No hay ventas registradas</div>
                    <button
                      onClick={handleNuevaVenta}
                      className="mt-4 text-[#D4B896] hover:text-[#c4a886] font-semibold"
                    >
                      Crear primera factura
                    </button>
                  </td>
                </tr>
              ) : (
                ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {venta.numero_factura}
                      </div>
                      <div className="text-xs text-gray-500">
                        {venta.metodo_pago}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {venta.cliente?.razon_social}
                      </div>
                      <div className="text-xs text-gray-500">
                        {venta.cliente?.numero_documento}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatearFecha(venta.fecha_venta)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatearMoneda(venta.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatearMoneda(venta.monto_pagado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                      {formatearMoneda(venta.saldo_pendiente)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(venta.estado_pago)}`}>
                        {venta.estado_pago}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleVerDetalle(venta)}
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
        <FormularioVentaB2B
          onClose={() => setMostrarFormulario(false)}
          onGuardar={handleVentaCreada}
        />
      )}

      {mostrarDetalle && ventaSeleccionada && (
        <DetalleVentaB2B
          venta={ventaSeleccionada}
          onClose={() => {
            setMostrarDetalle(false);
            setVentaSeleccionada(null);
          }}
          onActualizar={cargarDatos}
        />
      )}
    </div>
  );
}