import api from './api';

const clientesB2BService = {
  // Obtener todos los clientes
  obtenerClientes: async (params = {}) => {
    const { data } = await api.get('/clientes-b2b', { params });
    return data;
  },

  // Obtener cliente por ID
  obtenerClientePorId: async (id) => {
    const { data } = await api.get(`/clientes-b2b/${id}`);
    return data;
  },

  // Crear cliente
  crearCliente: async (clienteData) => {
    const { data } = await api.post('/clientes-b2b', clienteData);
    return data;
  },

  // Actualizar cliente
  actualizarCliente: async (id, clienteData) => {
    const { data } = await api.put(`/clientes-b2b/${id}`, clienteData);
    return data;
  },

  // Cambiar estado del cliente
  cambiarEstado: async (id, estado, motivo) => {
    const { data } = await api.patch(`/clientes-b2b/${id}/estado`, { estado, motivo });
    return data;
  },

  // Obtener historial de ventas
  obtenerHistorialVentas: async (id, params = {}) => {
    const { data } = await api.get(`/clientes-b2b/${id}/historial-ventas`, { params });
    return data;
  },

  // Obtener estado de cuenta
  obtenerEstadoCuenta: async (id) => {
    const { data } = await api.get(`/clientes-b2b/${id}/estado-cuenta`);
    return data;
  },

  // Recalcular crédito
  recalcularCredito: async (id) => {
    const { data } = await api.post(`/clientes-b2b/${id}/recalcular-credito`);
    return data;
  },

  // Obtener resumen general
  obtenerResumenGeneral: async () => {
    const { data } = await api.get('/clientes-b2b/resumen');
    return data;
  }
};

export default clientesB2BService;
