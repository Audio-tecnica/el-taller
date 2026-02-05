import api from './api';

const impuestosService = {
  // ═══════════════════════════════════════════════════════════════════
  // CATÁLOGO DE IMPUESTOS
  // ═══════════════════════════════════════════════════════════════════

  // Obtener todos los impuestos
  obtenerImpuestos: async (params = {}) => {
    const response = await api.get('/impuestos', { params });
    return response.data;
  },

  // Obtener solo impuestos activos
  obtenerImpuestosActivos: async () => {
    const response = await api.get('/impuestos', { params: { activo: true } });
    return response.data;
  },

  // Obtener impuesto por ID
  obtenerImpuestoPorId: async (id) => {
    const response = await api.get(`/impuestos/${id}`);
    return response.data;
  },

  // Crear nuevo impuesto
  crearImpuesto: async (data) => {
    const response = await api.post('/impuestos', data);
    return response.data;
  },

  // Actualizar impuesto
  actualizarImpuesto: async (id, data) => {
    const response = await api.put(`/impuestos/${id}`, data);
    return response.data;
  },

  // Eliminar (desactivar) impuesto
  eliminarImpuesto: async (id) => {
    const response = await api.delete(`/impuestos/${id}`);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════════
  // IMPUESTOS POR CLIENTE
  // ═══════════════════════════════════════════════════════════════════

  // Obtener impuestos asignados a un cliente
  obtenerImpuestosCliente: async (clienteId) => {
    const response = await api.get(`/impuestos/cliente/${clienteId}`);
    return response.data;
  },

  // Asignar múltiples impuestos a un cliente
  asignarImpuestosCliente: async (clienteId, impuestos) => {
    const response = await api.post(`/impuestos/cliente/${clienteId}`, { impuestos });
    return response.data;
  },

  // Agregar un impuesto a un cliente
  agregarImpuestoCliente: async (clienteId, data) => {
    const response = await api.post(`/impuestos/cliente/${clienteId}/agregar`, data);
    return response.data;
  },

  // Quitar un impuesto de un cliente
  quitarImpuestoCliente: async (clienteId, impuestoId) => {
    const response = await api.delete(`/impuestos/cliente/${clienteId}/${impuestoId}`);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════════
  // CÁLCULO DE IMPUESTOS
  // ═══════════════════════════════════════════════════════════════════

  // Calcular impuestos para un monto
  calcularImpuestos: async (subtotal, impuestos_ids) => {
    const response = await api.post('/impuestos/calcular', { subtotal, impuestos_ids });
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════

  // Filtrar impuestos por tipo
  filtrarPorTipo: (impuestos, tipo) => {
    return impuestos.filter(imp => imp.tipo === tipo);
  },

  // Calcular totales localmente (para preview rápido)
  calcularTotalesLocal: (subtotal, impuestosSeleccionados) => {
    const subtotalNum = parseFloat(subtotal) || 0;
    let totalImpuestos = 0;
    let totalRetenciones = 0;
    const detalle = [];

    // Ordenar: primero impuestos, luego retenciones
    const ordenados = [...impuestosSeleccionados].sort((a, b) => {
      if (a.tipo === 'Impuesto' && b.tipo === 'Retencion') return -1;
      if (a.tipo === 'Retencion' && b.tipo === 'Impuesto') return 1;
      return (a.orden || 0) - (b.orden || 0);
    });

    for (const imp of ordenados) {
      const porcentaje = parseFloat(imp.porcentaje) || 0;
      let base = subtotalNum;

      // Para ReteIVA, la base es el monto del IVA calculado
      if (imp.base_calculo === 'BaseGravable') {
        const ivaCalculado = detalle.find(d => d.codigo?.startsWith('IVA') && d.tipo === 'Impuesto');
        base = ivaCalculado ? ivaCalculado.monto : 0;
      }

      const monto = (base * porcentaje) / 100;

      if (imp.tipo === 'Impuesto') {
        totalImpuestos += monto;
      } else {
        totalRetenciones += monto;
      }

      detalle.push({
        id: imp.id,
        codigo: imp.codigo,
        nombre: imp.nombre,
        tipo: imp.tipo,
        porcentaje: porcentaje,
        base: base,
        monto: monto
      });
    }

    const total = subtotalNum + totalImpuestos - totalRetenciones;

    return {
      subtotal: subtotalNum,
      total_impuestos: totalImpuestos,
      total_retenciones: totalRetenciones,
      total: total,
      neto_a_pagar: total,
      detalle: detalle
    };
  }
};

export default impuestosService;
