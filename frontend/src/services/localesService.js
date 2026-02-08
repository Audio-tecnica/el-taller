import api from './api';

export const localesService = {
  // Obtener todos los locales
  getLocales: async () => {
    const response = await api.get('/locales');
    return response.data;
  },

  // Obtener un local por ID
  getLocalById: async (id) => {
    const response = await api.get(`/locales/${id}`);
    return response.data;
  },

  // Crear nuevo local
  createLocal: async (localData) => {
    const response = await api.post('/locales', localData);
    return response.data;
  },

  // Actualizar local
  updateLocal: async (id, localData) => {
    const response = await api.put(`/locales/${id}`, localData);
    return response.data;
  },

  // Eliminar local
  deleteLocal: async (id) => {
    const response = await api.delete(`/locales/${id}`);
    return response.data;
  }
};