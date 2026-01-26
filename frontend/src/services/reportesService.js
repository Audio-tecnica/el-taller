import api from './api';

export const reportesService = {
  // Dashboard resumen
  getDashboard: async () => {
    const response = await api.get('/reportes/dashboard');
    return response.data;
  },

  // Ventas de hoy
  getVentasHoy: async () => {
    const response = await api.get('/reportes/ventas/hoy');
    return response.data;
  },

  // Ventas por rango de fechas
  getVentasPorRango: async (fechaInicio, fechaFin, localId = null) => {
    let url = '/reportes/ventas/rango?fecha_inicio=' + fechaInicio + '&fecha_fin=' + fechaFin;
    if (localId) url += '&local_id=' + localId;
    const response = await api.get(url);
    return response.data;
  },

  // Productos más vendidos
  getProductosTop: async (fechaInicio = null, fechaFin = null, limite = 20) => {
    let url = '/reportes/productos/top?limite=' + limite;
    if (fechaInicio) url += '&fecha_inicio=' + fechaInicio;
    if (fechaFin) url += '&fecha_fin=' + fechaFin;
    const response = await api.get(url);
    return response.data;
  },

  // Ventas por categoría
  getVentasPorCategoria: async (fechaInicio = null, fechaFin = null) => {
    let url = '/reportes/ventas/categorias';
    if (fechaInicio && fechaFin) {
      url += '?fecha_inicio=' + fechaInicio + '&fecha_fin=' + fechaFin;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Cortesías
  getCortesias: async (fechaInicio = null, fechaFin = null) => {
    let url = '/reportes/cortesias';
    if (fechaInicio && fechaFin) {
      url += '?fecha_inicio=' + fechaInicio + '&fecha_fin=' + fechaFin;
    }
    const response = await api.get(url);
    return response.data;
  }
};