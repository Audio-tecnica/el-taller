import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gastosService } from '../../services/gastosService';
import { localesService } from '../../services/localesService';
import { proveedoresService } from '../../services/proveedoresService';
import toast from 'react-hot-toast';
import { 
  DollarSign, 
  Plus, 
  Edit2, 
  Trash2, 
  Filter, 
  Download,
  FileText,
  X,
  Check,
  Calendar,
  Building2,
  User,
  CreditCard
} from 'lucide-react';
import logo from '../../assets/logo.jpeg';

export default function Gastos() {
  const navigate = useNavigate();
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [locales, setLocales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [resumen, setResumen] = useState(null);

  // Filtros
  const hoy = new Date().toISOString().split('T')[0];
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [filtros, setFiltros] = useState({
    fecha_inicio: primerDiaMes,
    fecha_fin: hoy,
    categoria: '',
    local_id: '',
    proveedor_id: ''
  });

  // Formulario
  const [formulario, setFormulario] = useState({
    fecha: hoy,
    categoria: 'servicios_publicos',
    concepto: '',
    monto: '',
    local_id: '',
    proveedor_id: '',
    metodo_pago: 'efectivo',
    numero_factura: '',
    periodicidad: 'unico',
    notas: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [gastosData, categoriasData, localesData, proveedoresData, resumenData] = await Promise.all([
        gastosService.getGastos(filtros),
        gastosService.getCategorias(),
        localesService.getLocales(),
        proveedoresService.getProveedores(),
        gastosService.getResumen(filtros)
      ]);
      
      setGastos(gastosData);
      setCategorias(categoriasData);
      setLocales(localesData);
      setProveedores(proveedoresData);
      setResumen(resumenData);
    } catch (error) {
      toast.error('Error al cargar gastos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formulario.concepto || !formulario.monto) {
        toast.error('Concepto y monto son obligatorios');
        return;
      }

      if (parseFloat(formulario.monto) <= 0) {
        toast.error('El monto debe ser mayor a 0');
        return;
      }

      // Obtener usuario del localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const usuario_id = userData.id;

      if (!usuario_id) {
        toast.error('No se pudo identificar el usuario');
        return;
      }

      const gastoData = {
        ...formulario,
        usuario_id,
        local_id: formulario.local_id || null,
        proveedor_id: formulario.proveedor_id || null
      };

      if (gastoEditando) {
        await gastosService.updateGasto(gastoEditando.id, gastoData);
        toast.success('Gasto actualizado correctamente');
      } else {
        await gastosService.createGasto(gastoData);
        toast.success('Gasto registrado correctamente');
      }

      cerrarModal();
      cargarDatos();
    } catch (error) {
      toast.error('Error al guardar el gasto');
      console.error(error);
    }
  };

  const handleEditar = (gasto) => {
    setGastoEditando(gasto);
    setFormulario({
      fecha: gasto.fecha,
      categoria: gasto.categoria,
      concepto: gasto.concepto,
      monto: gasto.monto,
      local_id: gasto.local_id || '',
      proveedor_id: gasto.proveedor_id || '',
      metodo_pago: gasto.metodo_pago,
      numero_factura: gasto.numero_factura || '',
      periodicidad: gasto.periodicidad,
      notas: gasto.notas || ''
    });
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

    try {
      await gastosService.deleteGasto(id);
      toast.success('Gasto eliminado correctamente');
      cargarDatos();
    } catch (error) {
      toast.error('Error al eliminar el gasto');
      console.error(error);
    }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setGastoEditando(null);
    setFormulario({
      fecha: hoy,
      categoria: 'servicios_publicos',
      concepto: '',
      monto: '',
      local_id: '',
      proveedor_id: '',
      metodo_pago: 'efectivo',
      numero_factura: '',
      periodicidad: 'unico',
      notas: ''
    });
  };

  const formatMoney = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getIconoCategoria = (categoria) => {
    const cat = categorias.find(c => c.value === categoria);
    return cat?.icon || '📦';
  };

  const getNombreCategoria = (categoria) => {
    const cat = categorias.find(c => c.value === categoria);
    return cat?.label || categoria;
  };

  if (loading && gastos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg">Cargando gastos...</p>
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
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <img src={logo} alt="El Taller" className="w-10 h-10 rounded-xl object-contain bg-black" />
              <div>
                <h1 className="text-xl font-black text-white">Gastos Operativos</h1>
                <p className="text-xs text-[#D4B896]">Control de egresos</p>
              </div>
            </button>

            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              <Plus size={20} />
              Nuevo Gasto
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tarjetas de Resumen */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-2xl p-5">
              <p className="text-red-400 text-sm mb-1">Total Gastos</p>
              <p className="text-3xl font-black text-white">{formatMoney(resumen.totalGastos)}</p>
              <p className="text-xs text-red-400/70 mt-1">{resumen.cantidadGastos} registros</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-2xl p-5">
              <p className="text-orange-400 text-sm mb-1">Promedio por Gasto</p>
              <p className="text-2xl font-black text-white">
                {formatMoney(resumen.cantidadGastos > 0 ? resumen.totalGastos / resumen.cantidadGastos : 0)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-5">
              <p className="text-purple-400 text-sm mb-1">Categorías</p>
              <p className="text-3xl font-black text-white">{resumen.porCategoria?.length || 0}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-5">
              <p className="text-blue-400 text-sm mb-1">Este Mes</p>
              <p className="text-2xl font-black text-white">
                {formatMoney(
                  resumen.porMes?.find(m => m.periodo === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)?.total || 0
                )}
              </p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-[#D4B896]" />
            <h3 className="text-white font-bold">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Fecha Inicio</label>
              <input
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4B896]"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">Fecha Fin</label>
              <input
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4B896]"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">Categoría</label>
              <select
                value={filtros.categoria}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4B896]"
              >
                <option value="">Todas</option>
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">Local</label>
              <select
                value={filtros.local_id}
                onChange={(e) => setFiltros({ ...filtros, local_id: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4B896]"
              >
                <option value="">Todos</option>
                {locales.map(local => (
                  <option key={local.id} value={local.id}>{local.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">Proveedor</label>
              <select
                value={filtros.proveedor_id}
                onChange={(e) => setFiltros({ ...filtros, proveedor_id: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#D4B896]"
              >
                <option value="">Todos</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Gastos */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#D4B896]">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#D4B896]">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#D4B896]">Concepto</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#D4B896]">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#D4B896]">Local</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#D4B896]">Proveedor</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[#D4B896]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {gastos.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No hay gastos registrados
                    </td>
                  </tr>
                ) : (
                  gastos.map(gasto => (
                    <tr key={gasto.id} className="hover:bg-[#1a1a1a] transition">
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {new Date(gasto.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span>{getIconoCategoria(gasto.categoria)}</span>
                          <span className="text-white">{getNombreCategoria(gasto.categoria)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white text-sm">{gasto.concepto}</p>
                          {gasto.numero_factura && (
                            <p className="text-xs text-gray-500">Factura: {gasto.numero_factura}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-white font-semibold">{formatMoney(gasto.monto)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {gasto.local?.nombre || 'Todos'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {gasto.proveedor?.nombre || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditar(gasto)}
                            className="p-2 hover:bg-[#2a2a2a] rounded-lg transition text-blue-400"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleEliminar(gasto.id)}
                            className="p-2 hover:bg-[#2a2a2a] rounded-lg transition text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Crear/Editar Gasto */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#141414] border-b border-[#2a2a2a] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {gastoEditando ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              <button
                onClick={cerrarModal}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formulario.fecha}
                    onChange={(e) => setFormulario({ ...formulario, fecha: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4B896]"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formulario.categoria}
                    onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4B896]"
                    required
                  >
                    {categorias.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">
                  Concepto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formulario.concepto}
                  onChange={(e) => setFormulario({ ...formulario, concepto: e.target.value })}
                  placeholder="Ej: Pago de energía eléctrica mes de febrero"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4B896]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Monto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.monto}
                    onChange={(e) => setFormulario({ ...formulario, monto: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4B896]"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Método de Pago</label>
                  <select
                    value={formulario.metodo_pago}
                    onChange={(e) => setFormulario({ ...formulario, metodo_pago: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4B896]"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="datafono">Datáfono</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Local</label>
                  <select
                    value={formulario.local_id}
                    onChange={(e) => setFormulario({ ...formulario, local_id: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4B896]"
                  >
                    <option value="">Todos los locales</option>
                    {locales.map(local => (
                      <option key={local.id} value={local.id}>{local.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Proveedor</label>
                  <select
                    value={formulario.proveedor_id}
                    onChange={(e) => setFormulario({ ...formulario, proveedor_id: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4B896]"
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map(prov => (
                      <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Número de Factura</label>
                  <input
                    type="text"
                    value={formulario.numero_factura}
                    onChange={(e) => setFormulario({ ...formulario, numero_factura: e.target.value })}
                    placeholder="Opcional"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4B896]"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Periodicidad</label>
                  <select
                    value={formulario.periodicidad}
                    onChange={(e) => setFormulario({ ...formulario, periodicidad: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4B896]"
                  >
                    <option value="unico">Único</option>
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Notas</label>
                <textarea
                  value={formulario.notas}
                  onChange={(e) => setFormulario({ ...formulario, notas: e.target.value })}
                  rows="3"
                  placeholder="Observaciones adicionales..."
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4B896] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-[#2a2a2a] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  {gastoEditando ? 'Actualizar' : 'Registrar'} Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
