import api from "./api";

export const turnosService = {
  abrirTurno: async (localId, efectivoInicial, cajeroId) => {
    // ⭐ Agregar cajeroId
    const response = await api.post("/turnos/abrir", {
      local_id: localId,
      efectivo_inicial: efectivoInicial,
      cajero_id: cajeroId, // ⭐ AGREGAR
    });
    return response.data;
  },

  getTurnoActivo: async (local_id) => {
    const response = await api.get(`/turnos/activo/${local_id}`);
    return response.data;
  },

  cerrarTurno: async (turno_id, efectivo_real, notas_cierre = "") => {
    const response = await api.post(`/turnos/${turno_id}/cerrar`, {
      efectivo_real,
      notas_cierre,
    });
    return response.data;
  },

  getHistorial: async (local_id = null) => {
    const params = local_id ? `?local_id=${local_id}` : "";
    const response = await api.get(`/turnos/historial${params}`);
    return response.data;
  },
};
