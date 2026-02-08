import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { reportesService } from "../../services/reportesService";
import toast from "react-hot-toast";
import * as pdfGenerator from "../../utils/pdfGenerator";
import logo from "../../assets/logo.jpeg";
import { 
  FileText, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  TrendingUp,
  Calculator,
  Download,
  Filter
} from "lucide-react";

export default function Reportes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Estados existentes
  const [ventasHoy, setVentasHoy] = useState(null);
  const [ventasRango, setVentasRango] = useState(null);
  const [productosTop, setProductosTop] = useState([]);
  const [ventasCategorias, setVentasCategorias] = useState([]);
  const [cortesias, setCortesias] = useState(null);
  
  // Estados para nuevos reportes
  const [ventasDetalladas, setVentasDetalladas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [kardex, setKardex] = useState([]);
  const [estadoResultados, setEstadoResultados] = useState(null);
  const [cierreCaja, setCierreCaja] = useState(null);
  
  const [tabActiva, setTabActiva] = useState("resumen");
  
  // Filtros de fecha
  const hoy = new Date().toISOString().split('T')[0];
  const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [fechaInicio, setFechaInicio] = useState(hace7Dias);
  const [fechaFin, setFechaFin] = useState(hoy);

  const cargarDatosBasicos = useCallback(async () => {
    try {
      setLoading(true);
      const [ventasHoyData, ventasRangoData, productosData, categoriasData, cortesiasData] = await Promise.all([
        reportesService.getVentasHoy(),
        reportesService.getVentasPorRango(fechaInicio, fechaFin),
        reportesService.getProductosTop(fechaInicio, fechaFin, 10),
        reportesService.getVentasPorCategoria(fechaInicio, fechaFin),
        reportesService.getCortesias(fechaInicio, fechaFin)
      ]);
      setVentasHoy(ventasHoyData);
      setVentasRango(ventasRangoData);
      setProductosTop(productosData);
      setVentasCategorias(categoriasData);
      setCortesias(cortesiasData);
    } catch (error) {
      toast.error("Error al cargar reportes básicos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  const cargarReporteAvanzado = useCallback(async (tipo) => {
    try {
      setLoading(true);
      let data;
      
      switch(tipo) {
        case 'ventas-detalladas':
          data = await reportesService.getVentasDetalladas(fechaInicio, fechaFin);
          setVentasDetalladas(data);
          break;
        case 'gastos':
          data = await reportesService.getGastos(fechaInicio, fechaFin);
          setGastos(data);
          break;
        case 'compras':
          data = await reportesService.getComprasDetalladas(fechaInicio, fechaFin);
          setCompras(data);
          break;
        case 'inventario':
          data = await reportesService.getInventarioValorizado();
          setInventario(data);
          break;
        case 'kardex':
          data = await reportesService.getKardex(fechaInicio, fechaFin);
          setKardex(data);
          break;
        case 'utilidad':
          data = await reportesService.getEstadoResultados(fechaInicio, fechaFin);
          setEstadoResultados(data);
          break;
        case 'cierre-caja':
          data = await reportesService.getCierreCaja(fechaInicio, fechaFin);
          setCierreCaja(data);
          break;
      }
    } catch (error) {
      toast.error(`Error al cargar reporte: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    cargarDatosBasicos();
  }, [cargarDatosBasicos]);

  // Cargar datos cuando cambia la pestaña
  useEffect(() => {
    if (tabActiva === 'ventas-detalladas' && ventasDetalladas.length === 0) {
      cargarReporteAvanzado('ventas-detalladas');
    } else if (tabActiva === 'gastos' && gastos.length === 0) {
      cargarReporteAvanzado('gastos');
    } else if (tabActiva === 'compras' && compras.length === 0) {
      cargarReporteAvanzado('compras');
    } else if (tabActiva === 'inventario' && inventario.length === 0) {
      cargarReporteAvanzado('inventario');
    } else if (tabActiva === 'kardex' && kardex.length === 0) {
      cargarReporteAvanzado('kardex');
    } else if (tabActiva === 'utilidad' && !estadoResultados) {
      cargarReporteAvanzado('utilidad');
    } else if (tabActiva === 'cierre-caja' && !cierreCaja) {
      cargarReporteAvanzado('cierre-caja');
    }
  }, [tabActiva, ventasDetalladas, gastos, compras, inventario, kardex, estadoResultados, cierreCaja, cargarReporteAvanzado]);

  const formatMoney = (value) => {
    return "$" + Number(value || 0).toLocaleString();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const descargarPDF = async (tipoReporte) => {
    try {
      toast.success(`Generando PDF de ${tipoReporte}...`);
      
      switch(tipoReporte) {
        case 'ventas-detalladas':
          if (ventasDetalladas.length === 0) {
            toast.error('No hay datos para generar el PDF');
            return;
          }
          pdfGenerator.generarPDFVentasDetalladas(ventasDetalladas, fechaInicio, fechaFin);
          break;
          
        case 'gastos':
          pdfGenerator.generarPDFGastos(gastos, fechaInicio, fechaFin);
          break;
          
        case 'compras':
          if (compras.length === 0) {
            toast.error('No hay datos para generar el PDF');
            return;
          }
          pdfGenerator.generarPDFCompras(compras, fechaInicio, fechaFin);
          break;
          
        case 'inventario':
          if (inventario.length === 0) {
            toast.error('No hay datos para generar el PDF');
            return;
          }
          pdfGenerator.generarPDFInventario(inventario);
          break;
          
        case 'kardex':
          if (kardex.length === 0) {
            toast.error('No hay datos para generar el PDF');
            return;
          }
          pdfGenerator.generarPDFKardex(kardex, fechaInicio, fechaFin);
          break;
          
        case 'utilidad':
          if (!estadoResultados) {
            toast.error('No hay datos para generar el PDF');
            return;
          }
          pdfGenerator.generarPDFEstadoResultados(estadoResultados, fechaInicio, fechaFin);
          break;
          
        case 'cierre-caja':
          if (!cierreCaja) {
            toast.error('No hay datos para generar el PDF');
            return;
          }
          pdfGenerator.generarPDFCierreCaja(cierreCaja, fechaInicio, fechaFin);
          break;
          
        default:
          toast.error('Tipo de reporte no reconocido');
      }
      
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar PDF: ' + error.message);
    }
  };

  if (loading && !ventasHoy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "resumen", label: "Resumen", icon: "📊" },
    { id: "productos", label: "Productos", icon: "🏆" },
    { id: "categorias", label: "Categorías", icon: "📦" },
    { id: "cortesias", label: "Cortesías", icon: "🎁" },
    { id: "ventas-detalladas", label: "Ventas Detalladas", icon: <FileText size={16} /> },
    { id: "gastos", label: "Gastos", icon: <DollarSign size={16} /> },
    { id: "compras", label: "Compras", icon: <ShoppingCart size={16} /> },
    { id: "inventario", label: "Inventario", icon: <Package size={16} /> },
    { id: "kardex", label: "Kardex", icon: <ClipboardList size={16} /> },
    { id: "utilidad", label: "Utilidad", icon: <TrendingUp size={16} /> },
    { id: "cierre-caja", label: "Cierre Caja", icon: <Calculator size={16} /> }
  ];

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
                <h1 className="text-xl font-black text-white">Reportes</h1>
                <p className="text-xs text-[#D4B896]">Estadísticas y Análisis</p>
              </div>
            </button>

            <div className="flex items-center gap-3">
              {/* Filtro de fechas */}
              <div className="hidden md:flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-1">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="px-3 py-1.5 bg-transparent border-none text-white text-sm focus:outline-none"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="px-3 py-1.5 bg-transparent border-none text-white text-sm focus:outline-none"
                />
              </div>

              {/* Botones rápidos */}
              <div className="hidden lg:flex gap-1">
                <button
                  onClick={() => { setFechaInicio(hoy); setFechaFin(hoy); }}
                  className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-gray-400 rounded-lg hover:text-white transition"
                >
                  Hoy
                </button>
                <button
                  onClick={() => { setFechaInicio(hace7Dias); setFechaFin(hoy); }}
                  className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-gray-400 rounded-lg hover:text-white transition"
                >
                  7 días
                </button>
                <button
                  onClick={() => { setFechaInicio(hace30Dias); setFechaFin(hoy); }}
                  className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-gray-400 rounded-lg hover:text-white transition"
                >
                  30 días
                </button>
              </div>

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

      {/* Filtros en móvil */}
      <div className="md:hidden max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-2">
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="flex-1 px-2 py-1 bg-transparent border-none text-white text-sm focus:outline-none"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="flex-1 px-2 py-1 bg-transparent border-none text-white text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#D4B896] scrollbar-track-[#1a1a1a]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={
                "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition flex items-center gap-2 " +
                (tabActiva === tab.id
                  ? "bg-[#D4B896] text-[#0a0a0a]"
                  : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]")
              }
            >
              {typeof tab.icon === 'string' ? <span>{tab.icon}</span> : tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Tab Resumen - MANTIENE CÓDIGO ORIGINAL */}
        {tabActiva === "resumen" && (
          <div className="space-y-6">
            {/* Cards principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-5">
                <p className="text-emerald-400 text-sm mb-1">Ventas Hoy</p>
                <p className="text-3xl font-black text-white">{formatMoney(ventasHoy?.totalVentas)}</p>
                <p className="text-xs text-emerald-400/70 mt-1">{ventasHoy?.cantidadPedidos || 0} pedidos</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-5">
                <p className="text-blue-400 text-sm mb-1">Periodo Seleccionado</p>
                <p className="text-3xl font-black text-white">{formatMoney(ventasRango?.totalVentas)}</p>
                <p className="text-xs text-blue-400/70 mt-1">{ventasRango?.cantidadPedidos || 0} pedidos</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-5">
                <p className="text-purple-400 text-sm mb-1">Ticket Promedio</p>
                <p className="text-3xl font-black text-white">{formatMoney(ventasRango?.ticketPromedio)}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-2xl p-5">
                <p className="text-orange-400 text-sm mb-1">Cortesías</p>
                <p className="text-3xl font-black text-white">{formatMoney(ventasRango?.totalCortesias)}</p>
              </div>
            </div>

            {/* Ventas por día */}
            {ventasRango?.ventasPorDia && ventasRango.ventasPorDia.length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Ventas por Día</h3>
                <div className="space-y-2">
                  {ventasRango.ventasPorDia.map((dia) => {
                    const maxVenta = Math.max(...ventasRango.ventasPorDia.map(d => d.total));
                    const porcentaje = maxVenta > 0 ? (dia.total / maxVenta) * 100 : 0;
                    return (
                      <div key={dia.fecha} className="flex items-center gap-4">
                        <span className="text-gray-500 text-sm w-24">{dia.fecha}</span>
                        <div className="flex-1 h-8 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-[#D4B896] to-[#C4A576] rounded-lg transition-all duration-500"
                            style={{ width: porcentaje + "%" }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                            {formatMoney(dia.total)}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs w-16 text-right">{dia.cantidad} ped.</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ventas por método de pago */}
            {ventasHoy?.ventasPorMetodo && Object.keys(ventasHoy.ventasPorMetodo).length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Métodos de Pago (Hoy)</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(ventasHoy.ventasPorMetodo).map(([metodo, data]) => (
                    <div key={metodo} className="bg-[#1a1a1a] rounded-xl p-4 text-center">
                      <p className="text-2xl mb-2">
                        {metodo === 'efectivo' ? '💵' : metodo === 'transferencia' ? '🏦' : '📱'}
                      </p>
                      <p className="text-white font-bold">{formatMoney(data.total)}</p>
                      <p className="text-xs text-gray-500 capitalize">{metodo}</p>
                      <p className="text-xs text-gray-600">{data.cantidad} pedidos</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ventas por local hoy */}
            {ventasHoy?.ventasPorLocal && Object.keys(ventasHoy.ventasPorLocal).length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Ventas por Local (Hoy)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(ventasHoy.ventasPorLocal).map(([local, data]) => (
                    <div key={local} className="bg-[#1a1a1a] rounded-xl p-4">
                      <p className="text-gray-400 text-sm">{local}</p>
                      <p className="text-2xl font-bold text-[#D4B896]">{formatMoney(data.total)}</p>
                      <p className="text-xs text-gray-500">{data.cantidad} pedidos</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Productos - MANTIENE CÓDIGO ORIGINAL */}
        {tabActiva === "productos" && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#2a2a2a]">
              <h3 className="text-white font-bold">Top 10 Productos Más Vendidos</h3>
              <p className="text-xs text-gray-500">Periodo: {fechaInicio} al {fechaFin}</p>
            </div>
            <div className="divide-y divide-[#2a2a2a]">
              {productosTop.map((prod) => (
                <div key={prod.producto_id} className="flex items-center gap-4 p-4 hover:bg-[#1a1a1a] transition">
                  <div className={
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg " +
                    (prod.posicion === 1 ? "bg-yellow-500/20 text-yellow-400" :
                     prod.posicion === 2 ? "bg-gray-400/20 text-gray-400" :
                     prod.posicion === 3 ? "bg-orange-500/20 text-orange-400" :
                     "bg-[#1a1a1a] text-gray-500")
                  }>
                    {prod.posicion}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{prod.nombre}</p>
                    <p className="text-xs text-gray-500">{prod.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#D4B896] font-bold">{prod.cantidadVendida} uds</p>
                    <p className="text-xs text-gray-500">{formatMoney(prod.totalVentas)}</p>
                  </div>
                </div>
              ))}
              {productosTop.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No hay datos para el periodo seleccionado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Categorías - MANTIENE CÓDIGO ORIGINAL */}
        {tabActiva === "categorias" && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#2a2a2a]">
              <h3 className="text-white font-bold">Ventas por Categoría</h3>
              <p className="text-xs text-gray-500">Periodo: {fechaInicio} al {fechaFin}</p>
            </div>
            <div className="p-4 space-y-3">
              {ventasCategorias.map((cat) => {
                const maxVenta = Math.max(...ventasCategorias.map(c => c.totalVentas));
                const porcentaje = maxVenta > 0 ? (cat.totalVentas / maxVenta) * 100 : 0;
                return (
                  <div key={cat.nombre} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white flex items-center gap-2">
                        <span>{cat.icono}</span>
                        {cat.nombre}
                      </span>
                      <span className="text-[#D4B896] font-bold">{formatMoney(cat.totalVentas)}</span>
                    </div>
                    <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4B896] to-[#C4A576] rounded-full transition-all duration-500"
                        style={{ width: porcentaje + "%" }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-right">{cat.cantidadVendida} unidades vendidas</p>
                  </div>
                );
              })}
              {ventasCategorias.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No hay datos para el periodo seleccionado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Cortesías - MANTIENE CÓDIGO ORIGINAL */}
        {tabActiva === "cortesias" && cortesias && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Total Cortesías</p>
                <p className="text-3xl font-black text-[#D4B896]">{formatMoney(cortesias.totalCortesias)}</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Pedidos con Cortesía</p>
                <p className="text-3xl font-black text-white">{cortesias.cantidadPedidosConCortesia}</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Promedio por Cortesía</p>
                <p className="text-3xl font-black text-white">
                  {formatMoney(cortesias.cantidadPedidosConCortesia > 0 
                    ? cortesias.totalCortesias / cortesias.cantidadPedidosConCortesia 
                    : 0)}
                </p>
              </div>
            </div>

            {/* Por razón */}
            {cortesias.porRazon && cortesias.porRazon.length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Por Razón</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {cortesias.porRazon.map((item) => (
                    <div key={item.razon} className="bg-[#1a1a1a] rounded-xl p-4">
                      <p className="text-white font-medium capitalize">{item.razon.replace(/_/g, ' ')}</p>
                      <p className="text-[#D4B896] font-bold">{formatMoney(item.total)}</p>
                      <p className="text-xs text-gray-500">{item.cantidad} veces</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalle */}
            {cortesias.detalle && cortesias.detalle.length > 0 && (
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#2a2a2a]">
                  <h3 className="text-white font-bold">Detalle de Cortesías</h3>
                </div>
                <div className="divide-y divide-[#2a2a2a] max-h-96 overflow-y-auto">
                  {cortesias.detalle.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-[#1a1a1a] transition">
                      <div>
                        <p className="text-white font-medium">Mesa {item.mesa} - {item.local}</p>
                        <p className="text-xs text-gray-500">{item.usuario} - {formatDate(item.fecha)}</p>
                        <p className="text-xs text-gray-600 capitalize">{item.razon?.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#D4B896] font-bold">-{formatMoney(item.monto_cortesia)}</p>
                        <p className="text-xs text-gray-500">de {formatMoney(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cortesias.cantidadPedidosConCortesia === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#1a1a1a] flex items-center justify-center">
                  <span className="text-4xl">🎁</span>
                </div>
                <p className="text-gray-500">No hay cortesías en el periodo seleccionado</p>
              </div>
            )}
          </div>
        )}

        {/* 1️⃣ NUEVO: Tab Ventas Detalladas */}
        {tabActiva === "ventas-detalladas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Reporte de Ventas Detalladas</h3>
                <p className="text-sm text-gray-500">Periodo: {fechaInicio} al {fechaFin}</p>
              </div>
              <button
                onClick={() => descargarPDF('ventas-detalladas')}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4B896] text-[#0a0a0a] rounded-lg hover:bg-[#C4A576] transition"
              >
                <Download size={16} />
                Descargar PDF
              </button>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">N° Orden</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Mesa/Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Método Pago</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Subtotal</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {ventasDetalladas.length > 0 ? ventasDetalladas.map((venta) => (
                      <tr key={venta.id} className="hover:bg-[#1a1a1a] transition">
                        <td className="px-4 py-3 text-sm text-gray-300">{formatDate(venta.fecha)}</td>
                        <td className="px-4 py-3 text-sm text-white font-medium">#{venta.numero_orden}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{venta.mesa || venta.cliente}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 capitalize">{venta.metodo_pago}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300">{formatMoney(venta.subtotal)}</td>
                        <td className="px-4 py-3 text-sm text-right text-[#D4B896] font-bold">{formatMoney(venta.total)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            venta.estado === 'pagada' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {venta.estado}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                          Cargando datos o no hay ventas en el periodo...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2️⃣ NUEVO: Tab Gastos */}
        {tabActiva === "gastos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Reporte de Gastos Operativos</h3>
                <p className="text-sm text-gray-500">Periodo: {fechaInicio} al {fechaFin}</p>
              </div>
              <button
                onClick={() => descargarPDF('gastos')}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4B896] text-[#0a0a0a] rounded-lg hover:bg-[#C4A576] transition"
              >
                <Download size={16} />
                Descargar PDF
              </button>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Proveedor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Descripción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Método Pago</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {gastos.length > 0 ? gastos.map((gasto, idx) => (
                      <tr key={idx} className="hover:bg-[#1a1a1a] transition">
                        <td className="px-4 py-3 text-sm text-gray-300">{formatDate(gasto.fecha)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 capitalize">{gasto.tipo}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{gasto.proveedor}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{gasto.descripcion}</td>
                        <td className="px-4 py-3 text-sm text-gray-300 capitalize">{gasto.metodo_pago}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-400 font-bold">{formatMoney(gasto.valor)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{gasto.responsable}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                          Cargando datos o no hay gastos registrados...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3️⃣ NUEVO: Tab Compras */}
        {tabActiva === "compras" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Reporte de Compras</h3>
                <p className="text-sm text-gray-500">Periodo: {fechaInicio} al {fechaFin}</p>
              </div>
              <button
                onClick={() => descargarPDF('compras')}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4B896] text-[#0a0a0a] rounded-lg hover:bg-[#C4A576] transition"
              >
                <Download size={16} />
                Descargar PDF
              </button>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Proveedor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Factura</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Producto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Cantidad</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Costo Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {compras.length > 0 ? compras.map((compra, idx) => (
                      <tr key={idx} className="hover:bg-[#1a1a1a] transition">
                        <td className="px-4 py-3 text-sm text-gray-300">{formatDate(compra.fecha)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{compra.proveedor}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{compra.factura}</td>
                        <td className="px-4 py-3 text-sm text-white">{compra.producto}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300">{compra.cantidad}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300">{formatMoney(compra.costo_unitario)}</td>
                        <td className="px-4 py-3 text-sm text-right text-[#D4B896] font-bold">{formatMoney(compra.total)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            compra.estado === 'pagada' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {compra.estado}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                          Cargando datos o no hay compras registradas...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4️⃣ NUEVO: Tab Inventario Valorizado */}
        {tabActiva === "inventario" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Inventario Valorizado</h3>
                <p className="text-sm text-gray-500">Stock actual con valorización</p>
              </div>
              <button
                onClick={() => descargarPDF('inventario')}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4B896] text-[#0a0a0a] rounded-lg hover:bg-[#C4A576] transition"
              >
                <Download size={16} />
                Descargar PDF
              </button>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Producto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Stock Inicial</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Entradas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Salidas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Stock Actual</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Costo Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {inventario.length > 0 ? inventario.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#1a1a1a] transition">
                        <td className="px-4 py-3 text-sm text-white font-medium">{item.producto}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300">{item.stock_inicial}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-400">{item.entradas}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-400">{item.salidas}</td>
                        <td className="px-4 py-3 text-sm text-right text-white font-bold">{item.stock_actual}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300">{formatMoney(item.costo_unitario)}</td>
                        <td className="px-4 py-3 text-sm text-right text-[#D4B896] font-bold">{formatMoney(item.valor_total)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                          Cargando datos del inventario...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5️⃣ NUEVO: Tab Kardex */}
        {tabActiva === "kardex" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Kardex - Movimientos de Inventario</h3>
                <p className="text-sm text-gray-500">Periodo: {fechaInicio} al {fechaFin}</p>
              </div>
              <button
                onClick={() => descargarPDF('kardex')}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4B896] text-[#0a0a0a] rounded-lg hover:bg-[#C4A576] transition"
              >
                <Download size={16} />
                Descargar PDF
              </button>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Producto</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Cantidad</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Saldo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Origen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {kardex.length > 0 ? kardex.map((mov, idx) => (
                      <tr key={idx} className="hover:bg-[#1a1a1a] transition">
                        <td className="px-4 py-3 text-sm text-gray-300">{formatDate(mov.fecha)}</td>
                        <td className="px-4 py-3 text-sm text-white">{mov.producto}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            mov.tipo === 'entrada' ? 'bg-green-500/20 text-green-400' : 
                            mov.tipo === 'salida' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {mov.tipo}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm text-right font-bold ${
                          mov.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {mov.tipo === 'entrada' ? '+' : '-'}{mov.cantidad}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-white font-bold">{mov.saldo}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{mov.origen}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                          Cargando movimientos de inventario...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6️⃣ NUEVO: Tab Utilidad (Estado de Resultados) */}
        {tabActiva === "utilidad" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Estado de Resultados</h3>
                <p className="text-sm text-gray-500">Periodo: {fechaInicio} al {fechaFin}</p>
              </div>
              <button
                onClick={() => descargarPDF('utilidad')}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4B896] text-[#0a0a0a] rounded-lg hover:bg-[#C4A576] transition"
              >
                <Download size={16} />
                Descargar PDF
              </button>
            </div>

            {estadoResultados ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Ingresos */}
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-6">
                  <h4 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Ingresos
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Ventas</span>
                      <span className="text-white font-bold text-xl">{formatMoney(estadoResultados.totalVentas)}</span>
                    </div>
                  </div>
                </div>

                {/* Egresos */}
                <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-2xl p-6">
                  <h4 className="text-red-400 font-bold mb-4">Egresos</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Costos</span>
                      <span className="text-white font-bold">{formatMoney(estadoResultados.totalCostos)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Gastos</span>
                      <span className="text-white font-bold">{formatMoney(estadoResultados.totalGastos)}</span>
                    </div>
                  </div>
                </div>

                {/* Utilidad Bruta */}
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-6">
                  <h4 className="text-blue-400 font-bold mb-2">Utilidad Bruta</h4>
                  <p className="text-4xl font-black text-white mb-2">{formatMoney(estadoResultados.utilidadBruta)}</p>
                  <p className="text-sm text-blue-400">Margen: {estadoResultados.margenBruto}%</p>
                </div>

                {/* Utilidad Neta */}
                <div className="bg-gradient-to-br from-[#D4B896]/20 to-[#C4A576]/10 border border-[#D4B896]/30 rounded-2xl p-6">
                  <h4 className="text-[#D4B896] font-bold mb-2">Utilidad Neta</h4>
                  <p className="text-4xl font-black text-white mb-2">{formatMoney(estadoResultados.utilidadNeta)}</p>
                  <p className="text-sm text-[#D4B896]">Margen: {estadoResultados.margenNeto}%</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando estado de resultados...</p>
              </div>
            )}
          </div>
        )}

        {/* 7️⃣ NUEVO: Tab Cierre de Caja */}
        {tabActiva === "cierre-caja" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Cierre de Caja</h3>
                <p className="text-sm text-gray-500">Periodo: {fechaInicio} al {fechaFin}</p>
              </div>
              <button
                onClick={() => descargarPDF('cierre-caja')}
                className="flex items-center gap-2 px-4 py-2 bg-[#D4B896] text-[#0a0a0a] rounded-lg hover:bg-[#C4A576] transition"
              >
                <Download size={16} />
                Descargar PDF
              </button>
            </div>

            {cierreCaja ? (
              <div className="space-y-6">
                {/* Resumen por método de pago */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">Efectivo</span>
                      <span className="text-2xl">💵</span>
                    </div>
                    <p className="text-3xl font-black text-white">{formatMoney(cierreCaja.efectivo)}</p>
                  </div>
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">Transferencias</span>
                      <span className="text-2xl">🏦</span>
                    </div>
                    <p className="text-3xl font-black text-white">{formatMoney(cierreCaja.transferencias)}</p>
                  </div>
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">Nequi/Daviplata</span>
                      <span className="text-2xl">📱</span>
                    </div>
                    <p className="text-3xl font-black text-white">{formatMoney(cierreCaja.digital)}</p>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gradient-to-br from-[#D4B896]/20 to-[#C4A576]/10 border border-[#D4B896]/30 rounded-2xl p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 mb-2">Total en Caja</p>
                      <p className="text-5xl font-black text-white">{formatMoney(cierreCaja.total)}</p>
                    </div>
                    <Calculator className="text-[#D4B896]" size={48} />
                  </div>
                </div>

                {/* Detalles adicionales */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <p className="text-gray-400 text-sm mb-1">Total Transacciones</p>
                    <p className="text-2xl font-bold text-white">{cierreCaja.cantidadTransacciones}</p>
                  </div>
                  <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <p className="text-gray-400 text-sm mb-1">Ticket Promedio</p>
                    <p className="text-2xl font-bold text-white">{formatMoney(cierreCaja.ticketPromedio)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando cierre de caja...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}