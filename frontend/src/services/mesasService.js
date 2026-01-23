import api from './api';

export const mesasService = {
  getLocales: async () => {
    const response = await api.get('/mesas/locales');
    return response.data;
  },

  getMesas: async (localId = null) => {
    const params = localId ? `?local_id=${localId}` : '';
    const response = await api.get(`/mesas${params}`);
    return response.data;
  },

  getMesa: async (id) => {
    const response = await api.get(`/mesas/${id}`);
    return response.data;
  },

  crearMesa: async (data) => {
    const response = await api.post('/mesas', data);
    return response.data;
  },

  actualizarMesa: async (id, data) => {
    const response = await api.put(`/mesas/${id}`, data);
    return response.data;
  },

  cambiarEstado: async (id, estado) => {
    const response = await api.patch(`/mesas/${id}/estado`, { estado });
    return response.data;
  },

  eliminarMesa: async (id) => {
    const response = await api.delete(`/mesas/${id}`);
    return response.data;
  }
};