import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { turnosService } from "../../services/turnosService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function Dashboard() {
  const navigate = useNavigate();
  const usuario = authService.getCurrentUser();
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [loadingTurno, setLoadingTurno] = useState(true);

  useEffect(() => {
    if (usuario?.rol === "cajero") {
      cargarTurnoActivo();
    } else {
      setLoadingTurno(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarTurnoActivo = async () => {
    try {
      console.log("🔍 Buscando turno para cajero:", usuario.id, usuario.nombre);

      // Buscar turno del cajero en TODOS los locales
      const { mesasService } = await import("../../services/mesasService");
      const localesData = await mesasService.getLocales();

      console.log("📍 Locales encontrados:", localesData.length);

      let turnoEncontrado = null;

      for (const local of localesData) {
        try {
          console.log(`🔎 Buscando turno en ${local.nombre} (${local.id})`);
          const turno = await turnosService.getTurnoActivo(local.id);

          console.log(`✅ Turno encontrado en ${local.nombre}:`, turno);
          console.log(`   - cajero_id: ${turno.cajero_id}`);
          console.log(`   - usuario_id: ${turno.usuario_id}`);
          console.log(`   - mi id: ${usuario.id}`);

          // Verificar si este turno es del cajero actual
          const cajeroId = turno.cajero_id || turno.usuario_id;
          if (cajeroId === usuario.id) {
            console.log("🎯 ¡TURNO ENCONTRADO! Este es mi turno");
            turnoEncontrado = turno;
            break;
          } else {
            console.log("❌ Este turno NO es mío (es de otro cajero)");
          }
        } catch {
          console.log(`⚠️ No hay turno en ${local.nombre}`);
          continue; // No hay turno en este local
        }
      }

      if (turnoEncontrado) {
        console.log("✅ TURNO FINAL ASIGNADO:", turnoEncontrado.local?.nombre);
      } else {
        console.log("❌ NO SE ENCONTRÓ TURNO PARA ESTE CAJERO");
      }

      setTurnoActivo(turnoEncontrado);
    } catch (error) {
      console.error("❌ Error al cargar turno:", error);
      setTurnoActivo(null);
    } finally {
      setLoadingTurno(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  const formatMoney = (value) => {
    return "$" + Number(value || 0).toLocaleString();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  // Módulos para administradores
  const modulos = [
    {
      nombre: "Punto de Venta",
      icono: "🍺",
      ruta: "/pos",
      desc: "¡Tomar pedidos aquí!",
      destacado: true,
    },
    {
      nombre: "Productos",
      icono: "📦",
      ruta: "/productos",
      desc: "Catálogo e inventario",
      destacado: false,
    },
    {
      nombre: "Gestión de Mesas",
      icono: "🪑",
      ruta: "/mesas",
      desc: "Configurar mesas",
      destacado: false,
    },
    {
      nombre: "Caja",
      icono: "💰",
      ruta: "/caja",
      desc: "Turnos y arqueo",
      destacado: false,
    },
    {
      nombre: "Clientes B2B",
      icono: "🏢",
      ruta: "/clientes-b2b",
      desc: "Ventas mayoristas",
      destacado: false,
    },
    {
      nombre: "Reportes",
      icono: "📈",
      ruta: "/reportes",
      desc: "Estadísticas",
      destacado: false,
    },
  ];

  // ⭐ NUEVOS MÓDULOS KARDEX PREMIUM (Solo Admin)
  const modulosKardex = [
    {
      nombre: "Proveedores",
      icono: "🏪",
      ruta: "/proveedores",
      desc: "Gestión de proveedores",
      color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
      hoverColor: "hover:border-blue-500",
      textColor: "text-blue-400",
    },
    {
      nombre: "Nueva Compra",
      icono: "📦",
      ruta: "/compras/nueva",
      desc: "Registrar compra",
      color: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
      hoverColor: "hover:border-purple-500",
      textColor: "text-purple-400",
    },
    {
      nombre: "Inventario Valorizado",
      icono: "💰",
      ruta: "/inventario/valorizado",
      desc: "Análisis financiero",
      color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
      hoverColor: "hover:border-amber-500",
      textColor: "text-amber-400",
    },
  ];

  // ⭐ MÓDULO DE SEGURIDAD (Solo para Administradores)
  const modulosSeguridad = [
    {
      nombre: "Intentos de Acceso",
      icono: "🔐",
      ruta: "/admin/intentos-acceso",
      desc: "Registro de seguridad",
      color: "from-red-500/20 to-red-600/10 border-red-500/30",
      hoverColor: "hover:border-red-500",
      textColor: "text-red-400",
    },
    {
      nombre: "Gestión de Usuarios",
      icono: "👥",
      ruta: "/admin/usuarios",
      desc: "Crear y editar usuarios",
      color: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
      hoverColor: "hover:border-orange-500",
      textColor: "text-orange-400",
    },
  ];

  // 🎯 VISTA PARA CAJEROS
  if (usuario?.rol === "cajero") {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <header className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img
                src={logo}
                alt="El Taller"
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <h1 className="text-xl font-bold text-[#D4B896] tracking-wide">
                  EL TALLER
                </h1>
                <p className="text-xs text-gray-500">
                  Beers and Games • Montería
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {usuario?.nombre}
                </p>
                <p className="text-xs text-[#D4B896]">Cajero</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] hover:text-white transition"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        {/* Contenido Cajero */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Bienvenida */}
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#141414] border border-[#2a2a2a] rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">
              Bienvenido, {usuario?.nombre}
            </h2>
            <p className="text-[#D4B896]">
              Punto de Venta -{" "}
              {turnoActivo?.local?.nombre || "Sin turno asignado"}
            </p>
          </div>

          {/* Grid con Punto de Venta e Información del Turno */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Botón Punto de Venta - 2/3 del ancho */}
            <div className="lg:col-span-2">
              <button
                onClick={() => navigate("/pos")}
                disabled={!turnoActivo}
                className={`w-full rounded-2xl p-8 text-center transition-all duration-200 ${
                  turnoActivo
                    ? "bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 cursor-pointer hover:scale-[1.02]"
                    : "bg-gray-800 border-2 border-gray-700 cursor-not-allowed opacity-50"
                }`}
              >
                <div className="w-20 h-20 bg-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl">🍺</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Punto de Venta
                </h3>
                <p className="text-emerald-100 font-medium">
                  {turnoActivo
                    ? "¡Tomar pedidos aquí!"
                    : "Requiere turno activo"}
                </p>
              </button>
            </div>

            {/* Panel de Información del Turno - 1/3 del ancho */}
            <div className="lg:col-span-1">
              {loadingTurno ? (
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 h-full flex items-center justify-center">
                  <p className="text-gray-400 text-sm">Cargando turno...</p>
                </div>
              ) : turnoActivo ? (
                <div className="bg-[#141414] border border-emerald-500/30 rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-500 font-bold">
                      Turno Activo
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Local */}
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Local</p>
                      <p className="text-white font-medium">
                        🏪 {turnoActivo.local?.nombre || "Sin local asignado"}
                      </p>
                    </div>

                    {/* Hora de apertura */}
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Apertura</p>
                      <p className="text-white text-sm">
                        🕐 {formatDate(turnoActivo.fecha_apertura)}
                      </p>
                    </div>

                    {/* Efectivo inicial */}
                    <div>
                      <p className="text-gray-500 text-xs mb-1">
                        Efectivo Inicial
                      </p>
                      <p className="text-2xl font-bold text-[#D4B896]">
                        {formatMoney(turnoActivo.efectivo_inicial)}
                      </p>
                    </div>

                    {/* Ventas del turno */}
                    <div className="pt-3 border-t border-[#2a2a2a]">
                      <p className="text-gray-500 text-xs mb-1">Ventas Hoy</p>
                      <p className="text-xl font-bold text-white">
                        {formatMoney(turnoActivo.resumen?.total_ventas || 0)}
                      </p>
                    </div>

                    {/* Pedidos */}
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Pedidos</p>
                      <p className="text-xl font-bold text-emerald-400">
                        {turnoActivo.resumen?.cantidad_pedidos || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 h-full">
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <span className="text-5xl mb-3">⚠️</span>
                    <h3 className="text-lg font-bold text-red-400 mb-2">
                      Sin turno activo
                    </h3>
                    <p className="text-red-300/80 text-sm">
                      Contacta al administrador para que abra tu turno de
                      trabajo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mensaje de ayuda si no hay turno */}
          {!turnoActivo && !loadingTurno && (
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="text-sm text-white font-medium mb-1">
                  ¿Necesitas ayuda?
                </p>
                <p className="text-xs text-gray-500">
                  El administrador debe abrir un turno para ti desde el módulo
                  de Caja. Una vez abierto, podrás acceder al Punto de Venta.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // 🎯 VISTA PARA ADMINISTRADORES
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img
              src={logo}
              alt="El Taller"
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <h1 className="text-xl font-bold text-[#D4B896] tracking-wide">
                EL TALLER
              </h1>
              <p className="text-xs text-gray-500">
                Beers and Games • Montería
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {usuario?.nombre}
              </p>
              <p className="text-xs text-[#D4B896]">{usuario?.rol}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] hover:text-white transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Bienvenida */}
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#141414] border border-[#2a2a2a] rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">
            Bienvenido, {usuario?.nombre}
          </h2>
          <p className="text-[#D4B896]">Sistema de gestión El Taller</p>
        </div>

        {/* Módulos Principales */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">
            Módulos Principales
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {modulos.map((modulo) => (
              <button
                key={modulo.nombre}
                onClick={() => navigate(modulo.ruta)}
                className={`${
                  modulo.destacado
                    ? "bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400"
                    : "bg-[#141414] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#D4B896]"
                } rounded-xl p-5 text-center transition-all duration-200 group`}
              >
                <div
                  className={`${modulo.destacado ? "w-16 h-16" : "w-12 h-12"} ${
                    modulo.destacado
                      ? "bg-emerald-700"
                      : "bg-[#1a1a1a] group-hover:bg-[#D4B896]/10"
                  } rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors`}
                >
                  <span
                    className={`${modulo.destacado ? "text-4xl" : "text-2xl"}`}
                  >
                    {modulo.icono}
                  </span>
                </div>
                <p
                  className={`${
                    modulo.destacado
                      ? "text-base font-bold"
                      : "text-sm font-medium"
                  } text-white`}
                >
                  {modulo.nombre}
                </p>
                <p
                  className={`${
                    modulo.destacado
                      ? "text-sm text-emerald-100 font-medium"
                      : "text-xs text-gray-600"
                  } mt-1`}
                >
                  {modulo.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ⭐ Módulos Kardex Premium - SOLO ADMINISTRADORES */}
        {usuario?.rol === "administrador" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Sistema Kardex Premium
              </h3>
              <span className="px-3 py-1 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] text-xs font-bold rounded-full">
                NUEVO
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modulosKardex.map((modulo) => (
                <button
                  key={modulo.nombre}
                  onClick={() => navigate(modulo.ruta)}
                  className={`bg-gradient-to-br ${modulo.color} border ${modulo.hoverColor} rounded-2xl p-6 text-left transition-all duration-200 group hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-[#0a0a0a] rounded-xl flex items-center justify-center">
                      <span className="text-3xl">{modulo.icono}</span>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-600 group-hover:text-white transition"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-white transition">
                    {modulo.nombre}
                  </h4>
                  <p className={`text-sm ${modulo.textColor}`}>{modulo.desc}</p>
                </button>
              ))}
            </div>

            {/* Info adicional */}
            <div className="mt-4 bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="text-sm text-white font-medium mb-1">
                  Sistema Kardex Profesional
                </p>
                <p className="text-xs text-gray-500">
                  Gestiona proveedores, registra compras con costos reales, y
                  visualiza el valor financiero de tu inventario en tiempo real.
                </p>
              </div>
            </div>
          </div>
        )}
     
        {/* ⭐ Módulo de Seguridad - SOLO ADMINISTRADORES */}
        {usuario?.rol === "administrador" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Seguridad y Auditoría
              </h3>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30">
                SOLO ADMIN
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modulosSeguridad.map((modulo) => (
                <button
                  key={modulo.nombre}
                  onClick={() => navigate(modulo.ruta)}
                  className={`bg-gradient-to-br ${modulo.color} border ${modulo.hoverColor} rounded-2xl p-6 text-left transition-all duration-200 group hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-[#0a0a0a] rounded-xl flex items-center justify-center">
                      <span className="text-3xl">{modulo.icono}</span>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-600 group-hover:text-white transition"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1 group-hover:text-white transition">
                    {modulo.nombre}
                  </h4>
                  <p className={`text-sm ${modulo.textColor}`}>{modulo.desc}</p>
                </button>
              ))}
            </div>

            {/* Info adicional */}
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div className="flex-1">
                <p className="text-sm text-red-400 font-medium mb-1">
                  Control de Acceso por Turnos
                </p>
                <p className="text-xs text-red-300/70">
                  Los cajeros solo pueden iniciar sesión cuando tienen un turno
                  abierto. Todos los intentos de acceso quedan registrados para
                  auditoría.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-gray-500 text-sm mb-1">Ventas Hoy</p>
            <p className="text-3xl font-bold text-[#D4B896]">$0</p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-gray-500 text-sm mb-1">Mesas Activas</p>
            <p className="text-3xl font-bold text-emerald-500">0</p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-gray-500 text-sm mb-1">Productos</p>
            <p className="text-3xl font-bold text-white">1</p>
          </div>
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-gray-500 text-sm mb-1">Stock Bajo</p>
            <p className="text-3xl font-bold text-red-500">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
