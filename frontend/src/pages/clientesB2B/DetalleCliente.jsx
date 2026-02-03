import { useState, useEffect } from 'react';
import clientesB2BService from '../../services/clientesB2BService';

export default function DetalleCliente({ clienteId, onClose, onEditar }) {
  const [cliente, setCliente] = useState(null);
  const [estadoCuenta, setEstadoCuenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabActiva, setTabActiva] = useState('info');

  useEffect(() => {
    console.log('🔍 DetalleCliente montado con ID:', clienteId);
    if (clienteId) {
      cargarDatos();
    } else {
      console.error('❌ No se recibió clienteId');
      setError('No se recibió ID de cliente');
      setLoading(false);
    }
  }, [clienteId]);

  const cargarDatos = async () => {
    try {
      console.log('📡 Iniciando carga de datos para cliente:', clienteId);
      setLoading(true);
      setError(null);

      // Cargar datos del cliente
      console.log('🔄 Cargando datos del cliente...');
      const clienteData = await clientesB2BService.obtenerClientePorId(clienteId);
      console.log('✅ Datos del cliente recibidos:', clienteData);
      setCliente(clienteData);

      // Cargar estado de cuenta
      try {
        console.log('🔄 Cargando estado de cuenta...');
        const cuentaData = await clientesB2BService.obtenerEstadoCuenta(clienteId);
        console.log('✅ Estado de cuenta recibido:', cuentaData);
        setEstadoCuenta(cuentaData);
      } catch (cuentaError) {
        console.warn('⚠️ Error al cargar estado de cuenta (no crítico):', cuentaError);
        // No es crítico si no se puede cargar el estado de cuenta
      }

    } catch (error) {
      console.error('❌ Error al cargar datos del cliente:', error);
      console.error('Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.mensaje || error.message || 'Error al cargar datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    if (valor === null || valor === undefined) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch  {
      return 'Fecha inválida';
    }
  };

  const getEstadoPagoBadge = (estado) => {
    const configs = {
      'Pendiente': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
      'Parcial': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '💵' },
      'Pagado': { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      'Vencido': { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠' },
      'Anulado': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '✕' }
    };

    const config = configs[estado] || configs['Pendiente'];

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        <span>{estado}</span>
      </span>
    );
  };

  // Loading state mejorado
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <svg className="w-8 h-8 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-700">Cargando datos del cliente...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state mejorado
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Error al cargar datos</h3>
            <p className="text-center text-gray-600">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={cargarDatos}
                className="px-6 py-2 bg-[#D4B896] text-black font-semibold rounded-lg hover:bg-[#c4a886] transition"
              >
                Reintentar
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No cliente state
  if (!cliente) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Cliente no encontrado</h3>
            <p className="text-center text-gray-600">No se pudieron cargar los datos del cliente</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#D4B896] text-black font-semibold rounded-lg hover:bg-[#c4a886] transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-[#D4B896] to-[#c4a886] px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-[#D4B896]">
                  {cliente.razon_social?.charAt(0) || '?'}
                </span>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{cliente.razon_social || 'Sin nombre'}</h2>
                <p className="text-sm text-gray-800 mt-1">
                  <span className="font-semibold">{cliente.tipo_documento || 'NIT'}:</span> {cliente.numero_documento || 'N/A'}
                </p>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${
                    cliente.estado === 'Activo' ? 'bg-green-100 text-green-800' :
                    cliente.estado === 'Bloqueado' ? 'bg-red-100 text-red-800' :
                    cliente.estado === 'Suspendido' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cliente.estado === 'Activo' && '✓'}
                    {cliente.estado === 'Bloqueado' && '🔒'}
                    {cliente.estado === 'Suspendido' && '⏸'}
                    {cliente.estado || 'Desconocido'}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-800 hover:text-gray-900 transition-colors"
              title="Cerrar"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs mejorados */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setTabActiva('info')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold border-b-3 transition-all ${
                tabActiva === 'info'
                  ? 'border-[#D4B896] text-[#D4B896] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Información
            </button>
            <button
              onClick={() => setTabActiva('cuenta')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold border-b-3 transition-all ${
                tabActiva === 'cuenta'
                  ? 'border-[#D4B896] text-[#D4B896] bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              Estado de Cuenta
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Tab Información */}
          {tabActiva === 'info' && (
            <div className="space-y-6">
              {/* Resumen de Crédito */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-600 uppercase">Límite de Crédito</div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {formatearMoneda(cliente.limite_credito)}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-600 uppercase">Crédito Disponible</div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-700">
                    {formatearMoneda(cliente.credito_disponible)}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-amber-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-600 uppercase">Días de Crédito</div>
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-amber-700">
                    {cliente.dias_credito || 0} días
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Nombre</div>
                    <div className="font-semibold text-gray-800">{cliente.nombre_contacto || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Cargo</div>
                    <div className="font-semibold text-gray-800">{cliente.cargo_contacto || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</div>
                    <div className="font-semibold text-gray-800 truncate">{cliente.email || 'N/A'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono</div>
                    <div className="font-semibold text-gray-800">{cliente.telefono || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Dirección
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="font-semibold text-gray-800">{cliente.direccion || 'No especificada'}</div>
                  <div className="text-gray-600">
                    {cliente.ciudad && cliente.departamento 
                      ? `${cliente.ciudad}, ${cliente.departamento}`
                      : 'Ciudad no especificada'
                    }
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              {(cliente.total_ventas || cliente.total_facturas || cliente.ultima_compra) && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Estadísticas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <div className="text-xs font-semibold text-purple-600 uppercase mb-1">Total Ventas</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {formatearMoneda(cliente.total_ventas || 0)}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                      <div className="text-xs font-semibold text-indigo-600 uppercase mb-1">Total Facturas</div>
                      <div className="text-2xl font-bold text-indigo-800">
                        {cliente.total_facturas || 0}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                      <div className="text-xs font-semibold text-pink-600 uppercase mb-1">Última Compra</div>
                      <div className="text-sm font-bold text-pink-800">
                        {formatearFecha(cliente.ultima_compra)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              {cliente.notas && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Notas
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{cliente.notas}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Estado de Cuenta */}
          {tabActiva === 'cuenta' && (
            <div className="space-y-6">
              {estadoCuenta ? (
                <>
                  {/* Resumen */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-gray-600 uppercase">Total Pendiente</div>
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-yellow-700 mb-2">
                        {formatearMoneda(estadoCuenta.resumen?.totalPendiente || 0)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {estadoCuenta.resumen?.facturasPendientes || 0} facturas pendientes
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-gray-600 uppercase">Total Vencido</div>
                        <div className="p-2 bg-red-100 rounded-lg">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-red-700 mb-2">
                        {formatearMoneda(estadoCuenta.resumen?.totalVencido || 0)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {estadoCuenta.resumen?.facturasVencidas || 0} facturas vencidas
                      </div>
                    </div>
                  </div>

                  {/* Facturas Pendientes */}
                  {estadoCuenta.facturasPendientes && estadoCuenta.facturasPendientes.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                      <h3 className="font-bold text-gray-800 mb-4 text-lg">Facturas Pendientes</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Factura</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Fecha</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Vencimiento</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Total</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Pagado</th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Saldo</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {estadoCuenta.facturasPendientes.map((factura) => (
                              <tr key={factura.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-gray-800">{factura.numero_factura}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{formatearFecha(factura.fecha_venta)}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{formatearFecha(factura.fecha_vencimiento)}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatearMoneda(factura.total)}</td>
                                <td className="px-4 py-3 text-right text-green-600">{formatearMoneda(factura.monto_pagado)}</td>
                                <td className="px-4 py-3 text-right font-bold text-yellow-600">
                                  {formatearMoneda(factura.saldo_pendiente)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {getEstadoPagoBadge(factura.estado_pago)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Pagos Recientes */}
                  {estadoCuenta.pagosRecientes && estadoCuenta.pagosRecientes.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                      <h3 className="font-bold text-gray-800 mb-4 text-lg">Pagos Recientes</h3>
                      <div className="space-y-3">
                        {estadoCuenta.pagosRecientes.map((pago) => (
                          <div key={pago.id} className="bg-green-50 p-4 rounded-lg flex justify-between items-center border-l-4 border-green-500">
                            <div>
                              <div className="font-semibold text-gray-800">Recibo: {pago.numero_recibo}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Factura: {pago.venta?.numero_factura || 'N/A'} - {formatearFecha(pago.fecha_pago)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-700">{formatearMoneda(pago.monto)}</div>
                              <div className="text-xs text-gray-600 mt-1">{pago.metodo_pago}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white p-12 rounded-xl shadow-md text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No hay datos de cuenta</h3>
                  <p className="text-gray-600">No se encontró información de estado de cuenta para este cliente</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Cliente ID:</span> {cliente.id}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                console.log('🔄 Recargando datos...');
                cargarDatos();
              }}
              className="px-6 py-2 border-2 border-[#D4B896] text-[#D4B896] font-semibold rounded-lg hover:bg-[#D4B896] hover:text-black transition-all"
            >
              🔄 Recargar
            </button>
            <button
              onClick={() => onEditar(cliente)}
              className="px-6 py-2 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-black font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              ✏️ Editar Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}