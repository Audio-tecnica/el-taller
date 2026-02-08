import api from './api';

export const reportesService = {
  getDashboard: async () => {
    const response = await api.get('/reportes/dashboard');
    return response.data;
  },

  getVentasHoy: async () => {
    const response = await api.get('/reportes/ventas/hoy');
    return response.data;
  },

  getVentasPorRango: async (fechaInicio, fechaFin, localId = null) => {
    let url = '/reportes/ventas/rango?fecha_inicio=' + fechaInicio + '&fecha_fin=' + fechaFin;
    if (localId) url += '&local_id=' + localId;
    const response = await api.get(url);
    return response.data;
  },

  getProductosTop: async (fechaInicio = null, fechaFin = null, limite = 20) => {
    let url = '/reportes/productos/top?limite=' + limite;
    if (fechaInicio) url += '&fecha_inicio=' + fechaInicio;
    if (fechaFin) url += '&fecha_fin=' + fechaFin;
    const response = await api.get(url);
    return response.data;
  },

  getVentasPorCategoria: async (fechaInicio = null, fechaFin = null) => {
    let url = '/reportes/ventas/categorias';
    if (fechaInicio && fechaFin) {
      url += '?fecha_inicio=' + fechaInicio + '&fecha_fin=' + fechaFin;
    }
    const response = await api.get(url);
    return response.data;
  },

  getCortesias: async (fechaInicio = null, fechaFin = null) => {
    let url = '/reportes/cortesias';
    if (fechaInicio && fechaFin) {
      url += '?fecha_inicio=' + fechaInicio + '&fecha_fin=' + fechaFin;
    }
    const response = await api.get(url);
    return response.data;
  },

  getVentasDetalladas: async (fechaInicio, fechaFin, filtros = {}) => {
    let url = `/reportes/ventas/detalladas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    if (filtros.cliente) url += `&cliente=${filtros.cliente}`;
    if (filtros.metodoPago) url += `&metodo_pago=${filtros.metodoPago}`;
    if (filtros.localId) url += `&local_id=${filtros.localId}`;
    const response = await api.get(url);
    return response.data;
  },

  getGastos: async (fechaInicio, fechaFin, filtros = {}) => {
    let url = `/reportes/gastos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    if (filtros.categoria) url += `&categoria=${filtros.categoria}`;
    if (filtros.proveedorId) url += `&proveedor_id=${filtros.proveedorId}`;
    const response = await api.get(url);
    return response.data;
  },

  getComprasDetalladas: async (fechaInicio, fechaFin, proveedorId = null) => {
    let url = `/reportes/compras/detalladas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    if (proveedorId) url += `&proveedor_id=${proveedorId}`;
    const response = await api.get(url);
    return response.data;
  },

  getInventarioValorizado: async (localId = null) => {
    let url = '/reportes/inventario/valorizado';
    if (localId) url += `?local_id=${localId}`;
    const response = await api.get(url);
    return response.data;
  },

  getKardex: async (fechaInicio, fechaFin, productoId = null, tipo = null) => {
    let url = `/reportes/inventario/kardex?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    if (productoId) url += `&producto_id=${productoId}`;
    if (tipo) url += `&tipo=${tipo}`;
    const response = await api.get(url);
    return response.data;
  },

  getEstadoResultados: async (fechaInicio, fechaFin, localId = null) => {
    let url = `/reportes/utilidad?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    if (localId) url += `&local_id=${localId}`;
    const response = await api.get(url);
    return response.data;
  },

  getCierreCaja: async (fechaInicio, fechaFin, localId = null, usuarioId = null) => {
    let url = `/reportes/cierre-caja?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    if (localId) url += `&local_id=${localId}`;
    if (usuarioId) url += `&usuario_id=${usuarioId}`;
    const response = await api.get(url);
    return response.data;
  }
};