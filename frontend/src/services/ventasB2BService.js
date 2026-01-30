import api from './api';

const ventasB2BService = {
  // Crear venta
  crearVenta: async (ventaData) => {
    const { data } = await api.post('/ventas-b2b', ventaData);
    return data;
  },

  // Obtener ventas con filtros
  obtenerVentas: async (params = {}) => {
    const { data } = await api.get('/ventas-b2b', { params });
    return data;
  },

  // Obtener venta por ID
  obtenerVentaPorId: async (id) => {
    const { data } = await api.get(`/ventas-b2b/${id}`);
    return data;
  },

  // Anular venta
  anularVenta: async (id, motivo) => {
    const { data } = await api.delete(`/ventas-b2b/${id}`, { data: { motivo } });
    return data;
  },

  // Actualizar días de mora
  actualizarDiasMora: async () => {
    const { data } = await api.post('/ventas-b2b/actualizar-mora');
    return data;
  },

  // Obtener resumen de ventas
  obtenerResumenVentas: async (params = {}) => {
    const { data } = await api.get('/ventas-b2b/resumen', { params });
    return data;
  }
};

export default ventasB2BService;
