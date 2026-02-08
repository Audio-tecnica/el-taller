import api from './api';

export const gastosService = {
  // Obtener todos los gastos con filtros opcionales
  getGastos: async (filtros = {}) => {
    const params = new URLSearchParams();
    
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.local_id) params.append('local_id', filtros.local_id);
    if (filtros.proveedor_id) params.append('proveedor_id', filtros.proveedor_id);
    if (filtros.mes) params.append('mes', filtros.mes);
    if (filtros.anio) params.append('anio', filtros.anio);
    
    const response = await api.get(`/gastos?${params.toString()}`);
    return response.data;
  },

  // Obtener un gasto por ID
  getGastoById: async (id) => {
    const response = await api.get(`/gastos/${id}`);
    return response.data;
  },

  // Crear nuevo gasto
  createGasto: async (gastoData) => {
    const response = await api.post('/gastos', gastoData);
    return response.data;
  },

  // Actualizar gasto
  updateGasto: async (id, gastoData) => {
    const response = await api.put(`/gastos/${id}`, gastoData);
    return response.data;
  },

  // Eliminar gasto
  deleteGasto: async (id) => {
    const response = await api.delete(`/gastos/${id}`);
    return response.data;
  },

  // Obtener resumen de gastos
  getResumen: async (filtros = {}) => {
    const params = new URLSearchParams();
    
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros.local_id) params.append('local_id', filtros.local_id);
    
    const response = await api.get(`/gastos/resumen?${params.toString()}`);
    return response.data;
  },

  // Obtener categorías disponibles
  getCategorias: async () => {
    const response = await api.get('/gastos/categorias');
    return response.data;
  }
};
