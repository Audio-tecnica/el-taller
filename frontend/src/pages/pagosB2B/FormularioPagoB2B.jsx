import { useState, useEffect } from 'react';
import ventasB2BService from '../../services/ventasB2BService';
import clientesB2BService from '../../services/clientesB2BService';
import pagosB2BService from '../../services/pagosB2BService';

export default function FormularioPagoB2B({ onClose, onGuardar }) {
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    cliente_b2b_id: '',
    venta_b2b_id: '',
    monto: '',
    metodo_pago: 'Efectivo',
    referencia_pago: '',
    banco: '',
    notas: ''
  });

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (formData.cliente_b2b_id) {
      cargarVentasPendientes();
    } else {
      setVentas([]);
      setVentaSeleccionada(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cliente_b2b_id]);

  useEffect(() => {
    if (formData.venta_b2b_id) {
      const venta = ventas.find(v => v.id === formData.venta_b2b_id);
      setVentaSeleccionada(venta);
      if (venta) {
        setFormData(prev => ({ ...prev, monto: venta.saldo_pendiente }));
      }
    } else {
      setVentaSeleccionada(null);
      setFormData(prev => ({ ...prev, monto: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.venta_b2b_id]);

  const cargarClientes = async () => {
    try {
      const response = await clientesB2BService.obtenerClientes({ 
        estado: 'Activo',
        limite: 100 
      });
      setClientes(response.clientes || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const cargarVentasPendientes = async () => {
    try {
      // Hacer 3 llamadas separadas para cada estado
      const [pendientes, parciales, vencidas] = await Promise.all([
        ventasB2BService.obtenerVentas({
          cliente_id: formData.cliente_b2b_id,
          estado_pago: 'Pendiente',
          limite: 50
        }),
        ventasB2BService.obtenerVentas({
          cliente_id: formData.cliente_b2b_id,
          estado_pago: 'Parcial',
          limite: 50
        }),
        ventasB2BService.obtenerVentas({
          cliente_id: formData.cliente_b2b_id,
          estado_pago: 'Vencido',
          limite: 50
        })
      ]);

      // Combinar todas las ventas
      const todasLasVentas = [
        ...(pendientes.ventas || []),
        ...(parciales.ventas || []),
        ...(vencidas.ventas || [])
      ];

      // Ordenar por fecha de vencimiento (las más próximas primero)
      todasLasVentas.sort((a, b) => 
        new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento)
      );

      setVentas(todasLasVentas);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setVentas([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.venta_b2b_id) {
      alert('Por favor seleccione una factura');
      return;
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    if (parseFloat(formData.monto) > parseFloat(ventaSeleccionada.saldo_pendiente)) {
      alert('El monto no puede ser mayor al saldo pendiente');
      return;
    }

    try {
      setGuardando(true);
      
      await pagosB2BService.registrarPago({
        venta_b2b_id: formData.venta_b2b_id,
        monto: parseFloat(formData.monto),
        metodo_pago: formData.metodo_pago,
        referencia_pago: formData.referencia_pago || null,
        banco: formData.banco || null,
        notas: formData.notas || null
      });

      onGuardar();
      onClose();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      alert(error.response?.data?.error || 'Error al registrar el pago');
    } finally {
      setGuardando(false);
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
      day: 'numeric'
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-800">Registrar Pago B2B</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selección de Cliente */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              value={formData.cliente_b2b_id}
              onChange={(e) => setFormData({ ...formData, cliente_b2b_id: e.target.value, venta_b2b_id: '' })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.razon_social} - {cliente.numero_documento}
                </option>
              ))}
            </select>
          </section>

          {/* Selección de Factura */}
          {formData.cliente_b2b_id && (
            <section>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Factura a Pagar *
              </label>
              {ventas.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  Este cliente no tiene facturas pendientes de pago.
                </div>
              ) : (
                <select
                  value={formData.venta_b2b_id}
                  onChange={(e) => setFormData({ ...formData, venta_b2b_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Seleccione una factura</option>
                  {ventas.map(venta => (
                    <option key={venta.id} value={venta.id}>
                      {venta.numero_factura} - Saldo: {formatearMoneda(venta.saldo_pendiente)} - Vence: {formatearFecha(venta.fecha_vencimiento)}
                    </option>
                  ))}
                </select>
              )}
            </section>
          )}

          {/* Info de la Factura Seleccionada */}
          {ventaSeleccionada && (
            <section className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Información de la Factura</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Factura:</span>
                  <div className="font-semibold text-gray-900">{formatearMoneda(ventaSeleccionada.total)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Monto Pagado:</span>
                  <div className="font-semibold text-green-600">{formatearMoneda(ventaSeleccionada.monto_pagado)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Saldo Pendiente:</span>
                  <div className="font-semibold text-orange-600">{formatearMoneda(ventaSeleccionada.saldo_pendiente)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <div className={`font-semibold ${ventaSeleccionada.estado_pago === 'Vencido' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {ventaSeleccionada.estado_pago}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Monto del Pago */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto del Pago *
            </label>
            <input
              type="number"
              value={formData.monto}
              onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              disabled={!ventaSeleccionada}
              required
              min="0"
              step="1"
              max={ventaSeleccionada?.saldo_pendiente || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
              placeholder="0"
            />
            {ventaSeleccionada && (
              <p className="text-xs text-gray-500 mt-1">
                Máximo: {formatearMoneda(ventaSeleccionada.saldo_pendiente)}
              </p>
            )}
          </section>

          {/* Método de Pago */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago *
            </label>
            <select
              value={formData.metodo_pago}
              onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Cheque">Cheque</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </section>

          {/* Referencia y Banco (si aplica) */}
          {['Transferencia', 'Cheque', 'Tarjeta'].includes(formData.metodo_pago) && (
            <>
              <section>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia / Número {formData.metodo_pago === 'Cheque' ? 'de Cheque' : 'de Transacción'}
                </label>
                <input
                  type="text"
                  value={formData.referencia_pago}
                  onChange={(e) => setFormData({ ...formData, referencia_pago: e.target.value })}
                  placeholder="Ej: 1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
                />
              </section>

              <section>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <input
                  type="text"
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                  placeholder="Nombre del banco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
                />
              </section>
            </>
          )}

          {/* Notas */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas / Observaciones
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows="3"
              placeholder="Información adicional del pago..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white resize-none"
            />
          </section>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !ventaSeleccionada}
              className="px-6 py-2 bg-[#D4B896] text-black font-semibold rounded-lg hover:bg-[#c4a886] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}