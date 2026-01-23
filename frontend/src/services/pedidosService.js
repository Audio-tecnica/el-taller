import api from "./api";

export const pedidosService = {
  abrirPedido: async (mesa_id) => {
    const response = await api.post("/pedidos/abrir", { mesa_id });
    return response.data;
  },

  getPedidoMesa: async (mesa_id) => {
    const response = await api.get(`/pedidos/mesa/${mesa_id}`);
    return response.data;
  },

  agregarItem: async (pedido_id, producto_id, cantidad = 1, notas = "") => {
    const response = await api.post(`/pedidos/${pedido_id}/items`, {
      producto_id,
      cantidad,
      notas,
    });
    return response.data;
  },

  quitarItem: async (pedido_id, item_id, cantidad = null) => {
    const response = await api.delete(
      `/pedidos/${pedido_id}/items/${item_id}`,
      {
        data: { cantidad },
      },
    );
    return response.data;
  },

  cerrarPedido: async (
    pedido_id,
    metodo_pago,
    monto_cortesia = 0,
    razon_cortesia = "",
  ) => {
    const response = await api.post(`/pedidos/${pedido_id}/cerrar`, {
      metodo_pago,
      monto_cortesia,
      razon_cortesia,
    });
    return response.data;
  },
  cancelarPedido: async (pedido_id) => {
    const response = await api.post(`/pedidos/${pedido_id}/cancelar`);
    return response.data;
  },

  getPedidosAbiertos: async (local_id = null) => {
    const params = local_id ? `?local_id=${local_id}` : "";
    const response = await api.get(`/pedidos/abiertos${params}`);
    return response.data;
  },
};
