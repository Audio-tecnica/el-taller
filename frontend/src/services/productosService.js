import api from './api';

export const productosService = {
  // Categorías
  getCategorias: async () => {
    const response = await api.get('/categorias');
    return response.data;
  },

  // Productos
  getProductos: async (categoriaId = null) => {
    const params = categoriaId ? `?categoria_id=${categoriaId}` : '';
    const response = await api.get(`/productos${params}`);
    return response.data;
  },

  getProducto: async (id) => {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  },

  crearProducto: async (data) => {
    const response = await api.post('/productos', data);
    return response.data;
  },

  actualizarProducto: async (id, data) => {
    const response = await api.put(`/productos/${id}`, data);
    return response.data;
  },

  eliminarProducto: async (id) => {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  },

  getStockBajo: async () => {
    const response = await api.get('/productos/stock-bajo');
    return response.data;
  }
};