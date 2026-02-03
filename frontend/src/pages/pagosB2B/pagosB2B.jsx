import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import pagosB2BService from '../../services/pagosB2BService';
import FormularioPagoB2B from './FormularioPagoB2B';
import DetallePagoB2B from './DetallePagoB2B';

export default function PagosB2B() {
  const navigate = useNavigate();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Aplicado');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [vistaActual, setVistaActual] = useState('tabla');
  const [resumen, setResumen] = useState(null);
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    totalPaginas: 1,
    total: 0
  });

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        pagina: paginacion.pagina,
        limite: 20,
        ...(buscar && { buscar }),
        ...(filtroEstado && { estado: filtroEstado }),
        ...(filtroMetodo && { metodo_pago: filtroMetodo })
      };

      const [pagosData, resumenData] = await Promise.all([
        pagosB2BService.obtenerPagos(params),
        pagosB2BService.obtenerResumenPagos()
      ]);

      setPagos(pagosData.pagos || []);
      setPaginacion({
        pagina: pagosData.pagina || 1,
        totalPaginas: pagosData.totalPaginas || 1,
        total: pagosData.total || pagosData.pagos?.length || 0
      });
      setResumen(resumenData);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  }, [buscar, filtroEstado, filtroMetodo, paginacion.pagina]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleVerDetalle = async (pago) => {
    try {
      const pagoCompleto = await pagosB2BService.obtenerPagoPorId(pago.id);
      setPagoSeleccionado(pagoCompleto);
      setMostrarDetalle(true);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      alert('Error al cargar detalle del pago');
    }
  };

  const handleNuevoPago = () => setMostrarFormulario(true);

  const handlePagoCreado = () => {
    setMostrarFormulario(false);
    cargarDatos();
  };

  // ── Badges ────────────────────────────────────────────────────
  const getEstadoBadge = (estado) => {
    const configs = {
      'Aplicado': { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✓' },
      'Anulado':  { bg: 'bg-red-100',     text: 'text-red-800',     icon: '✕' }
    };
    const config = configs[estado] || configs['Aplicado'];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        <span>{estado}</span>
      </span>
    );
  };

  const getMetodoBadge = (metodo) => {
    const configs = {
      'Efectivo':      { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '💵' },
      'Transferencia': { bg: 'bg-blue-100',    text: 'text-blue-700',    icon: '🏦' },
      'Cheque':        { bg: 'bg-purple-100',  text: 'text-purple-700',  icon: '📝' },
      'Tarjeta':       { bg: 'bg-amber-100',   text: 'text-amber-700',   icon: '💳' }
    };
    const config = configs[metodo] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '💰' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        <span>{metodo}</span>
      </span>
    );
  };

  // ── Utilidades ────────────────────────────────────────────────
  const formatearMoneda = (valor) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor || 0);

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });

  const formatearFechaHora = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ── LOADING ───────────────────────────────────────────────────
  if (loading && pagos.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <svg className="w-8 h-8 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h12V6a2 2 0 00-2-2H4zM2 9v5a2 2 0 002 2h8a2 2 0 002-2V9H2zm7 2a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
          </div>
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-700">Cargando pagos...</p>
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">

      {/* ═══ HEADER ════════════════════════════════════════════════ */}
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
                    <path d="M4 4a2 2 0 00-2 2v1h12V6a2 2 0 00-2-2H4zM2 9v5a2 2 0 002 2h8a2 2 0 002-2V9H2zm7 2a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                  Pagos B2B
                </h1>
                <p className="text-gray-300 mt-1">Registro de pagos corporativos y control de cartera</p>
              </div>
            </div>

            <button
              onClick={handleNuevoPago}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-gray-900 font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Registrar Pago</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ CONTENIDO ═════════════════════════════════════════════ */}
      <div className="container mx-auto px-6 py-8">

        {/* ── Resumen ───────────────────────────────────────────── */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            {/* Total Cobrado */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Total Cobrado</div>
              <div className="text-3xl font-bold text-emerald-600 mb-2">{formatearMoneda(resumen.totalPagos)}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  ✓ {resumen.cantidadPagos} pagos
                </span>
              </div>
            </div>

            {/* Por Método — dinámico desde backend, máximo 3 cards */}
            {resumen.porMetodo?.slice(0, 3).map((metodo, index) => {
              const colores = [
                { border: 'border-blue-500',   bg: 'bg-blue-100',   icon: 'text-blue-600',   text: 'text-blue-600',  badge: 'bg-blue-100 text-blue-700' },
                { border: 'border-purple-500', bg: 'bg-purple-100', icon: 'text-purple-600', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
                { border: 'border-amber-500',  bg: 'bg-amber-100',  icon: 'text-amber-600',  text: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700' }
              ];
              const c = colores[index] || colores[0];
              return (
                <div key={index} className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 ${c.border}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${c.bg} rounded-lg`}>
                      <svg className={`w-8 h-8 ${c.icon}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h12V6a2 2 0 00-2-2H4zM2 9v5a2 2 0 002 2h8a2 2 0 002-2V9H2zm7 2a1 1 0 100 2 1 1 0 000-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-600 mb-1">{metodo.metodo}</div>
                  <div className={`text-3xl font-bold ${c.text} mb-2`}>{formatearMoneda(metodo.total)}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full ${c.badge} font-semibold`}>
                      💰 {metodo.cantidad} pagos
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Placeholders si no hay métodos aún */}
            {(!resumen.porMetodo || resumen.porMetodo.length === 0) && [1,2,3].map(i => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h12V6a2 2 0 00-2-2H4zM2 9v5a2 2 0 002 2h8a2 2 0 002-2V9H2zm7 2a1 1 0 100 2 1 1 0 000-2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-400 mb-1">Sin datos</div>
                <div className="text-3xl font-bold text-gray-300">$ 0</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filtros ───────────────────────────────────────────── */}
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
                placeholder="Buscar por recibo, cliente, factura..."
                value={buscar}
                onChange={(e) => {
                  setBuscar(e.target.value);
                  setPaginacion(prev => ({ ...prev, pagina: 1 }));
                }}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent transition-all"
              />
            </div>

            {/* Filtro estado */}
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginacion(prev => ({ ...prev, pagina: 1 }));
              }}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent transition-all bg-white"
            >
              <option value="">📋 Todos los estados</option>
              <option value="Aplicado">✓ Aplicado</option>
              <option value="Anulado">✕ Anulado</option>
            </select>

            {/* Filtro método */}
            <select
              value={filtroMetodo}
              onChange={(e) => {
                setFiltroMetodo(e.target.value);
                setPaginacion(prev => ({ ...prev, pagina: 1 }));
              }}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent transition-all bg-white"
            >
              <option value="">💰 Todos los métodos</option>
              <option value="Efectivo">💵 Efectivo</option>
              <option value="Transferencia">🏦 Transferencia</option>
              <option value="Cheque">📝 Cheque</option>
              <option value="Tarjeta">💳 Tarjeta</option>
            </select>

            {/* Toggle vista */}
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

        {/* ═══ VISTA TABLA ═══════════════════════════════════════════ */}
        {vistaActual === 'tabla' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Recibo</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Factura</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Método</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {pagos.map((pago, index) => (
                    <tr
                      key={pago.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Recibo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${pago.estado === 'Anulado' ? 'bg-gradient-to-br from-red-400 to-red-500' : 'bg-gradient-to-br from-emerald-500 to-emerald-400'}`}>
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{pago.numero_recibo}</div>
                            <div className="text-sm text-gray-500">
                              {pago.referencia_pago && <span>Ref: {pago.referencia_pago}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-800">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold">{pago.cliente?.razon_social || pago.venta?.cliente?.razon_social}</span>
                          </div>
                          <div className="text-sm text-gray-500 ml-6">
                            {pago.cliente?.numero_documento || pago.venta?.cliente?.numero_documento}
                          </div>
                        </div>
                      </td>

                      {/* Factura asociada */}
                      <td className="px-6 py-4">
                        {pago.venta ? (
                          <div>
                            <div className="text-sm font-semibold text-blue-700">{pago.venta.numero_factura}</div>
                            <div className="text-xs text-gray-500">Saldo: {formatearMoneda(pago.venta.saldo_pendiente)}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800 font-medium">{formatearFecha(pago.fecha_pago)}</div>
                        <div className="text-xs text-gray-500">{formatearFechaHora(pago.fecha_pago)}</div>
                      </td>

                      {/* Método */}
                      <td className="px-6 py-4">
                        {getMetodoBadge(pago.metodo_pago)}
                        {pago.banco && (
                          <div className="text-xs text-gray-500 mt-1">{pago.banco}</div>
                        )}
                      </td>

                      {/* Monto */}
                      <td className="px-6 py-4">
                        <div className={`text-lg font-bold ${pago.estado === 'Anulado' ? 'line-through text-gray-400' : 'text-emerald-600'}`}>
                          {formatearMoneda(pago.monto)}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        {getEstadoBadge(pago.estado)}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleVerDetalle(pago)}
                            className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 font-medium"
                            title="Ver detalles"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                  Mostrando <span className="font-bold text-gray-800">{pagos.length}</span> de{' '}
                  <span className="font-bold text-gray-800">{paginacion.total}</span> pagos
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginacion(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                    disabled={paginacion.pagina === 1}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-[#D4B896] transition-all font-medium"
                  >
                    ← Anterior
                  </button>
                  <div className="px-4 py-2 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-white font-bold rounded-lg">
                    {paginacion.pagina} / {paginacion.totalPaginas}
                  </div>
                  <button
                    onClick={() => setPaginacion(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
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

        {/* ═══ VISTA TARJETAS ════════════════════════════════════════ */}
        {vistaActual === 'tarjetas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagos.map((pago, index) => (
              <div
                key={pago.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-t-4 border-emerald-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header tarjeta */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${pago.estado === 'Anulado' ? 'bg-gradient-to-br from-red-400 to-red-500' : 'bg-gradient-to-br from-emerald-500 to-emerald-400'}`}>
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg leading-tight">{pago.numero_recibo}</h3>
                      <p className="text-sm text-gray-500">{formatearFecha(pago.fecha_pago)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {getEstadoBadge(pago.estado)}
                    {getMetodoBadge(pago.metodo_pago)}
                  </div>
                </div>

                {/* Contenido tarjeta */}
                <div className="p-4 space-y-4">
                  {/* Cliente */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Cliente</div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-gray-700">{pago.cliente?.razon_social || pago.venta?.cliente?.razon_social}</span>
                    </div>
                    <div className="text-sm text-gray-500 ml-6">{pago.cliente?.numero_documento || pago.venta?.cliente?.numero_documento}</div>
                  </div>

                  {/* Monto grande centrado */}
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Monto Pagado</div>
                    <div className={`text-3xl font-bold ${pago.estado === 'Anulado' ? 'line-through text-gray-400' : 'text-emerald-600'}`}>
                      {formatearMoneda(pago.monto)}
                    </div>
                    {pago.banco && (
                      <div className="text-xs text-gray-500 mt-1">Banco: {pago.banco}</div>
                    )}
                    {pago.referencia_pago && (
                      <div className="text-xs text-gray-500">Ref: {pago.referencia_pago}</div>
                    )}
                  </div>

                  {/* Factura asociada */}
                  {pago.venta && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Factura Asociada</div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-blue-700">{pago.venta.numero_factura}</span>
                        <span className="text-xs text-gray-500">Saldo: {formatearMoneda(pago.venta.saldo_pendiente)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer tarjeta */}
                <div className="bg-gray-50 px-4 py-3 border-t flex gap-2">
                  <button
                    onClick={() => handleVerDetalle(pago)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-medium"
                  >
                    Ver Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Estado vacío ──────────────────────────────────────── */}
        {pagos.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="mx-auto w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay pagos registrados</h3>
            <p className="text-gray-600 mb-6">Comienza registrando tu primer pago corporativo B2B</p>
            <button
              onClick={handleNuevoPago}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-gray-900 font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar Pago
            </button>
          </div>
        )}
      </div>

      {/* ═══ MODALES ═══════════════════════════════════════════════ */}
      {mostrarFormulario && (
        <FormularioPagoB2B
          onClose={() => setMostrarFormulario(false)}
          onGuardar={handlePagoCreado}
        />
      )}

      {mostrarDetalle && pagoSeleccionado && (
        <DetallePagoB2B
          pago={pagoSeleccionado}
          onClose={() => {
            setMostrarDetalle(false);
            setPagoSeleccionado(null);
          }}
          onActualizar={cargarDatos}
        />
      )}
    </div>
  );
}