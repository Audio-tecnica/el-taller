import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000, // ⭐ Reducido de 15s a 8s para respuestas más rápidas
});

// ── Interceptor de request: agregar token ────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de response: RETRY automático ────────────────
// Cuando Render está en sleep mode retorna 404 o timeout en las
// primeras peticiones. Este interceptor reintenta hasta 3 veces
// con un delay creciente para darle tiempo al servidor de despertar.
api.interceptors.response.use(
  (response) => response, // si sale bien, pasar directo
  async (error) => {
    const config = error.config;

    // Inicializar contador de reintentos si no existe
    if (!config.__retryCount) {
      config.__retryCount = 0;
    }

    // ⭐ NO REINTENTAR en endpoints de turnos con 404
    // Un 404 en /turnos/activo o /turnos/mi-turno es VÁLIDO (no hay turno activo)
    const esTurnoEndpoint = config.url?.includes('/turnos/activo') || config.url?.includes('/turnos/mi-turno');
    const es404 = error.response?.status === 404;
    
    if (esTurnoEndpoint && es404) {
      // No reintentar, el 404 es una respuesta válida
      return Promise.reject(error);
    }

    const maxRetries = 2; // ⭐ Reducido de 3 a 2 reintentos
    const shouldRetry =
      config.__retryCount < maxRetries &&
      (error.code === "ECONNABORTED" || // timeout
        error.code === "ERR_NETWORK" || // sin red / CORS
        error.response?.status === 404 || // Render sleep 404 (solo para otros endpoints)
        error.response?.status === 503); // Service Unavailable

    if (shouldRetry) {
      config.__retryCount += 1;

      // ⭐ Delay más corto: 1s, 2s (en vez de 2s, 4s, 6s)
      const delay = config.__retryCount * 1000;
      console.log(
        `🔄 Reintento ${config.__retryCount}/${maxRetries} para ${config.url} (esperando ${delay / 1000}s...)`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      return api(config); // reintentar la misma petición
    }

    // Si ya agotó reintentos o no es un error reintentar → propagar
    return Promise.reject(error);
  }
);

export default api;