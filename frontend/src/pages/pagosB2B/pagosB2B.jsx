import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import pagosB2BService from '../../services/pagosB2BService';
import FormularioPagoB2B from './FormularioPagoB2B';
import DetallePagoB2B from './DetallePagoB2B';

export default function PagosB2B() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ventaIdParam = searchParams.get('venta_id');

  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Aplicado');
  const [resumen, setResumen] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [pagosData, resumenData] = await Promise.all([
        pagosB2BService.obtenerPagos({ 
          estado: filtroEstado || undefined,
          limite: 50 
        }),
        pagosB2BService.obtenerResumenPagos()
      ]);

      setPagos(pagosData.pagos || []);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Si viene de una venta, abrir formulario automáticamente
  useEffect(() => {
    if (ventaIdParam) {
      setMostrarFormulario(true);
    }
  }, [ventaIdParam]);

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

  const formatearMoneda = (valor) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor || 0);

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getEstadoBadge = (estado) => {
    const configs = {
      Aplicado: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '✓' },
      Anulado: { bg: 'bg-red-100', text: 'text-red-800', icon: '✕' },
    };
    const config = configs[estado] || configs['Aplicado'];
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
      >
        <span>{config.icon}</span>
        <span>{estado}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-700">Cargando pagos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/ventas-b2b')}
                className="group flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="font-medium">Volver</span>
              </button>

              <div className="h-8 w-px bg-white/20"></div>

              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <span className="text-4xl">💰</span>
                  Pagos B2B
                </h1>
                <p className="text-gray-300 mt-1">Registro y control de pagos recibidos</p>
              </div>
            </div>

            <button
              onClick={() => setMostrarFormulario(true)}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-gray-900 font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <svg
                className="w-5 h-5 transform group-hover:rotate-90 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Registrar Pago</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-6 py-8">
        {/* Resumen */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-emerald-500">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Recaudado</div>
              <div className="text-3xl font-bold text-emerald-600">
                {formatearMoneda(resumen.totalPagos)}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                📄 {resumen.cantidadPagos} pagos
              </div>
            </div>

            {resumen.porMetodo?.map((metodo) => (
              <div
                key={metodo.metodo}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500"
              >
                <div className="text-sm font-medium text-gray-600 mb-1">{metodo.metodo}</div>
                <div className="text-2xl font-bold text-gray-800">
                  {formatearMoneda(metodo.total)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {metodo.cantidad} transacciones
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por recibo, cliente, factura..."
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent transition-all"
              />
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent transition-all bg-white"
            >
              <option value="">📋 Todos los estados</option>
              <option value="Aplicado">✓ Aplicado</option>
              <option value="Anulado">✕ Anulado</option>
            </select>
          </div>
        </div>

        {/* Tabla de pagos */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Recibo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Factura
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Monto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Método
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{pago.numero_recibo}</div>
                      <div className="text-sm text-gray-500">
                        {formatearFecha(pago.fecha_pago)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">
                        {pago.cliente?.razon_social}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pago.cliente?.numero_documento}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800">
                        {pago.venta?.numero_factura}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-emerald-600">
                        {formatearMoneda(pago.monto)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{pago.metodo_pago}</div>
                    </td>
                    <td className="px-6 py-4">{getEstadoBadge(pago.estado)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleVerDetalle(pago)}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay pagos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {mostrarFormulario && (
        <FormularioPagoB2B
          onClose={() => setMostrarFormulario(false)}
          onGuardar={() => {
            setMostrarFormulario(false);
            cargarDatos();
          }}
          ventaIdPrefill={ventaIdParam}
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