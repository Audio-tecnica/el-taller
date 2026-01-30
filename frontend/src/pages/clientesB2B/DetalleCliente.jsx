import { useState, useEffect } from 'react';
import clientesB2BService from '../../services/clientesB2BService';

export default function DetalleCliente({ clienteId, onClose, onEditar }) {
  const [cliente, setCliente] = useState(null);
  const [estadoCuenta, setEstadoCuenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState('info'); // 'info', 'cuenta', 'historial'

  useEffect(() => {
    cargarDatos();
  }, [clienteId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [clienteData, cuentaData] = await Promise.all([
        clientesB2BService.obtenerClientePorId(clienteId),
        clientesB2BService.obtenerEstadoCuenta(clienteId)
      ]);
      
      setCliente(clienteData);
      setEstadoCuenta(cuentaData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoPagoBadge = (estado) => {
    const colores = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Parcial': 'bg-blue-100 text-blue-800',
      'Pagado': 'bg-green-100 text-green-800',
      'Vencido': 'bg-red-100 text-red-800',
      'Anulado': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colores[estado]}`}>
        {estado}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-xl text-gray-600">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D4B896] to-[#c4a886] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black">{cliente.razon_social}</h2>
            <p className="text-sm text-black opacity-80">
              {cliente.tipo_documento}: {cliente.numero_documento}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-gray-700 text-3xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setTabActiva('info')}
              className={`px-6 py-3 font-medium border-b-2 ${
                tabActiva === 'info'
                  ? 'border-[#D4B896] text-[#D4B896]'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Información
            </button>
            <button
              onClick={() => setTabActiva('cuenta')}
              className={`px-6 py-3 font-medium border-b-2 ${
                tabActiva === 'cuenta'
                  ? 'border-[#D4B896] text-[#D4B896]'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Estado de Cuenta
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab Información */}
          {tabActiva === 'info' && (
            <div className="space-y-6">
              {/* Resumen de Crédito */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Límite de Crédito</div>
                  <div className="text-2xl font-bold text-blue-800">
                    {formatearMoneda(cliente.limite_credito)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Crédito Disponible</div>
                  <div className="text-2xl font-bold text-green-800">
                    {formatearMoneda(cliente.credito_disponible)}
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Días de Crédito</div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {cliente.dias_credito} días
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Contacto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Nombre</div>
                    <div className="font-medium">{cliente.nombre_contacto}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Cargo</div>
                    <div className="font-medium">{cliente.cargo_contacto || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium">{cliente.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Teléfono</div>
                    <div className="font-medium">{cliente.telefono}</div>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Dirección</h3>
                <div className="space-y-2">
                  <div>{cliente.direccion}</div>
                  <div>{cliente.ciudad}, {cliente.departamento}</div>
                </div>
              </div>

              {/* Estadísticas */}
              {cliente.estadisticas && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Estadísticas</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Total Ventas</div>
                      <div className="font-bold text-lg">
                        {formatearMoneda(cliente.total_ventas)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Facturas</div>
                      <div className="font-bold text-lg">{cliente.total_facturas}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Última Compra</div>
                      <div className="font-medium">
                        {cliente.ultima_compra ? formatearFecha(cliente.ultima_compra) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              {cliente.notas && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Notas</h3>
                  <div className="text-gray-700 whitespace-pre-wrap">{cliente.notas}</div>
                </div>
              )}
            </div>
          )}

          {/* Tab Estado de Cuenta */}
          {tabActiva === 'cuenta' && estadoCuenta && (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Pendiente</div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {formatearMoneda(estadoCuenta.resumen.totalPendiente)}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {estadoCuenta.resumen.facturasPendientes} facturas pendientes
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Vencido</div>
                  <div className="text-2xl font-bold text-red-800">
                    {formatearMoneda(estadoCuenta.resumen.totalVencido)}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {estadoCuenta.resumen.facturasVencidas} facturas vencidas
                  </div>
                </div>
              </div>

              {/* Facturas Pendientes */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Facturas Pendientes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Factura</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Fecha</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Vencimiento</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Total</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Pagado</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Saldo</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {estadoCuenta.facturasPendientes.map((factura) => (
                        <tr key={factura.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{factura.numero_factura}</td>
                          <td className="px-4 py-2 text-sm">{formatearFecha(factura.fecha_venta)}</td>
                          <td className="px-4 py-2 text-sm">{formatearFecha(factura.fecha_vencimiento)}</td>
                          <td className="px-4 py-2 text-right">{formatearMoneda(factura.total)}</td>
                          <td className="px-4 py-2 text-right">{formatearMoneda(factura.monto_pagado)}</td>
                          <td className="px-4 py-2 text-right font-semibold">
                            {formatearMoneda(factura.saldo_pendiente)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {getEstadoPagoBadge(factura.estado_pago)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagos Recientes */}
              {estadoCuenta.pagosRecientes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Pagos Recientes</h3>
                  <div className="space-y-2">
                    {estadoCuenta.pagosRecientes.map((pago) => (
                      <div key={pago.id} className="bg-green-50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-medium">Recibo: {pago.numero_recibo}</div>
                          <div className="text-sm text-gray-600">
                            Factura: {pago.venta.numero_factura} - {formatearFecha(pago.fecha_pago)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-800">{formatearMoneda(pago.monto)}</div>
                          <div className="text-xs text-gray-600">{pago.metodo_pago}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cerrar
          </button>
          <button
            onClick={() => onEditar(cliente)}
            className="px-6 py-2 bg-[#D4B896] text-black font-semibold rounded-lg hover:bg-[#c4a886] transition"
          >
            Editar Cliente
          </button>
        </div>
      </div>
    </div>
  );
}
