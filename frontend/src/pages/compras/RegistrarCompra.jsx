import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { proveedoresService } from "../../services/proveedoresService";
import { productosService } from "../../services/productosService";
import { inventarioKardexService } from "../../services/inventarioKardexService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

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

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [prov, prod] = await Promise.all([
        proveedoresService.getAll(),
        productosService.getAll()
      ]);
      setProveedores(prov);
      setProductos(prod);
    } catch {
      toast.error("Error al cargar datos");
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
        cantidad: 1,
        costo_unitario: producto.ultimo_costo || 0,
        precio_venta: producto.precio_venta || 0,
        subtotal: producto.ultimo_costo || 0
      }
    ]);
    setBusquedaProducto("");
    setMostrarBusqueda(false);
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

  const calcularTotal = () => {
    return productosCompra.reduce((sum, p) => sum + p.subtotal, 0);
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
              onClick={() => navigate("/inventario")}
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
                  <input
                    type="text"
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#D4B896] transition"
                    autoFocus
                  />
                  
                  {busquedaProducto && productosFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden z-10 max-h-60 overflow-y-auto">
                      {productosFiltrados.map(producto => (
                        <button
                          key={producto.id}
                          type="button"
                          onClick={() => agregarProducto(producto)}
                          className="w-full px-4 py-3 text-left hover:bg-[#2a2a2a] transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-white font-medium">{producto.nombre}</p>
                            <p className="text-xs text-gray-500">{producto.codigo}</p>
                          </div>
                          <span className="text-[#D4B896] text-sm">${producto.precio_venta}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Lista de productos */}
              {productosCompra.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay productos agregados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productosCompra.map((item, index) => (
                    <div key={index} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <div className="col-span-4 md:col-span-1">
                            <label className="block text-xs text-gray-500 mb-1">Producto</label>
                            <p className="text-white font-medium text-sm">{item.nombre}</p>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Costo Unit.</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.costo_unitario}
                              onChange={(e) => actualizarProducto(index, 'costo_unitario', e.target.value)}
                              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Precio Venta</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.precio_venta}
                              onChange={(e) => actualizarProducto(index, 'precio_venta', e.target.value)}
                              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#D4B896] transition"
                            />
                          </div>
                        </div>

                        <div className="text-right">
                          <label className="block text-xs text-gray-500 mb-1">Subtotal</label>
                          <p className="text-[#D4B896] font-bold">
                            ${item.subtotal.toLocaleString()}
                          </p>
                          <button
                            type="button"
                            onClick={() => eliminarProducto(index)}
                            className="mt-2 p-1 text-gray-400 hover:text-red-400 transition"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
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

                <div className="pt-3 border-t border-[#2a2a2a]">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Total:</span>
                    <span className="text-2xl font-black text-[#D4B896]">
                      ${calcularTotal().toLocaleString()}
                    </span>
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
