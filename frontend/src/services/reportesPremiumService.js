import api from './api';

export const reportesPremiumService = {
  // ==========================================
  // REPORTES DE VENTAS
  // ==========================================

  // Ventas de hoy (con costos y utilidad)
  getVentasHoy: async () => {
    const response = await api.get('/reportes-premium/ventas/hoy');
    return response.data;
  },

  // ==========================================
  // REPORTES DE COMPRAS
  // ==========================================

  // Análisis de compras por período
  getComprasPorPeriodo: async (fechaInicio, fechaFin, proveedorId = null) => {
    let url = `/reportes-premium/compras/periodo?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    if (proveedorId) {
      url += `&proveedor_id=${proveedorId}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // ==========================================
  // ANÁLISIS FINANCIERO
  // ==========================================

  // Estado financiero completo
  getAnalisisFinanciero: async (fechaInicio, fechaFin, localId = null) => {
    let url = `/reportes-premium/analisis/financiero?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    if (localId) {
      url += `&local_id=${localId}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Productos por rentabilidad
  getProductosPorRentabilidad: async (fechaInicio, fechaFin, limite = 20) => {
    const response = await api.get(
      `/reportes-premium/productos/rentabilidad?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&limite=${limite}`
    );
    return response.data;
  },

  // ==========================================
  // REPORTES DE INVENTARIO
  // ==========================================

  // Historial de movimientos con valorización
  getHistorialMovimientos: async (fechaInicio, fechaFin, tipo = null, localId = null) => {
    let url = `/reportes-premium/inventario/movimientos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    if (tipo) url += `&tipo=${tipo}`;
    if (localId) url += `&local_id=${localId}`;
    const response = await api.get(url);
    return response.data;
  }
};
