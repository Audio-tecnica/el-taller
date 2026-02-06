import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { proveedoresService } from "../../services/proveedoresService";
import { inventarioKardexService } from "../../services/inventarioKardexService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";
import api from "../../services/api";

export default function RegistrarCompra() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [locales] = useState([
    { id: "00000000-0000-0000-0000-000000000001", nombre: "Castellana" },
    { id: "00000000-0000-0000-0000-000000000002", nombre: "Avenida 1ra" }
  ]);

  const [compra, setCompra] = useState({
    proveedor_id: "",
    local_id: "00000000-0000-0000-0000-000000000001",
    numero_factura: "",
    fecha_factura: new Date().toISOString().split('T')[0],
    observaciones: ""
  });

  const [productosCompra, setProductosCompra] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  
  // Estados para IVA
  const [incluirIVA, setIncluirIVA] = useState(false);
  const [ivaPorcentaje, setIvaPorcentaje] = useState(19); // 19% por defecto


  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar proveedores
      const prov = await proveedoresService.getAll();
      setProveedores(prov);
      
      // Cargar productos usando el endpoint correcto
      const prodResponse = await api.get('/productos');
      setProductos(prodResponse.data);
      
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar datos: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const agregarProducto = (producto) => {
    const existe = productosCompra.find(p => p.producto_id === producto.id);
    if (existe) {
      toast.error("El producto ya está agregado");
      return;
    }

    setProductosCompra([
      ...productosCompra,
      {
        producto_id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria?.nombre || null,
        cantidad: 1,
        costo_unitario: producto.ultimo_costo || 0,
        precio_venta: producto.precio_venta || 0,
        subtotal: producto.ultimo_costo || 0
      }
    ]);
    setBusquedaProducto("");
    setMostrarBusqueda(false);
    toast.success(`${producto.nombre} agregado`);
  };

  const actualizarProducto = (index, campo, valor) => {
    const nuevosProductos = [...productosCompra];
    nuevosProductos[index][campo] = parseFloat(valor) || 0;
    
    if (campo === 'cantidad' || campo === 'costo_unitario') {
      nuevosProductos[index].subtotal = 
        nuevosProductos[index].cantidad * nuevosProductos[index].costo_unitario;
    }
    
    setProductosCompra(nuevosProductos);
  };

  const eliminarProducto = (index) => {
    setProductosCompra(productosCompra.filter((_, i) => i !== index));
  };

  const calcularSubtotal = () => {
    return productosCompra.reduce((sum, p) => sum + p.subtotal, 0);
  };

  const calcularIVA = () => {
    if (!incluirIVA) return 0;
    return (calcularSubtotal() * ivaPorcentaje) / 100;
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularIVA();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!compra.proveedor_id) {
      toast.error("Selecciona un proveedor");
      return;
    }

    if (productosCompra.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    const hasInvalidProducts = productosCompra.some(p => p.cantidad <= 0 || p.costo_unitario <= 0);
    if (hasInvalidProducts) {
      toast.error("Todos los productos deben tener cantidad y costo válidos");
      return;
    }

    try {
      await inventarioKardexService.registrarCompra({
        ...compra,
        incluir_iva: incluirIVA,
        iva_porcentaje: incluirIVA ? ivaPorcentaje : 0,
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

  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busquedaProducto.toLowerCase())
  ).slice(0, 10);

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
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <img src={logo} alt="El Taller" className="w-10 h-10 rounded-xl object-contain bg-black" />
              <div>
                <h1 className="text-xl font-black text-white">Nueva Compra</h1>
                <p className="text-xs text-[#D4B896]">Registro de Compra a Proveedor</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
            >
              Cancelar
            </button>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información de la Compra */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos Generales */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Información General</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Proveedor *
                  </label>
                  <select
                    required
                    value={compra.proveedor_id}
                    onChange={(e) => setCompra({ ...compra, proveedor_id: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Local *
                  </label>
                  <select
                    required
                    value={compra.local_id}
                    onChange={(e) => setCompra({ ...compra, local_id: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                  >
                    {locales.map(l => (
                      <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Fecha Factura
                  </label>
                  <input
                    type="date"
                    value={compra.fecha_factura}
                    onChange={(e) => setCompra({ ...compra, fecha_factura: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Número de Factura
                  </label>
                  <input
                    type="text"
                    value={compra.numero_factura}
                    onChange={(e) => setCompra({ ...compra, numero_factura: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                    placeholder="FAC-001"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={compra.observaciones}
                    onChange={(e) => setCompra({ ...compra, observaciones: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition resize-none"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Productos</h2>
                <button
                  type="button"
                  onClick={() => setMostrarBusqueda(!mostrarBusqueda)}
                  className="px-4 py-2 bg-[#D4B896] text-[#0a0a0a] rounded-lg font-bold text-sm hover:shadow-lg hover:shadow-[#D4B896]/30 transition"
                >
                  + Agregar Producto
                </button>
              </div>

              {/* Búsqueda de productos */}
              {mostrarBusqueda && (
                <div className="mb-4 relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={busquedaProducto}
                      onChange={(e) => setBusquedaProducto(e.target.value)}
                      placeholder="Buscar por nombre, código o categoría..."
                      className="w-full px-4 py-3 pl-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#D4B896] transition"
                      autoFocus
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  {busquedaProducto && productosFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden z-10 max-h-96 overflow-y-auto shadow-2xl">
                      {productosFiltrados.map(producto => (
                          <button
                            key={producto.id}
                            type="button"
                            onClick={() => agregarProducto(producto)}
                            className="w-full px-4 py-4 text-left hover:bg-[#2a2a2a] transition border-b border-[#2a2a2a] last:border-b-0 group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-white font-bold text-base group-hover:text-[#D4B896] transition truncate">
                                    {producto.nombre}
                                  </h4>
                                  {producto.categoria?.icono && (
                                    <span className="text-lg flex-shrink-0">{producto.categoria.icono}</span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-3 flex-wrap">
                                  {producto.categoria?.nombre && (
                                    <span className="px-2 py-0.5 bg-[#2a2a2a] text-[#D4B896] text-xs rounded-full">
                                      {producto.categoria.nombre}
                                    </span>
                                  )}
                                  {producto.codigo && (
                                    <span className="text-xs text-gray-500 font-mono">
                                      {producto.codigo}
                                    </span>
                                  )}
                                  {/* Desglose de stock por local */}
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-400">📍</span>
                                    <span className={`${(producto.stock_local1 || 0) > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>
                                      Castellana: {producto.stock_local1 || 0}
                                    </span>
                                    <span className="text-gray-600">|</span>
                                    <span className={`${(producto.stock_local2 || 0) > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>
                                      Avenida 1ra: {producto.stock_local2 || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right flex-shrink-0">
                                <p className="text-[#D4B896] font-bold text-lg">
                                  ${Number(producto.precio_venta || 0).toLocaleString()}
                                </p>
                                {producto.ultimo_costo > 0 && (
                                  <p className="text-xs text-gray-500">
                                    Último costo: ${Number(producto.ultimo_costo).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                  
                  {busquedaProducto && productosFiltrados.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 text-center">
                      <p className="text-gray-500">No se encontraron productos</p>
                      <p className="text-xs text-gray-600 mt-1">Intenta con otro término de búsqueda</p>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de productos */}
              {productosCompra.length === 0 ? (
                <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-dashed border-[#2a2a2a]">
                  <div className="w-20 h-20 mx-auto mb-4 bg-[#0a0a0a] rounded-full flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                  <p className="text-gray-500 font-medium mb-1">No hay productos agregados</p>
                  <p className="text-xs text-gray-600">Click en "Agregar Producto" para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productosCompra.map((item, index) => (
                    <div key={index} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#D4B896]/30 transition">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          {/* Nombre y categoría */}
                          <div className="mb-3">
                            <h4 className="text-white font-bold text-base mb-1">{item.nombre}</h4>
                            {item.categoria && (
                              <span className="text-xs text-gray-500 bg-[#0a0a0a] px-2 py-1 rounded">
                                {item.categoria}
                              </span>
                            )}
                          </div>
                          
                          {/* Inputs en grid */}
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">Cantidad *</label>
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-center font-bold focus:outline-none focus:border-[#D4B896] transition"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">Costo Unitario *</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.costo_unitario}
                                  onChange={(e) => actualizarProducto(index, 'costo_unitario', e.target.value)}
                                  className="w-full px-3 py-2 pl-6 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-center font-medium focus:outline-none focus:border-[#D4B896] transition"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">Precio Venta</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.precio_venta}
                                  onChange={(e) => actualizarProducto(index, 'precio_venta', e.target.value)}
                                  className="w-full px-3 py-2 pl-6 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white text-center font-medium focus:outline-none focus:border-emerald-500 transition"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1 font-medium">Subtotal</label>
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
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
              <h2 className="text-lg font-bold text-white mb-4">Resumen de Compra</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Productos:</span>
                  <span className="text-white font-medium">{productosCompra.length}</span>
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

                  {/* Checkbox para incluir IVA */}
                  <div className="bg-[#1a1a1a] rounded-lg p-3 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incluirIVA}
                        onChange={(e) => setIncluirIVA(e.target.checked)}
                        className="w-4 h-4 rounded border-[#2a2a2a] bg-[#0a0a0a] text-[#D4B896] focus:ring-[#D4B896] focus:ring-offset-0"
                      />
                      <span className="text-sm text-gray-300">Incluir IVA</span>
                    </label>

                    {incluirIVA && (
                      <div className="space-y-2 pl-6">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">%:</label>
                          <input
                            type="number"
                            value={ivaPorcentaje}
                            onChange={(e) => setIvaPorcentaje(parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white text-sm focus:outline-none focus:border-[#D4B896]"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          <span className="text-xs text-gray-500">
                            = ${calcularIVA().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

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