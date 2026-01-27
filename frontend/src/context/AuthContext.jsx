import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'https://el-taller.onrender.com/api';

// Tiempo antes de expiración para refrescar (5 minutos antes)
const REFRESH_THRESHOLD = 5 * 60 * 1000;

// Intervalo de verificación de token (cada 1 minuto)
const CHECK_INTERVAL = 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Decodificar JWT para obtener información
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Verificar si el token está por expirar
  const isTokenExpiringSoon = (token) => {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const expirationTime = decoded.exp * 1000;
    const now = Date.now();
    
    return (expirationTime - now) < REFRESH_THRESHOLD;
  };

  // Verificar si el token ya expiró
  const isTokenExpired = (token) => {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  };

  // Refrescar token
  const refreshToken = useCallback(async () => {
    if (isRefreshing) return null;
    
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return null;

    setIsRefreshing(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        console.log('🔄 Token refrescado exitosamente');
        return data.token;
      } else {
        // Token inválido, hacer logout
        console.log('⚠️ No se pudo refrescar el token');
        logout();
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Verificar sesión al cargar
  const checkSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    // Si el token ya expiró, intentar refrescar
    if (isTokenExpired(token)) {
      console.log('⚠️ Token expirado, intentando refrescar...');
      const newToken = await refreshToken();
      if (!newToken) {
        setLoading(false);
        return;
      }
    }

    // Verificar con el servidor
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Intentar refrescar si falla
        const newToken = await refreshToken();
        if (!newToken) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshToken]);

  // Efecto inicial - verificar sesión
  useEffect(() => {
    checkSession();
  }, []);

  // Efecto para verificar token periódicamente
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpiringSoon(token)) {
        console.log('🔄 Token por expirar, refrescando...');
        refreshToken();
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  // Efecto para detectar cuando la app vuelve del background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('token');
        if (token) {
          if (isTokenExpired(token)) {
            console.log('📱 App activada con token expirado, refrescando...');
            refreshToken();
          } else if (isTokenExpiringSoon(token)) {
            console.log('📱 App activada con token por expirar, refrescando...');
            refreshToken();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshToken]);

  // ⭐ Login actualizado con manejo de código de error
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { 
          success: false, 
          error: data.error || 'Error al iniciar sesión',
          codigo: data.codigo // ⭐ CAPTURAR CÓDIGO DE ERROR
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  // Obtener token válido (refresca si es necesario)
  const getValidToken = useCallback(async () => {
    let token = localStorage.getItem('token');
    
    if (!token) return null;
    
    if (isTokenExpired(token) || isTokenExpiringSoon(token)) {
      token = await refreshToken();
    }
    
    return token;
  }, [refreshToken]);

  const value = {
    user,
    loading,
    isRefreshing,
    login,
    logout,
    refreshToken,
    getValidToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export default AuthContext;
