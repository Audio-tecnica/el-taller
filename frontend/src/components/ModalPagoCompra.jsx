import { useState } from 'react';
import { pagosComprasService } from '../services/pagosComprasService';
import toast from 'react-hot-toast';

export default function ModalPagoCompra({ compra, onClose, onPagoRegistrado }) {
  const [loading, setLoading] = useState(false);
  const [pago, setPago] = useState({
    monto: parseFloat(compra?.saldo_pendiente) || 0,
    metodo_pago: 'efectivo',
    numero_referencia: '',
    observaciones: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const montoNumerico = parseFloat(pago.monto);
    const saldoPendiente = parseFloat(compra.saldo_pendiente);

    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }

    if (montoNumerico > saldoPendiente) {
      toast.error('El monto no puede ser mayor al saldo pendiente');
      return;
    }

    try {
      setLoading(true);
      await pagosComprasService.registrarPago(compra.id, {
        monto_pago: montoNumerico,
        forma_pago: pago.metodo_pago,
        numero_referencia: pago.numero_referencia,
        observaciones: pago.observaciones
      });
      
      toast.success('Pago registrado exitosamente');
      onPagoRegistrado();
      onClose();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error(error.response?.data?.error || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  if (!compra) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#D4B896]/20 max-w-md w-full">
        {/* Header */}
        <div className="border-b border-[#2a2a2a] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Registrar Pago</h2>
              <p className="text-sm text-gray-500 mt-1">
                Compra #{compra.numero_compra}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Info de la compra */}
        <div className="p-6 bg-[#0f0f0f] border-b border-[#2a2a2a]">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Compra</p>
              <p className="text-white font-semibold">{formatCurrency(compra.total)}</p>
            </div>
            <div>
              <p className="text-gray-500">Pagado</p>
              <p className="text-emerald-400 font-semibold">{formatCurrency(compra.monto_pagado)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Saldo Pendiente</p>
              <p className="text-[#D4B896] font-bold text-xl">{formatCurrency(compra.saldo_pendiente)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Monto a Pagar *
            </label>
            <input
              type="number"
              value={pago.monto}
              onChange={(e) => setPago({ ...pago, monto: e.target.value })}
              step="0.01"
              max={compra.saldo_pendiente}
              required
              className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:border-[#D4B896] focus:outline-none transition"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo: {formatCurrency(compra.saldo_pendiente)}
            </p>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Método de Pago *
            </label>
            <select
              value={pago.metodo_pago}
              onChange={(e) => setPago({ ...pago, metodo_pago: e.target.value })}
              required
              className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:border-[#D4B896] focus:outline-none transition"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta_debito">Tarjeta Débito</option>
              <option value="tarjeta_credito">Tarjeta Crédito</option>
            </select>
          </div>

          {/* Número de referencia (opcional) */}
          {pago.metodo_pago !== 'efectivo' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Número de Referencia
              </label>
              <input
                type="text"
                value={pago.numero_referencia}
                onChange={(e) => setPago({ ...pago, numero_referencia: e.target.value })}
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:border-[#D4B896] focus:outline-none transition"
                placeholder="Número de transacción, cheque, etc."
              />
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Observaciones
            </label>
            <textarea
              value={pago.observaciones}
              onChange={(e) => setPago({ ...pago, observaciones: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:border-[#D4B896] focus:outline-none transition resize-none"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#1a1a1a] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] rounded-lg font-semibold hover:shadow-lg hover:shadow-[#D4B896]/30 transition disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}