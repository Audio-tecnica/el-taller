import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";
import fondo from "../../assets/frente_taller.jpeg";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "admin@eltaller.com",
    password: "admin123",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.login(formData.email, formData.password);
      toast.success("¡Bienvenido a El Taller!");
      navigate("/dashboard");
    } catch (error) {
      // ⭐ Manejar error específico de cajero sin turno abierto
      const errorData = error.response?.data;
      
      if (errorData?.codigo === 'SIN_TURNO_ABIERTO') {
        toast.error(
          'No tienes un turno abierto. Contacta al administrador para que abra tu turno.',
          { 
            duration: 6000,
            icon: '🔒'
          }
        );
      } else {
        toast.error(errorData?.error || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Fondo con imagen */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${fondo})` }}
      />
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/85" />

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-[#0a0a0a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-8">
          <div className="text-center mb-8">
            <img
              src={logo}
              alt="El Taller"
              className="w-28 h-28 rounded-full mx-auto mb-4 object-contain bg-black p-1"
            />
            <h1 className="text-2xl font-bold text-[#D4B896] tracking-widest">
              EL TALLER
            </h1>
            <p className="text-gray-500 mt-1 text-sm tracking-wide">
              Beers and Games • Montería
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-[#D4B896]/50 focus:border-[#D4B896] transition"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:ring-2 focus:ring-[#D4B896]/50 focus:border-[#D4B896] transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#D4B896] text-[#0a0a0a] font-bold rounded-lg hover:bg-[#C4A576] transition-all duration-200 disabled:opacity-50 tracking-wide"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6 tracking-wide">
          EL TALLER © 2024 • SINCE 2024
        </p>
      </div>
    </div>
  );
}
