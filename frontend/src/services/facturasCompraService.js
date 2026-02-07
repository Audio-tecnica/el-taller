import api from './api';

export const facturasCompraService = {
  generarPDF: async (compraId) => {
    const response = await api.post(`/facturas-compra/${compraId}/generar-pdf`);
    return response.data;
  },

  descargarPDF: async (compraId) => {
    const response = await api.get(`/facturas-compra/${compraId}/descargar-pdf`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `factura_${compraId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  },

  obtenerURLPDF: (compraId) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseURL}/facturas-compra/${compraId}/descargar-pdf`;
  },

  editar: async (compraId, datos) => {
    const response = await api.put(`/facturas-compra/${compraId}`, datos);
    return response.data;
  },

  anular: async (compraId, motivo) => {
    const response = await api.post(`/facturas-compra/${compraId}/anular`, { motivo });
    return response.data;
  }
};