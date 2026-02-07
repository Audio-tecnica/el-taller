import api from './api';

export const pagosComprasService = {
  // Registrar un pago para una compra
  registrarPago: async (compraId, datosPago) => {
    const response = await api.post(`/facturas-compra/${compraId}/pagos`, datosPago);
    return response.data;
  },

  // Listar pagos de una compra específica
  listarPagosCompra: async (compraId) => {
    const response = await api.get(`/facturas-compra/${compraId}/pagos`);
    return response.data;
  },

  // Listar todos los pagos (con filtros opcionales)
  listarTodos: async (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    const response = await api.get(`/facturas-compra/pagos/lista?${params}`);
    return response.data;
  },

  // Obtener resumen de pagos
  obtenerResumen: async (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    const response = await api.get(`/facturas-compra/pagos/resumen?${params}`);
    return response.data;
  },

  // Anular un pago
  anularPago: async (pagoId, motivo) => {
    const response = await api.post(`/facturas-compra/pagos/${pagoId}/anular`, { motivo });
    return response.data;
  }
};