import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { proveedoresService } from "../../services/proveedoresService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function Proveedores() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proveedores, setProveedores] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  
  // Estado del formulario
  const [formulario, setFormulario] = useState({
    nombre: "",
    nit: "",
    telefono: "",
    email: "",
    direccion: "",
    contacto_nombre: "",
    contacto_telefono: "",
    terminos_pago: "Contado",
    notas: ""
  });

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const data = await proveedoresService.getAll();
      setProveedores(data);
    } catch {
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formulario.nombre) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      if (proveedorSeleccionado) {
        await proveedoresService.update(proveedorSeleccionado.id, formulario);
        toast.success("Proveedor actualizado");
      } else {
        await proveedoresService.create(formulario);
        toast.success("Proveedor creado");
      }
      
      setMostrarFormulario(false);
      setProveedorSeleccionado(null);
      resetFormulario();
      cargarProveedores();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al guardar proveedor");
    }
  };

  const handleEditar = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setFormulario({
      nombre: proveedor.nombre || "",
      nit: proveedor.nit || "",
      telefono: proveedor.telefono || "",
      email: proveedor.email || "",
      direccion: proveedor.direccion || "",
      contacto_nombre: proveedor.contacto_nombre || "",
      contacto_telefono: proveedor.contacto_telefono || "",
      terminos_pago: proveedor.terminos_pago || "Contado",
      notas: proveedor.notas || ""
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Desactivar este proveedor?")) return;
    
    try {
      await proveedoresService.delete(id);
      toast.success("Proveedor desactivado");
      cargarProveedores();
    } catch {
      toast.error("Error al desactivar proveedor");
    }
  };

  const resetFormulario = () => {
    setFormulario({
      nombre: "",
      nit: "",
      telefono: "",
      email: "",
      direccion: "",
      contacto_nombre: "",
      contacto_telefono: "",
      terminos_pago: "Contado",
      notas: ""
    });
  };

  const handleNuevo = () => {
    setProveedorSeleccionado(null);
    resetFormulario();
    setMostrarFormulario(true);
  };

  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.nit?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg font-medium">Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#D4B896]/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <img src={logo} alt="El Taller" className="w-10 h-10 rounded-xl object-contain bg-black" />
              <div>
                <h1 className="text-xl font-black text-white">Proveedores</h1>
                <p className="text-xs text-[#D4B896]">Gestión de Proveedores</p>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleNuevo}
                className="px-4 py-2 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] rounded-lg font-bold hover:shadow-lg hover:shadow-[#D4B896]/30 transition"
              >
                + Nuevo Proveedor
              </button>
              
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, NIT o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#D4B896] transition"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Modal Formulario */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#141414] border-b border-[#2a2a2a] p-6 flex items-center justify-between">
                <h2 className="text-2xl font-black text-white">
                  {proveedorSeleccionado ? "Editar Proveedor" : "Nuevo Proveedor"}
                </h2>
                <button
                  onClick={() => {
                    setMostrarFormulario(false);
                    setProveedorSeleccionado(null);
                    resetFormulario();
                  }}
                  className="text-gray-400 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Información Básica */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nombre del Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={formulario.nombre}
                    onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                    placeholder="Ej: Distribuidora ABC"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">NIT</label>
                    <input
                      type="text"
                      value={formulario.nit}
                      onChange={(e) => setFormulario({ ...formulario, nit: e.target.value })}
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                      placeholder="900123456-7"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={formulario.telefono}
                      onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                      placeholder="3001234567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={formulario.email}
                    onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                    placeholder="contacto@proveedor.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Dirección</label>
                  <textarea
                    value={formulario.direccion}
                    onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition resize-none"
                    placeholder="Calle 123 #45-67"
                  />
                </div>

                {/* Información de Contacto */}
                <div className="pt-4 border-t border-[#2a2a2a]">
                  <h3 className="text-lg font-bold text-white mb-4">Persona de Contacto</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Nombre</label>
                      <input
                        type="text"
                        value={formulario.contacto_nombre}
                        onChange={(e) => setFormulario({ ...formulario, contacto_nombre: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Teléfono</label>
                      <input
                        type="tel"
                        value={formulario.contacto_telefono}
                        onChange={(e) => setFormulario({ ...formulario, contacto_telefono: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                        placeholder="3001234567"
                      />
                    </div>
                  </div>
                </div>

                {/* Términos comerciales */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Términos de Pago</label>
                  <select
                    value={formulario.terminos_pago}
                    onChange={(e) => setFormulario({ ...formulario, terminos_pago: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                  >
                    <option value="Contado">Contado</option>
                    <option value="15 días">15 días</option>
                    <option value="30 días">30 días</option>
                    <option value="45 días">45 días</option>
                    <option value="60 días">60 días</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Notas</label>
                  <textarea
                    value={formulario.notas}
                    onChange={(e) => setFormulario({ ...formulario, notas: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition resize-none"
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setProveedorSeleccionado(null);
                      resetFormulario();
                    }}
                    className="flex-1 px-4 py-3 bg-[#1a1a1a] text-gray-400 rounded-xl font-medium hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] rounded-xl font-bold hover:shadow-lg hover:shadow-[#D4B896]/30 transition"
                  >
                    {proveedorSeleccionado ? "Actualizar" : "Crear"} Proveedor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista de Proveedores */}
        {proveedoresFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
              <span className="text-5xl">🏢</span>
            </div>
            <p className="text-gray-500 text-lg">
              {busqueda ? "No se encontraron proveedores" : "No hay proveedores registrados"}
            </p>
            {!busqueda && (
              <button
                onClick={handleNuevo}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] rounded-lg font-bold hover:shadow-lg hover:shadow-[#D4B896]/30 transition"
              >
                Crear Primer Proveedor
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proveedoresFiltrados.map((proveedor) => (
              <div
                key={proveedor.id}
                className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#D4B896]/30 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-[#D4B896]/10 text-[#D4B896] text-xs font-mono rounded">
                        {proveedor.codigo}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#D4B896] transition">
                      {proveedor.nombre}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditar(proveedor)}
                      className="p-2 text-gray-400 hover:text-[#D4B896] hover:bg-[#1a1a1a] rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEliminar(proveedor.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#1a1a1a] rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {proveedor.nit && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-gray-600">NIT:</span>
                      <span>{proveedor.nit}</span>
                    </div>
                  )}
                  {proveedor.telefono && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{proveedor.telefono}</span>
                    </div>
                  )}
                  {proveedor.email && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{proveedor.email}</span>
                    </div>
                  )}
                  {proveedor.terminos_pago && (
                    <div className="pt-2 border-t border-[#2a2a2a]">
                      <span className="text-xs text-gray-600">Términos: </span>
                      <span className="text-xs text-[#D4B896]">{proveedor.terminos_pago}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
