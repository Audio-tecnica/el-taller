import api from './api';

export const inventarioKardexService = {
  // ==========================================
  // COMPRAS
  // ==========================================
  
  // Registrar compra
  registrarCompra: async (data) => {
    const response = await api.post('/inventario/compra', data);
    return response.data;
  },

  // Registrar devolución a proveedor
  registrarDevolucion: async (data) => {
    const response = await api.post('/inventario/devolucion-proveedor', data);
    return response.data;
  },

  // ==========================================
  // AJUSTES
  // ==========================================

  // Ajustar inventario
  ajustarInventario: async (data) => {
    const response = await api.post('/inventario/ajustar', data);
    return response.data;
  },

  // Registrar merma
  registrarMerma: async (data) => {
    const response = await api.post('/inventario/merma', data);
    return response.data;
  },

  // ==========================================
  // TRANSFERENCIAS
  // ==========================================

  // Transferir entre locales
  transferir: async (data) => {
    const response = await api.post('/inventario/transferir', data);
    return response.data;
  },

  // ==========================================
  // CONSULTAS
  // ==========================================

  // Obtener kardex de un producto
  getKardex: async (productoId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/inventario/kardex/${productoId}?${queryParams}`);
    return response.data;
  },

  // Obtener movimientos
  getMovimientos: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/inventario/movimientos?${queryParams}`);
    return response.data;
  },

  // Obtener inventario valorizado
  getInventarioValorizado: async (localId = null) => {
    let url = '/inventario/valorizado';
    if (localId) {
      url += `?local_id=${localId}`;
    }
    const response = await api.get(url);
    return response.data;
  }
};
