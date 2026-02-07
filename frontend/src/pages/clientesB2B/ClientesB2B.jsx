import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clientesB2BService from '../../services/clientesB2BService';
import FormularioCliente from './FormularioCliente';
import DetalleCliente from './DetalleCliente';

export default function ClientesB2B() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalFormulario, setModalFormulario] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [vistaActual, setVistaActual] = useState('tabla'); // 'tabla' o 'tarjetas'
  const [resumen, setResumen] = useState(null);
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    totalPaginas: 1,
    total: 0
  });

  useEffect(() => {
    cargarClientes();
    cargarResumen();
  }, [buscar, filtroEstado, paginacion.pagina]);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const params = {
        pagina: paginacion.pagina,
        limite: 20,
        ...(buscar && { buscar }),
        ...(filtroEstado && { estado: filtroEstado })
      };

      const data = await clientesB2BService.obtenerClientes(params);
      setClientes(data.clientes);
      setPaginacion({
        pagina: data.pagina,
        totalPaginas: data.totalPaginas,
        total: data.total
      });
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      alert('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const cargarResumen = async () => {
    try {
      const data = await clientesB2BService.obtenerResumenGeneral();
      setResumen(data);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  };

  const handleNuevoCliente = () => {
    setClienteSeleccionado(null);
    setModalFormulario(true);
  };

  const handleEditarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalFormulario(true);
  };

  const handleVerDetalle = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalDetalle(true);
  };

  const handleGuardarCliente = async () => {
    setModalFormulario(false);
    await cargarClientes();
    await cargarResumen();
  };

  const handleEliminarCliente = async (cliente) => {
    // Verificar si tiene saldo pendiente
    if (parseFloat(cliente.saldo_pendiente) > 0) {
      alert(`No se puede eliminar el cliente "${cliente.razon_social}" porque tiene un saldo pendiente de ${formatearMoneda(cliente.saldo_pendiente)}`);
      return;
    }

    // Confirmación
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar al cliente "${cliente.razon_social}"?\n\n` +
      `⚠️ Esta acción NO se puede deshacer.\n\n` +
      `Se eliminarán:\n` +
      `- El cliente\n` +
      `- Todo su historial de ventas\n` +
      `- Todos sus pagos registrados`
    );

    if (!confirmar) return;

    try {
      await clientesB2BService.eliminarCliente(cliente.id);
      alert('Cliente eliminado exitosamente');
      await cargarClientes();
      await cargarResumen();
    } catch (error) {
      const mensaje = error.response?.data?.error || 'Error al eliminar cliente';
      alert(mensaje);
    }
  };

  const handleCambiarEstado = async (cliente, nuevoEstado) => {
    const motivo = prompt(`¿Motivo para cambiar estado a ${nuevoEstado}?`);
    if (!motivo) return;

    try {
      await clientesB2BService.cambiarEstado(cliente.id, nuevoEstado, motivo);
      await cargarClientes();
      await cargarResumen();
      alert('Estado actualizado correctamente');
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar estado');
    }
  };

  const getEstadoBadge = (estado) => {
    const configs = {
      'Activo': { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✓' },
      'Inactivo': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '○' },
      'Suspendido': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⏸' },
      'Bloqueado': { bg: 'bg-red-100', text: 'text-red-800', icon: '🔒' }
    };

    const config = configs[estado] || configs['Inactivo'];

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        <span>{estado}</span>
      </span>
    );
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const calcularPorcentajeUso = (disponible, limite) => {
    if (!limite) return 0;
    return ((limite - disponible) / limite * 100).toFixed(1);
  };

  if (loading && clientes.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <svg className="w-8 h-8 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          </div>
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-700">Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Header con navegación */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="group flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm"
              >
                <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Volver</span>
              </button>
              
              <div className="h-8 w-px bg-white/20"></div>
              
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <svg className="w-8 h-8 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Clientes B2B
                </h1>
                <p className="text-gray-300 mt-1">Gestión de clientes corporativos y control de cartera</p>
              </div>
            </div>

            <button
              onClick={handleNuevoCliente}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-gray-900 font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Resumen con animaciones */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Clientes */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Total Clientes</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{resumen.totalClientes}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  ✓ {resumen.clientesActivos} activos
                </span>
              </div>
            </div>

            {/* Cartera Total */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-[#D4B896]">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <svg className="w-8 h-8 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Cartera Total</div>
              <div className="text-3xl font-bold text-[#D4B896]">
                {formatearMoneda(resumen.totalCartera)}
              </div>
              <div className="mt-2 text-xs text-gray-500">Saldo pendiente</div>
            </div>

            {/* Cartera Vencida */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Cartera Vencida</div>
              <div className="text-3xl font-bold text-red-600">
                {formatearMoneda(resumen.carteraVencida)}
              </div>
              <div className="mt-2 text-xs text-red-500 font-semibold">⚠ Requiere atención</div>
            </div>

            {/* Bloqueados */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Clientes Bloqueados</div>
              <div className="text-3xl font-bold text-orange-600">{resumen.clientesBloqueados}</div>
              <div className="mt-2 text-xs text-orange-500">Por mora o suspensión</div>
            </div>
          </div>
        )}

        {/* Barra de filtros y vista */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por razón social, documento, email o teléfono..."
                value={buscar}
                onChange={(e) => {
                  setBuscar(e.target.value);
                  setPaginacion({ ...paginacion, pagina: 1 });
                }}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent transition-all"
              />
            </div>

            {/* Filtro de estado */}
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginacion({ ...paginacion, pagina: 1 });
              }}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent transition-all"
            >
              <option value="">📋 Todos los estados</option>
              <option value="Activo">✓ Activo</option>
              <option value="Inactivo">○ Inactivo</option>
              <option value="Suspendido">⏸ Suspendido</option>
              <option value="Bloqueado">🔒 Bloqueado</option>
            </select>

            {/* Selector de vista */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setVistaActual('tabla')}
                className={`px-4 py-2 rounded-md transition-all ${
                  vistaActual === 'tabla'
                    ? 'bg-white shadow-md text-[#D4B896] font-semibold'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setVistaActual('tarjetas')}
                className={`px-4 py-2 rounded-md transition-all ${
                  vistaActual === 'tarjetas'
                    ? 'bg-white shadow-md text-[#D4B896] font-semibold'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM11 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM11 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Vista de Tabla */}
        {vistaActual === 'tabla' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Crédito
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {clientes.map((cliente, index) => (
                    <tr 
                      key={cliente.id} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#D4B896] to-[#c4a886] rounded-full flex items-center justify-center text-white font-bold">
                            {cliente.razon_social.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{cliente.razon_social}</div>
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">{cliente.tipo_documento}:</span> {cliente.numero_documento}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-800">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {cliente.nombre_contacto}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            {cliente.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            {cliente.telefono}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Límite de crédito</div>
                            <div className="text-sm font-bold text-gray-800">
                              {formatearMoneda(cliente.limite_credito)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Disponible</div>
                            <div className="text-sm font-semibold text-emerald-600">
                              {formatearMoneda(cliente.credito_disponible)}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${100 - calcularPorcentajeUso(cliente.credito_disponible, cliente.limite_credito)}%`
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            💳 {cliente.dias_credito} días de crédito
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {getEstadoBadge(cliente.estado)}
                          {cliente.bloqueado_por_mora && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                <span>⚠</span>
                                <span>Mora</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleVerDetalle(cliente)}
                            className="group px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 font-medium"
                            title="Ver detalles"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditarCliente(cliente)}
                            className="group px-3 py-2 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-all duration-200 font-medium"
                            title="Editar cliente"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleCambiarEstado(cliente, cliente.estado === 'Activo' ? 'Bloqueado' : 'Activo')}
                            className="group px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium"
                            title="Cambiar estado"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEliminarCliente(cliente)}
                            className="group px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium"
                            title="Eliminar cliente"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {paginacion.totalPaginas > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 font-medium">
                  Mostrando <span className="font-bold text-gray-800">{clientes.length}</span> de{' '}
                  <span className="font-bold text-gray-800">{paginacion.total}</span> clientes
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginacion({ ...paginacion, pagina: paginacion.pagina - 1 })}
                    disabled={paginacion.pagina === 1}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-[#D4B896] transition-all font-medium"
                  >
                    ← Anterior
                  </button>
                  <div className="px-4 py-2 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-white font-bold rounded-lg">
                    {paginacion.pagina} / {paginacion.totalPaginas}
                  </div>
                  <button
                    onClick={() => setPaginacion({ ...paginacion, pagina: paginacion.pagina + 1 })}
                    disabled={paginacion.pagina === paginacion.totalPaginas}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-[#D4B896] transition-all font-medium"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vista de Tarjetas */}
        {vistaActual === 'tarjetas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientes.map((cliente, index) => (
              <div
                key={cliente.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-t-4 border-[#D4B896]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header de la tarjeta */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#D4B896] to-[#c4a886] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {cliente.razon_social.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg leading-tight">
                        {cliente.razon_social}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {cliente.tipo_documento}: {cliente.numero_documento}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getEstadoBadge(cliente.estado)}
                    {cliente.bloqueado_por_mora && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        ⚠ Mora
                      </span>
                    )}
                  </div>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-4 space-y-4">
                  {/* Contacto */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Contacto</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{cliente.nombre_contacto}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span className="text-gray-600 truncate">{cliente.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span className="text-gray-600">{cliente.telefono}</span>
                      </div>
                    </div>
                  </div>

                  {/* Crédito */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Información de Crédito</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Límite:</span>
                        <span className="text-sm font-bold text-gray-800">
                          {formatearMoneda(cliente.limite_credito)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Disponible:</span>
                        <span className="text-sm font-bold text-emerald-600">
                          {formatearMoneda(cliente.credito_disponible)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${100 - calcularPorcentajeUso(cliente.credito_disponible, cliente.limite_credito)}%`
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        💳 {cliente.dias_credito} días de plazo
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer con acciones */}
                <div className="bg-gray-50 px-4 py-3 border-t flex gap-2">
                  <button
                    onClick={() => handleVerDetalle(cliente)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-medium"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleEditarCliente(cliente)}
                    className="flex-1 px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleCambiarEstado(cliente, cliente.estado === 'Activo' ? 'Bloqueado' : 'Activo')}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensaje cuando no hay clientes */}
        {clientes.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="mx-auto w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay clientes registrados</h3>
            <p className="text-gray-600 mb-6">Comienza agregando tu primer cliente corporativo</p>
            <button
              onClick={handleNuevoCliente}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-gray-900 font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Cliente
            </button>
          </div>
        )}
      </div>

      {/* Modal Formulario */}
      {modalFormulario && (
        <FormularioCliente
          cliente={clienteSeleccionado}
          onClose={() => setModalFormulario(false)}
          onGuardar={handleGuardarCliente}
        />
      )}

      {/* Modal Detalle */}
      {modalDetalle && clienteSeleccionado && (
        <DetalleCliente
          clienteId={clienteSeleccionado.id}
          onClose={() => setModalDetalle(false)}
          onEditar={handleEditarCliente}
        />
      )}
    </div>
  );
}