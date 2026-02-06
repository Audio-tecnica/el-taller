import { useState } from "react";
import ventasB2BService from "../../services/ventasB2BService";

export default function DetalleVentaB2B({ venta, onClose, onActualizar }) {
  const [anulando, setAnulando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) {
      alert("Por favor ingrese un motivo de anulación");
      return;
    }

    try {
      setAnulando(true);
      await ventasB2BService.anularVenta(venta.id, motivoAnulacion);
      alert("Factura anulada exitosamente");
      onActualizar();
      onClose();
    } catch (error) {
      console.error("Error al anular venta:", error);
      alert(error.response?.data?.error || "Error al anular la factura");
    } finally {
      setAnulando(false);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoColor = (estado) => {
    const colores = {
      Pagado: "bg-green-100 text-green-800",
      Pendiente: "bg-yellow-100 text-yellow-800",
      Parcial: "bg-orange-100 text-orange-800",
      Vencido: "bg-red-100 text-red-800",
      Anulado: "bg-gray-100 text-gray-800",
    };
    return colores[estado] || "bg-gray-100 text-gray-800";
  };

  const handleImprimir = () => {
    window.print();
  };

  const calcularSubtotalItem = (item) => {
    return item.cantidad * item.precio_unitario;
  };

  const calcularDescuentoItem = (item) => {
    const subtotal = calcularSubtotalItem(item);
    return subtotal * (item.descuento_porcentaje / 100);
  };

  const calcularTotalItem = (item) => {
    return calcularSubtotalItem(item) - calcularDescuentoItem(item);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Factura {venta.numero_factura}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatearFecha(venta.fecha_venta)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(venta.estado_pago)}`}
            >
              {venta.estado_pago}
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
          {/* Información del Cliente */}
          <section className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Razón Social</div>
                <div className="font-semibold text-gray-900">
                  {venta.cliente?.razon_social}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Documento</div>
                <div className="font-semibold text-gray-900">
                  {venta.cliente?.numero_documento}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Contacto</div>
                <div className="font-semibold text-gray-900">
                  {venta.cliente?.nombre_contacto}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Teléfono</div>
                <div className="font-semibold text-gray-900">
                  {venta.cliente?.telefono}
                </div>
              </div>
            </div>
          </section>

          {/* Información de la Venta */}
          <section className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Detalles de la Venta
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Método de Pago</div>
                <div className="font-semibold text-gray-900">
                  {venta.metodo_pago}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Vendedor</div>
                <div className="font-semibold text-gray-900">
                  {venta.vendedor?.nombre || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Local</div>
                <div className="font-semibold text-gray-900">
                  {venta.local?.nombre || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Días de Crédito</div>
                <div className="font-semibold text-gray-900">
                  {venta.cliente?.dias_credito || 0} días
                </div>
              </div>
            </div>

            {venta.metodo_pago === "Credito" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
                <div>
                  <div className="text-sm text-gray-600">Fecha Vencimiento</div>
                  <div className="font-semibold text-gray-900">
                    {formatearFecha(venta.fecha_vencimiento)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Días de Mora</div>
                  <div
                    className={`font-semibold ${venta.dias_mora > 0 ? "text-red-600" : "text-gray-900"}`}
                  >
                    {venta.dias_mora} días
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">
                    Fecha Pago Completo
                  </div>
                  <div className="font-semibold text-gray-900">
                    {venta.fecha_pago_completo
                      ? formatearFecha(venta.fecha_pago_completo)
                      : "Pendiente"}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Items de la Venta */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Productos
            </h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Desc %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {venta.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.nombre_producto}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatearMoneda(item.precio_unitario)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {item.cantidad}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatearMoneda(calcularSubtotalItem(item))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-orange-600">
                        {item.descuento_porcentaje}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatearMoneda(calcularTotalItem(item))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Totales */}
          <section className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    {formatearMoneda(venta.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Descuento:</span>
                  <span className="font-semibold text-orange-600">
                    -{formatearMoneda(venta.descuento)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>IVA:</span>
                  <span className="font-semibold">
                    {formatearMoneda(venta.iva)}
                  </span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-gray-900 border-t border-gray-300 pt-3">
                  <span>Total:</span>
                  <span>{formatearMoneda(venta.total)}</span>
                </div>

                {venta.metodo_pago === "Credito" && (
                  <>
                    <div className="flex justify-between text-lg text-gray-700 border-t border-gray-200 pt-3">
                      <span>Monto Pagado:</span>
                      <span className="font-semibold text-green-600">
                        {formatearMoneda(venta.monto_pagado)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-orange-600">
                      <span>Saldo Pendiente:</span>
                      <span>{formatearMoneda(venta.saldo_pendiente)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Notas */}
          {venta.notas && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Notas
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                {venta.notas}
              </div>
            </section>
          )}

          {/* Información de Anulación */}
          {venta.estado_pago === "Anulado" && venta.observaciones_anulacion && (
            <section className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Motivo de Anulación
              </h3>
              <p className="text-gray-700">{venta.observaciones_anulacion}</p>
              <p className="text-sm text-gray-500 mt-2">
                Anulado el {formatearFecha(venta.fecha_anulacion)}
              </p>
            </section>
          )}

          {/* Botones de Acción */}
          <section className="flex justify-between pt-4 border-t border-gray-200">
            <div>
              {venta.estado_pago !== "Anulado" && (
                <button
                  onClick={() => setMostrarConfirmacion(true)}
                  className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                >
                  Anular Factura
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleImprimir}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition no-imprimir"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition no-imprimir"
              >
                Cerrar
              </button>
              {venta.estado_pago !== "Anulado" &&
                venta.estado_pago !== "Pagado" && (
                  <button
                    onClick={() => {
                      // Redirigir a la página de pagos con la venta preseleccionada
                      window.location.href = `/pagos-b2b?venta_id=${venta.id}`;
                    }}
                    className="px-6 py-2 bg-[#D4B896] text-black font-semibold rounded-lg hover:bg-[#c4a886] transition"
                  >
                    💰 Registrar Pago
                  </button>
                )}
            </div>
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
                Esta acción no se puede deshacer. Se revertirá el inventario y
                el crédito del cliente.
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
                    setMotivoAnulacion("");
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
                  {anulando ? "Anulando..." : "Anular Factura"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
