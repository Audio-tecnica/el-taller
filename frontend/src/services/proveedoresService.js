import api from './api';

export const proveedoresService = {
  // Obtener todos los proveedores
  getAll: async (activo = true) => {
    const response = await api.get(`/proveedores?activo=${activo}`);
    return response.data;
  },

  // Alias para compatibilidad
  getProveedores: async (activo = true) => {
    const response = await api.get(`/proveedores?activo=${activo}`);
    return response.data;
  },

  // Obtener un proveedor por ID
  getById: async (id) => {
    const response = await api.get(`/proveedores/${id}`);
    return response.data;
  },

  // Crear proveedor
  create: async (data) => {
    const response = await api.post('/proveedores', data);
    return response.data;
  },

  // Actualizar proveedor
  update: async (id, data) => {
    const response = await api.put(`/proveedores/${id}`, data);
    return response.data;
  },

  // Desactivar proveedor
  delete: async (id) => {
    const response = await api.delete(`/proveedores/${id}`);
    return response.data;
  },

  // Obtener compras de un proveedor
  getCompras: async (id, fechaInicio, fechaFin) => {
    let url = `/proveedores/${id}/compras`;
    if (fechaInicio && fechaFin) {
      url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Obtener productos comprados a un proveedor
  getProductos: async (id, fechaInicio, fechaFin) => {
    let url = `/proveedores/${id}/productos`;
    if (fechaInicio && fechaFin) {
      url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Obtener estadísticas de un proveedor
  getEstadisticas: async (id) => {
    const response = await api.get(`/proveedores/${id}/estadisticas`);
    return response.data;
  }
};