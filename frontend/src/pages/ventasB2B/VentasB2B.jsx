import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ventasB2BService from '../../services/ventasB2BService';
import FormularioVentaB2B from './FormularioVentaB2B';
import DetalleVentaB2B from './DetalleVentaB2B';

export default function VentasB2B() {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
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
        ...(filtroEstado && { estado_pago: filtroEstado })
      };

      const [ventasData, resumenData] = await Promise.all([
        ventasB2BService.obtenerVentas(params),
        ventasB2BService.obtenerResumenVentas()
      ]);

      setVentas(ventasData.ventas || []);
      setPaginacion({
        pagina: ventasData.pagina || 1,
        totalPaginas: ventasData.totalPaginas || 1,
        total: ventasData.total || ventasData.ventas?.length || 0
      });
      setResumen(resumenData);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    } finally {
      setLoading(false);
    }
  }, [buscar, filtroEstado, paginacion.pagina]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleVerDetalle = async (venta) => {
    try {
      const ventaCompleta = await ventasB2BService.obtenerVentaPorId(venta.id);
      setVentaSeleccionada(ventaCompleta);
      setMostrarDetalle(true);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      alert('Error al cargar detalle de la venta');
    }
  };

  const handleNuevaVenta = () => {
    setMostrarFormulario(true);
  };

  const handleVentaCreada = () => {
    setMostrarFormulario(false);
    cargarDatos();
  };

  // ── Badges de estado con iconos ──────────────────────────────
  const getEstadoBadge = (estado) => {
    const configs = {
      'Pagado':    { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✓' },
      'Pendiente': { bg: 'bg-amber-100',   text: 'text-amber-800',   icon: '⏳' },
      'Parcial':   { bg: 'bg-blue-100',    text: 'text-blue-800',    icon: '◐' },
      'Vencido':   { bg: 'bg-red-100',     text: 'text-red-800',     icon: '⚠' },
      'Anulado':   { bg: 'bg-gray-100',    text: 'text-gray-600',    icon: '✕' }
    };
    const config = configs[estado] || configs['Pendiente'];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        <span>{estado}</span>
      </span>
    );
  };

  // ── Utilidades ────────────────────────────────────────────────
  const formatearMoneda = (valor) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor || 0);

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });

  // ── Porcentaje cobrado ────────────────────────────────────────
  const calcularPorcentajeCobrado = (pagado, total) => {
    if (!total) return 0;
    return ((pagado / total) * 100).toFixed(1);
  };

  // ── LOADING (spinner idéntico al de ClientesB2B) ─────────────
  if (loading && ventas.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <svg className="w-8 h-8 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.414 3L15 6.586A1 1 0 0116 7.414V16a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
            </svg>
          </div>
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-700">Cargando facturas...</p>
      </div>
    );
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">

      {/* ═══ HEADER (mismo patrón que ClientesB2B) ═══════════════ */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botón Volver */}
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

              {/* Título */}
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <svg className="w-8 h-8 text-[#D4B896]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.414 3L15 6.586A1 1 0 0116 7.414V16a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                  </svg>
                  Ventas B2B
                </h1>
                <p className="text-gray-300 mt-1">Gestión de facturas corporativas y control de cobros</p>
              </div>
            </div>

            {/* Botón Nueva Factura */}
            <button
              onClick={handleNuevaVenta}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-gray-900 font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Factura</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ CONTENIDO ═════════════════════════════════════════════ */}
      <div className="container mx-auto px-6 py-8">

        {/* ── Resumen (4 cards con iconos, hover, borde izquierdo) ── */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            {/* Total Ventas */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.414 3L15 6.586A1 1 0 0116 7.414V16a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                  </svg>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Total Ventas</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{formatearMoneda(resumen.totalVentas)}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  📄 {resumen.cantidadVentas} facturas
                </span>
              </div>
            </div>

            {/* Por Cobrar */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-amber-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Por Cobrar</div>
              <div className="text-3xl font-bold text-amber-600">{formatearMoneda(resumen.totalPendiente)}</div>
              <div className="mt-2 text-xs text-amber-500 font-semibold">⏳ Pendiente de pago</div>
            </div>

            {/* Cobrado */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">Cobrado</div>
              <div className="text-3xl font-bold text-emerald-600">{formatearMoneda(resumen.totalCobrado)}</div>
              <div className="mt-2 text-xs text-emerald-500 font-semibold">✓ Pagado correctamente</div>
            </div>

            {/* A Crédito */}
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h12V6a2 2 0 00-2-2H4zM2 9v5a2 2 0 002 2h8a2 2 0 002-2V9H2zm7 2a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-1">A Crédito</div>
              <div className="text-3xl font-bold text-purple-600">{resumen.ventasCredito || 0}</div>
              <div className="mt-2 text-xs text-purple-500">💳 Facturas a crédito</div>
            </div>
          </div>
        )}

        {/* ── Barra de filtros ──────────────────────────────────── */}
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
                placeholder="Buscar por factura, cliente, fecha..."
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
              <option value="Pagado">✓ Pagado</option>
              <option value="Pendiente">⏳ Pendiente</option>
              <option value="Parcial">◐ Parcial</option>
              <option value="Vencido">⚠ Vencido</option>
              <option value="Anulado">✕ Anulado</option>
            </select>

            {/* Selector de vista tabla / tarjetas */}
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Factura</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Montos</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {ventas.map((venta, index) => (
                    <tr
                      key={venta.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Factura */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#D4B896] to-[#c4a886] rounded-full flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.414 3L15 6.586A1 1 0 0116 7.414V16a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{venta.numero_factura}</div>
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Método:</span> {venta.metodo_pago}
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
                            <span className="font-semibold">{venta.cliente?.razon_social}</span>
                          </div>
                          <div className="text-sm text-gray-500 ml-6">
                            {venta.cliente?.numero_documento}
                          </div>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800 font-medium">{formatearFecha(venta.fecha_venta)}</div>
                        {venta.metodo_pago === 'Credito' && venta.fecha_vencimiento && (
                          <div className={`text-xs mt-1 ${venta.dias_mora > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            Vence: {formatearFecha(venta.fecha_vencimiento)}
                            {venta.dias_mora > 0 && ` · ${venta.dias_mora}d mora`}
                          </div>
                        )}
                      </td>

                      {/* Montos + barra progreso cobro */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Total factura</div>
                            <div className="text-sm font-bold text-gray-800">{formatearMoneda(venta.total)}</div>
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <div className="text-xs text-gray-500">Pagado</div>
                              <div className="text-xs font-semibold text-emerald-600">{formatearMoneda(venta.monto_pagado)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Saldo</div>
                              <div className={`text-xs font-semibold ${venta.saldo_pendiente > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                {formatearMoneda(venta.saldo_pendiente)}
                              </div>
                            </div>
                          </div>
                          {/* Barra de progreso cobro */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${calcularPorcentajeCobrado(venta.monto_pagado, venta.total)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {getEstadoBadge(venta.estado_pago)}
                          {venta.dias_mora > 0 && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                <span>⚠</span>
                                <span>{venta.dias_mora}d mora</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleVerDetalle(venta)}
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
                  Mostrando <span className="font-bold text-gray-800">{ventas.length}</span> de{' '}
                  <span className="font-bold text-gray-800">{paginacion.total}</span> facturas
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
            {ventas.map((venta, index) => (
              <div
                key={venta.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-t-4 border-[#D4B896]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header tarjeta */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#D4B896] to-[#c4a886] rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.414 3L15 6.586A1 1 0 0116 7.414V16a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-lg leading-tight">{venta.numero_factura}</h3>
                      <p className="text-sm text-gray-500">{venta.metodo_pago} · {formatearFecha(venta.fecha_venta)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {getEstadoBadge(venta.estado_pago)}
                    {venta.dias_mora > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        ⚠ {venta.dias_mora}d mora
                      </span>
                    )}
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
                      <span className="font-semibold text-gray-700">{venta.cliente?.razon_social}</span>
                    </div>
                    <div className="text-sm text-gray-500 ml-6">{venta.cliente?.numero_documento}</div>
                  </div>

                  {/* Montos */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Información Financiera</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Total:</span>
                        <span className="text-sm font-bold text-gray-800">{formatearMoneda(venta.total)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Pagado:</span>
                        <span className="text-sm font-bold text-emerald-600">{formatearMoneda(venta.monto_pagado)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Saldo:</span>
                        <span className={`text-sm font-bold ${venta.saldo_pendiente > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {formatearMoneda(venta.saldo_pendiente)}
                        </span>
                      </div>
                      {/* Barra progreso */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${calcularPorcentajeCobrado(venta.monto_pagado, venta.total)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        💰 {calcularPorcentajeCobrado(venta.monto_pagado, venta.total)}% cobrado
                      </div>
                    </div>
                  </div>

                  {/* Fechas crédito */}
                  {venta.metodo_pago === 'Credito' && venta.fecha_vencimiento && (
                    <div className="flex gap-3">
                      <div className="flex-1 text-center">
                        <div className="text-xs text-gray-500">Vencimiento</div>
                        <div className="text-xs font-semibold text-gray-700">{formatearFecha(venta.fecha_vencimiento)}</div>
                      </div>
                      {venta.dias_mora > 0 && (
                        <div className="flex-1 text-center">
                          <div className="text-xs text-gray-500">Mora</div>
                          <div className="text-xs font-semibold text-red-600">{venta.dias_mora} días</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer tarjeta */}
                <div className="bg-gray-50 px-4 py-3 border-t flex gap-2">
                  <button
                    onClick={() => handleVerDetalle(venta)}
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
        {ventas.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="mx-auto w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h12m-5-8v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay facturas registradas</h3>
            <p className="text-gray-600 mb-6">Comienza creando tu primera factura corporativa B2B</p>
            <button
              onClick={handleNuevaVenta}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-gray-900 font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Factura
            </button>
          </div>
        )}
      </div>

      {/* ═══ MODALES ═══════════════════════════════════════════════ */}
      {mostrarFormulario && (
        <FormularioVentaB2B
          onClose={() => setMostrarFormulario(false)}
          onGuardar={handleVentaCreada}
        />
      )}

      {mostrarDetalle && ventaSeleccionada && (
        <DetalleVentaB2B
          venta={ventaSeleccionada}
          onClose={() => {
            setMostrarDetalle(false);
            setVentaSeleccionada(null);
          }}
          onActualizar={cargarDatos}
        />
      )}
    </div>
  );
}