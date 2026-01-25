import api from './api';

export const inventarioService = {
  // Obtener inventario consolidado
  getInventarioConsolidado: async () => {
    const response = await api.get('/inventario/consolidado');
    return response.data;
  },

  // Obtener inventario por local
  getInventarioPorLocal: async (localId) => {
    const response = await api.get('/inventario/local/' + localId);
    return response.data;
  },

  // Obtener productos con stock bajo
  getStockBajo: async () => {
    const response = await api.get('/inventario/alertas');
    return response.data;
  },

  // Ajustar inventario
  ajustarInventario: async (productoId, local, cantidadNueva, motivo) => {
    const response = await api.post('/inventario/ajustar', {
      producto_id: productoId,
      local,
      cantidad_nueva: cantidadNueva,
      motivo
    });
    return response.data;
  },

  // Registrar entrada de inventario
  registrarEntrada: async (productoId, local, cantidad, motivo) => {
    const response = await api.post('/inventario/entrada', {
      producto_id: productoId,
      local,
      cantidad,
      motivo
    });
    return response.data;
  },

  // Obtener historial de movimientos
  getMovimientos: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.producto_id) params.append('producto_id', filtros.producto_id);
    if (filtros.local_id) params.append('local_id', filtros.local_id);
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros.limit) params.append('limit', filtros.limit);

    const response = await api.get('/inventario/movimientos?' + params.toString());
    return response.data;
  },

  // Obtener movimientos de un producto
  getMovimientosProducto: async (productoId) => {
    const response = await api.get('/inventario/movimientos/' + productoId);
    return response.data;
  }
};