import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { proveedoresService } from "../../services/proveedoresService";
import { inventarioKardexService } from "../../services/inventarioKardexService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";
import api from "../../services/api";
import SelectorImpuestos from "../../components/SelectorImpuestos"; // AGREGADO

export default function RegistrarCompra() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [locales] = useState([
    { id: "00000000-0000-0000-0000-000000000001", nombre: "Castellana" },
    { id: "00000000-0000-0000-0000-000000000002", nombre: "Avenida 1ra" },
  ]);
  const [formaPago, setFormaPago] = useState("contado");
  const [impuestosSeleccionados, setImpuestosSeleccionados] = useState([]);
  const [impuestosDisponibles, setImpuestosDisponibles] = useState([]);
  const [diasCredito, setDiasCredito] = useState(30);

  const [compra, setCompra] = useState({
    proveedor_id: "",
    local_id: "00000000-0000-0000-0000-000000000001",
    numero_factura: "",
    fecha_factura: new Date().toISOString().split("T")[0],
    observaciones: "",
  });

  const [productosCompra, setProductosCompra] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

  useEffect(() => {
    cargarImpuestos();
    cargarDatos();
  }, []);

  const cargarImpuestos = async () => {
    try {
      const response = await api.get("/impuestos/activos");
      setImpuestosDisponibles(response.data);
    } catch (error) {
      console.error("Error cargando impuestos:", error);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar proveedores
      const prov = await proveedoresService.getAll();
      setProveedores(prov);

      // Cargar productos usando el endpoint correcto
      const prodResponse = await api.get("/productos");
      setProductos(prodResponse.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error(
        "Error al cargar datos: " +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  const agregarProducto = (producto) => {
    const existe = productosCompra.find((p) => p.producto_id === producto.id);
    if (existe) {
      toast.error("El producto ya está agregado");
      return;
    }

    const costoUnitario = parseFloat(producto.ultimo_costo) || 0;
    const precioVenta = parseFloat(producto.precio_venta) || 0;

    setProductosCompra([
      ...productosCompra,
      {
        producto_id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria?.nombre || null,
        cantidad: 1,
        costo_unitario: costoUnitario,
        precio_venta: precioVenta,
        subtotal: costoUnitario,
      },
    ]);
    setBusquedaProducto("");
    setMostrarBusqueda(false);
    toast.success(`${producto.nombre} agregado`);
  };

  const actualizarProducto = (index, campo, valor) => {
    const nuevosProductos = [...productosCompra];
    nuevosProductos[index][campo] = parseFloat(valor) || 0;

    if (campo === "cantidad" || campo === "costo_unitario") {
      nuevosProductos[index].subtotal =
        nuevosProductos[index].cantidad * nuevosProductos[index].costo_unitario;
    }

    setProductosCompra(nuevosProductos);
  };

  const eliminarProducto = (index) => {
    setProductosCompra(productosCompra.filter((_, i) => i !== index));
  };

  const calcularSubtotal = () => {
    return productosCompra.reduce((sum, p) => sum + (parseFloat(p.subtotal) || 0), 0);
  };

  const calcularImpuestos = () => {
    const subtotal = calcularSubtotal();
    let totalImpuestos = 0;
    let totalRetenciones = 0;
    
    impuestosSeleccionados.forEach(imp => {
      const porcentaje = parseFloat(imp.porcentaje);
      if (isNaN(porcentaje)) return; // Saltar si el porcentaje no es válido
      
      const monto = (subtotal * porcentaje) / 100;
      if (imp.tipo === 'Impuesto') {
        totalImpuestos += monto;
      } else {
        totalRetenciones += monto;
      }
    });
    
    return { totalImpuestos, totalRetenciones };
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const { totalImpuestos, totalRetenciones } = calcularImpuestos();
    const total = subtotal + totalImpuestos - totalRetenciones;
    return isNaN(total) ? 0 : total;
  };

  // NUEVA FUNCIÓN: Convertir IDs a objetos completos de impuestos
  const handleImpuestosChange = (impuestosIds) => {
    const impuestosCompletos = impuestosIds.map(id => {
      const impuesto = impuestosDisponibles.find(imp => imp.id === id);
      return impuesto ? {
        impuesto_id: impuesto.id,
        nombre: impuesto.nombre,
        porcentaje: impuesto.porcentaje,
        tipo: impuesto.tipo,
        codigo: impuesto.codigo
      } : null;
    }).filter(Boolean);
    
    setImpuestosSeleccionados(impuestosCompletos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!compra.proveedor_id) {
      toast.error("Debe seleccionar un proveedor");
      return;
    }

    if (productosCompra.length === 0) {
      toast.error("Debe agregar al menos un producto");
      return;
    }

    try {
      await inventarioKardexService.registrarCompra({
        ...compra,
        forma_pago: formaPago,
        dias_credito: formaPago === 'credito' ? diasCredito : null,
        impuestos_aplicados: impuestosSeleccionados,
        productos: productosCompra.map(p => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          costo_unitario: p.costo_unitario,
          precio_venta: p.precio_venta > 0 ? p.precio_venta : undefined
        }))
      });

      toast.success("Compra registrada exitosamente");
      navigate("/inventario");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al registrar compra");
    }
  };

  const productosFiltrados = productos
    .filter(
      (p) =>
        p.nombre?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(busquedaProducto.toLowerCase()),
    )
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg font-medium">Cargando...</p>
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
              onClick={() => navigate("/inventario")}
              className="flex items-center gap-2 text-gray-400 hover:text-[#D4B896] transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="font-medium">Volver</span>
            </button>

            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Logo"
                className="w-10 h-10 rounded-full border-2 border-[#D4B896]"
              />
              <div>
                <h1 className="text-lg font-black text-white">
                  Registrar Compra
                </h1>
                <p className="text-xs text-gray-500">
                  Complete los datos de la compra
                </p>
              </div>
            </div>

            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Información General */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos Generales */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#D4B896]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Datos Generales
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Proveedor */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Proveedor *
                  </label>
                  <select
                    value={compra.proveedor_id}
                    onChange={(e) =>
                      setCompra({ ...compra, proveedor_id: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                    required
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Local */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Local *
                  </label>
                  <select
                    value={compra.local_id}
                    onChange={(e) =>
                      setCompra({ ...compra, local_id: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                    required
                  >
                    {locales.map((local) => (
                      <option key={local.id} value={local.id}>
                        {local.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Número de Factura */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Número de Factura *
                  </label>
                  <input
                    type="text"
                    value={compra.numero_factura}
                    onChange={(e) =>
                      setCompra({ ...compra, numero_factura: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                    placeholder="FAC-001"
                    required
                  />
                </div>

                {/* Fecha Factura */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Fecha Factura *
                  </label>
                  <input
                    type="date"
                    value={compra.fecha_factura}
                    onChange={(e) =>
                      setCompra({ ...compra, fecha_factura: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                    required
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={compra.observaciones}
                  onChange={(e) =>
                    setCompra({ ...compra, observaciones: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition resize-none"
                  rows="3"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {/* Forma de Pago */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                Forma de Pago
              </h2>

              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="formaPago"
                    value="contado"
                    checked={formaPago === "contado"}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="w-4 h-4 text-[#D4B896] focus:ring-[#D4B896]"
                  />
                  <span className="text-white">Contado</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="formaPago"
                    value="credito"
                    checked={formaPago === "credito"}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="w-4 h-4 text-[#D4B896] focus:ring-[#D4B896]"
                  />
                  <span className="text-white">Crédito</span>
                </label>
              </div>

              {formaPago === "credito" && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Días de Crédito
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={diasCredito}
                    onChange={(e) => setDiasCredito(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                  />
                </div>
              )}
            </div>

            {/* NUEVO: Sección de Impuestos Aplicables */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#D4B896]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Impuestos Aplicables
              </h2>

              <SelectorImpuestos
                impuestosSeleccionados={impuestosSeleccionados.map(i => i.impuesto_id)}
                onImpuestosChange={handleImpuestosChange}
                subtotal={calcularSubtotal()}
                onImpuestosDisponiblesLoaded={setImpuestosDisponibles}
              />
            </div>

            {/* Productos */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Productos</h2>

              {/* Buscador de productos */}
              <div className="mb-4 relative">
                <input
                  type="text"
                  value={busquedaProducto}
                  onChange={(e) => {
                    setBusquedaProducto(e.target.value);
                    setMostrarBusqueda(e.target.value.length > 0);
                  }}
                  onFocus={() =>
                    setMostrarBusqueda(busquedaProducto.length > 0)
                  }
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition pl-10"
                  placeholder="Buscar producto por nombre o código..."
                />
                <svg
                  className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>

                {/* Resultados de búsqueda */}
                {mostrarBusqueda && productosFiltrados.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-[#141414] border border-[#2a2a2a] rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {productosFiltrados.map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() => agregarProducto(producto)}
                        className="w-full px-4 py-3 text-left hover:bg-[#1a1a1a] transition border-b border-[#2a2a2a] last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">
                              {producto.nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {producto.codigo} •{" "}
                              {producto.categoria?.nombre || "Sin categoría"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#D4B896] font-bold">
                              ${producto.ultimo_costo?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {producto.stock_actual || 0}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lista de productos agregados */}
              {productosCompra.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p>No hay productos agregados</p>
                  <p className="text-sm mt-2">
                    Busca y selecciona productos arriba
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productosCompra.map((item, index) => (
                    <div
                      key={index}
                      className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Nombre y categoría */}
                          <div>
                            <h3 className="text-white font-bold">
                              {item.nombre}
                            </h3>
                            {item.categoria && (
                              <span className="text-xs text-gray-500 bg-[#0a0a0a] px-2 py-1 rounded">
                                {item.categoria}
                              </span>
                            )}
                          </div>

                          {/* Inputs en grid */}
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">
                                Cantidad *
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) =>
                                  actualizarProducto(
                                    index,
                                    "cantidad",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-center font-bold focus:outline-none focus:border-[#D4B896] transition"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">
                                Costo Unitario *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.costo_unitario}
                                  onChange={(e) =>
                                    actualizarProducto(
                                      index,
                                      "costo_unitario",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 pl-6 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-center font-medium focus:outline-none focus:border-[#D4B896] transition"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">
                                Precio Venta
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.precio_venta}
                                  onChange={(e) =>
                                    actualizarProducto(
                                      index,
                                      "precio_venta",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 pl-6 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-center font-medium focus:outline-none focus:border-emerald-500 transition"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">
                                Subtotal
                              </label>
                              <div className="px-3 py-2 bg-[#D4B896]/10 border border-[#D4B896]/30 rounded-lg">
                                <p className="text-[#D4B896] font-black text-center">
                                  ${item.subtotal.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botón eliminar */}
                        <button
                          type="button"
                          onClick={() => eliminarProducto(index)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition flex-shrink-0"
                          title="Eliminar producto"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="space-y-6">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-4">
                Resumen de Compra
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Productos:</span>
                  <span className="text-white font-medium">
                    {productosCompra.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Unidades:</span>
                  <span className="text-white font-medium">
                    {productosCompra.reduce((sum, p) => sum + p.cantidad, 0)}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#2a2a2a] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white font-medium">
                      ${calcularSubtotal().toLocaleString()}
                    </span>
                  </div>

                  {/* Mostrar impuestos aplicados */}
                  {impuestosSeleccionados.length > 0 && (
                    <div className="bg-[#1a1a1a] rounded-lg p-3 space-y-2">
                      <p className="text-xs text-gray-500 font-medium mb-2">Impuestos aplicados:</p>
                      {impuestosSeleccionados.map((imp) => {
                        const porcentaje = parseFloat(imp.porcentaje);
                        const monto = !isNaN(porcentaje) ? (calcularSubtotal() * porcentaje) / 100 : 0;
                        return (
                          <div key={imp.impuesto_id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">
                              {imp.nombre} ({imp.porcentaje}%)
                            </span>
                            <span className={imp.tipo === 'Retención' ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>
                              {imp.tipo === 'Retención' ? '-' : '+'}${monto.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#2a2a2a]">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">TOTAL:</span>
                      <span className="text-2xl font-black text-[#D4B896]">
                        ${calcularTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={productosCompra.length === 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#D4B896] to-[#C4A576] text-[#0a0a0a] rounded-xl font-black text-lg hover:shadow-lg hover:shadow-[#D4B896]/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Registrar Compra
              </button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Se generará automáticamente el número de compra y los movimientos de inventario
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}