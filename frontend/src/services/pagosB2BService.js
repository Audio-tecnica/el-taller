import api from './api';

const pagosB2BService = {
  // Registrar pago
  registrarPago: async (pagoData) => {
    const { data } = await api.post('/pagos-b2b', pagoData);
    return data;
  },

  // Obtener pagos con filtros
  obtenerPagos: async (params = {}) => {
    const { data } = await api.get('/pagos-b2b', { params });
    return data;
  },

  // Obtener pago por ID
  obtenerPagoPorId: async (id) => {
    const { data } = await api.get(`/pagos-b2b/${id}`);
    return data;
  },

  // Anular pago
  anularPago: async (id, motivo) => {
    const { data } = await api.delete(`/pagos-b2b/${id}`, { data: { motivo } });
    return data;
  },

  // Obtener resumen de pagos
  obtenerResumenPagos: async (params = {}) => {
    const { data } = await api.get('/pagos-b2b/resumen', { params });
    return data;
  },

  // Obtener pagos por turno
  obtenerPagosPorTurno: async (turnoId) => {
    const { data } = await api.get(`/pagos-b2b/turno/${turnoId}`);
    return data;
  }
};

export default pagosB2BService;
