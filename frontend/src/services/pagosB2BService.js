import api from './api';

const pagosB2BService = {
  // Registrar nuevo pago
  registrarPago: async (pagoData) => {
    const response = await api.post('/pagos-b2b', pagoData);
    return response.data;
  },

  // Obtener pagos con filtros
  obtenerPagos: async (params = {}) => {
    const response = await api.get('/pagos-b2b', { params });
    return response.data;
  },

  // Obtener pago por ID
  obtenerPagoPorId: async (id) => {
    const response = await api.get(`/pagos-b2b/${id}`);
    return response.data;
  },

  // Anular pago
  anularPago: async (id, motivo) => {
    const response = await api.post(`/pagos-b2b/${id}/anular`, { motivo });
    return response.data;
  },

  // Obtener resumen
  obtenerResumenPagos: async (params = {}) => {
    const response = await api.get('/pagos-b2b/resumen', { params });
    return response.data;
  }
};

export default pagosB2BService;