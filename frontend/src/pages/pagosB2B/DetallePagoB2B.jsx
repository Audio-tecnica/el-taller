    import { useState } from 'react';
import pagosB2BService from '../../services/pagosB2BService';

export default function DetallePagoB2B({ pago, onClose, onActualizar }) {
  const [anulando, setAnulando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) {
      alert('Por favor ingrese un motivo de anulación');
      return;
    }

    try {
      setAnulando(true);
      await pagosB2BService.anularPago(pago.id, motivoAnulacion);
      alert('Pago anulado exitosamente');
      onActualizar();
      onClose();
    } catch (error) {
      console.error('Error al anular pago:', error);
      alert(error.response?.data?.error || 'Error al anular el pago');
    } finally {
      setAnulando(false);
    }
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Aplicado': 'bg-green-100 text-green-800',
      'Anulado': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Recibo {pago.numero_recibo}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatearFecha(pago.fecha_pago)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(pago.estado)}`}>
              {pago.estado}
            </span>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del Pago */}
          <section className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Información del Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Monto Pagado</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatearMoneda(pago.monto)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Método de Pago</div>
                <div className="text-xl font-semibold text-gray-900">
                  {pago.metodo_pago}
                </div>
              </div>
              {pago.referencia_pago && (
                <div>
                  <div className="text-sm text-gray-600">Referencia</div>
                  <div className="font-semibold text-gray-900">{pago.referencia_pago}</div>
                </div>
              )}
              {pago.banco && (
                <div>
                  <div className="text-sm text-gray-600">Banco</div>
                  <div className="font-semibold text-gray-900">{pago.banco}</div>
                </div>
              )}
            </div>
          </section>

          {/* Información del Cliente */}
          <section className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Razón Social</div>
                <div className="font-semibold text-gray-900">
                  {pago.venta?.cliente?.razon_social || pago.cliente?.razon_social}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Documento</div>
                <div className="font-semibold text-gray-900">
                  {pago.venta?.cliente?.numero_documento || pago.cliente?.numero_documento}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Contacto</div>
                <div className="font-semibold text-gray-900">
                  {pago.venta?.cliente?.nombre_contacto || pago.cliente?.nombre_contacto}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Teléfono</div>
                <div className="font-semibold text-gray-900">
                  {pago.venta?.cliente?.telefono || pago.cliente?.telefono}
                </div>
              </div>
            </div>
          </section>

          {/* Información de la Factura */}
          {pago.venta && (
            <section className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Factura Asociada</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Número Factura</div>
                  <div className="font-semibold text-gray-900">{pago.venta.numero_factura}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Factura</div>
                  <div className="font-semibold text-gray-900">
                    {formatearMoneda(pago.venta.total)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Saldo Pendiente</div>
                  <div className="font-semibold text-orange-600">
                    {formatearMoneda(pago.venta.saldo_pendiente)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Estado Factura</div>
                  <div className="font-semibold text-gray-900">{pago.venta.estado_pago}</div>
                </div>
              </div>
            </section>
          )}

          {/* Receptor del Pago */}
          {pago.receptor && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Recibido por</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#D4B896] rounded-full flex items-center justify-center">
                    <span className="text-xl text-white">👤</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{pago.receptor.nombre}</div>
                    <div className="text-sm text-gray-600">{pago.receptor.email}</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Notas */}
          {pago.notas && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Notas</h3>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                {pago.notas}
              </div>
            </section>
          )}

          {/* Información de Anulación */}
          {pago.estado === 'Anulado' && pago.motivo_anulacion && (
            <section className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Motivo de Anulación</h3>
              <p className="text-gray-700 mb-2">{pago.motivo_anulacion}</p>
              <div className="text-sm text-gray-500">
                Anulado el {formatearFecha(pago.fecha_anulacion)}
                {pago.anulador && ` por ${pago.anulador.nombre}`}
              </div>
            </section>
          )}

          {/* Botones de Acción */}
          <section className="flex justify-between pt-4 border-t border-gray-200">
            <div>
              {pago.estado !== 'Anulado' && (
                <button
                  onClick={() => setMostrarConfirmacion(true)}
                  className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                >
                  Anular Pago
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cerrar
            </button>
          </section>
        </div>

        {/* Modal de Confirmación de Anulación */}
        {mostrarConfirmacion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                ¿Confirmar Anulación?
              </h3>
              <p className="text-gray-600 mb-4">
                Esta acción no se puede deshacer. Se revertirá el pago en la factura y el crédito del cliente.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de anulación *
                </label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="Ingrese el motivo..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setMostrarConfirmacion(false);
                    setMotivoAnulacion('');
                  }}
                  disabled={anulando}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAnular}
                  disabled={anulando || !motivoAnulacion.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {anulando ? 'Anulando...' : 'Anular Pago'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}