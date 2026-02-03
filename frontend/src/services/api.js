import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // ⭐ timeout de 15s por petición
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

    const maxRetries = 3;
    const shouldRetry =
      config.__retryCount < maxRetries &&
      (error.code === "ECONNABORTED" || // timeout
        error.code === "ERR_NETWORK" || // sin red / CORS
        error.response?.status === 404 || // Render sleep 404
        error.response?.status === 503); // Service Unavailable

    if (shouldRetry) {
      config.__retryCount += 1;

      // Delay exponencial: 2s, 4s, 6s
      const delay = config.__retryCount * 2000;
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