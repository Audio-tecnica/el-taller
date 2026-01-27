import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'cajero',
    local_asignado_id: null,
    activo: true
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      // Asumiendo que tienes una ruta para listar usuarios
      const response = await api.get('/auth/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (usuarioEditando) {
        // Actualizar usuario existente
        await api.put(`/auth/usuarios/${usuarioEditando.id}`, formData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        await api.post('/auth/registro', formData);
        toast.success('Usuario creado exitosamente');
      }
      
      setMostrarModal(false);
      limpiarFormulario();
      cargarUsuarios();
    } catch (error) {
      const mensaje = error.response?.data?.error || 'Error al guardar usuario';
      toast.error(mensaje);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'cajero',
      local_asignado_id: null,
      activo: true
    });
    setUsuarioEditando(null);
  };

  const abrirModalNuevo = () => {
    limpiarFormulario();
    setMostrarModal(true);
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '', // No mostrar password
      rol: usuario.rol,
      local_asignado_id: usuario.local_asignado_id,
      activo: usuario.activo
    });
    setMostrarModal(true);
  };

  const toggleActivo = async (usuario) => {
    try {
      await api.put(`/auth/usuarios/${usuario.id}`, {
        activo: !usuario.activo
      });
      toast.success(`Usuario ${!usuario.activo ? 'activado' : 'desactivado'}`);
      cargarUsuarios();
    } catch  {
      toast.error('Error al cambiar estado del usuario');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">👥 Gestión de Usuarios</h1>
            <p className="text-gray-500 mt-1">Administrar usuarios del sistema</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={abrirModalNuevo}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition font-medium"
            >
              ➕ Nuevo Usuario
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#2a2a2a] transition"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Nombre</th>
                <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                <th className="text-left p-4 text-gray-400 font-medium">Rol</th>
                <th className="text-left p-4 text-gray-400 font-medium">Estado</th>
                <th className="text-left p-4 text-gray-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a] transition">
                  <td className="p-4">
                    <p className="text-white font-medium">{usuario.nombre}</p>
                  </td>
                  <td className="p-4 text-gray-400">{usuario.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      usuario.rol === 'administrador' 
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {usuario.rol === 'administrador' ? '👔 Admin' : '💼 Cajero'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleActivo(usuario)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        usuario.activo
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {usuario.activo ? '✓ Activo' : '✗ Inactivo'}
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => abrirModalEditar(usuario)}
                      className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition text-sm font-medium"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info sobre control de acceso */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔐</div>
            <div className="text-sm text-blue-400">
              <p className="font-medium mb-1">Control de Acceso por Turnos</p>
              <p className="text-blue-300/80">
                Los cajeros solo pueden iniciar sesión cuando tienen un turno abierto. 
                Una vez que cierran su turno, no podrán acceder hasta que un administrador 
                les abra un nuevo turno.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Crear/Editar Usuario */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Contraseña {usuarioEditando && '(dejar vacío para no cambiar)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  required={!usuarioEditando}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({...formData, rol: e.target.value})}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cajero">💼 Cajero</option>
                  <option value="administrador">👔 Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModal(false);
                    limpiarFormulario();
                  }}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#2a2a2a] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition font-medium"
                >
                  {usuarioEditando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}