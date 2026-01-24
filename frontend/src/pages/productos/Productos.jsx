import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productosService } from "../../services/productosService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function Productos() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  
  // Modal para seleccionar barril a activar
  const [modalBarril, setModalBarril] = useState({ open: false, local: null, productoActual: null });
  const [barrilesDisponibles, setBarrilesDisponibles] = useState([]);

  const [formData, setFormData] = useState({
    nombre: "",
    categoria_id: "",
    precio_venta: "",
    precio_mayorista: "",
    presentacion: "",
    stock_local1: 0,
    stock_local2: 0,
    alerta_stock: 10,
    disponible_b2b: false,
    unidad_medida: "unidades",
    capacidad_barril: 85,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [prods, cats] = await Promise.all([
        productosService.getProductos(),
        productosService.getCategorias(),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Determinar unidad_medida basado en categoría o presentación
      const categoriaSeleccionada = categorias.find(c => c.id === formData.categoria_id);
      const esBarril = categoriaSeleccionada?.nombre?.toLowerCase().includes('barril') || 
                       formData.presentacion?.toLowerCase() === 'barril';
      
      const dataToSend = {
        ...formData,
        unidad_medida: esBarril ? 'barriles' : 'unidades',
      };
      
      if (productoEditar) {
        await productosService.actualizarProducto(productoEditar.id, dataToSend);
        toast.success("Producto actualizado");
      } else {
        await productosService.crearProducto(dataToSend);
        toast.success("Producto creado");
      }
      setModalOpen(false);
      resetForm();
      cargarDatos();
    } catch (error) {
      toast.error("Error al guardar producto");
    }
  };

  const handleEditar = (producto) => {
    setProductoEditar(producto);
    setFormData({
      nombre: producto.nombre,
      categoria_id: producto.categoria_id || "",
      precio_venta: producto.precio_venta,
      precio_mayorista: producto.precio_mayorista || "",
      presentacion: producto.presentacion || "",
      stock_local1: producto.stock_local1,
      stock_local2: producto.stock_local2,
      alerta_stock: producto.alerta_stock,
      disponible_b2b: producto.disponible_b2b,
      unidad_medida: producto.unidad_medida || "unidades",
      capacidad_barril: producto.capacidad_barril || 85,
    });
    setModalOpen(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Eliminar este producto?")) {
      try {
        await productosService.eliminarProducto(id);
        toast.success("Producto eliminado");
        cargarDatos();
      } catch (error) {
        toast.error("Error al eliminar");
      }
    }
  };

  // Abrir modal para seleccionar qué barril activar
  const abrirModalBarril = (local) => {
    // Filtrar productos que son barriles Y tienen stock en ese local
    const stockKey = `stock_local${local}`;
    const barrilActivoKey = `barril_activo_local${local}`;
    
    const barriles = productos.filter(p => 
      p.unidad_medida === 'barriles' && 
      p[stockKey] > 0 && 
      !p[barrilActivoKey] // No tiene barril activo actualmente
    );
    
    if (barriles.length === 0) {
      toast.error(`No hay barriles disponibles en bodega para Local ${local}`);
      return;
    }
    
    setBarrilesDisponibles(barriles);
    setModalBarril({ open: true, local, productoActual: null });
  };

  const handleActivarBarril = async (productoId, local) => {
    try {
      const response = await fetch(
        "https://el-taller.onrender.com/api/barriles/activar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ producto_id: productoId, local }),
        }
      );

      if (response.ok) {
        toast.success("✅ Barril activado en máquina");
        setModalBarril({ open: false, local: null, productoActual: null });
        cargarDatos();
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al activar barril");
      }
    } catch (error) {
      toast.error("Error al activar barril");
    }
  };

  const handleCambiarBarril = async (productoId, local) => {
    if (window.confirm(`¿Cambiar barril vacío y activar uno nuevo en Local ${local}?`)) {
      try {
        await fetch('https://el-taller.onrender.com/api/barriles/desactivar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ producto_id: productoId, local })
        });
        
        const response = await fetch('https://el-taller.onrender.com/api/barriles/activar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ producto_id: productoId, local })
        });
        
        if (response.ok) {
          toast.success('✅ Barril cambiado exitosamente');
          cargarDatos();
        } else {
          const error = await response.json();
          toast.error(error.error || 'Error al cambiar barril');
        }
      } catch (error) {
        toast.error('Error al cambiar barril');
      }
    }
  };

  const resetForm = () => {
    setProductoEditar(null);
    setFormData({
      nombre: "",
      categoria_id: "",
      precio_venta: "",
      precio_mayorista: "",
      presentacion: "",
      stock_local1: 0,
      stock_local2: 0,
      alerta_stock: 10,
      disponible_b2b: false,
      unidad_medida: "unidades",
      capacidad_barril: 85,
    });
  };

  const productosFiltrados = filtroCategoria
    ? productos.filter((p) => p.categoria_id === filtroCategoria)
    : productos;

  // Agrupar barriles activos por local para mostrar resumen
  const barrilesActivosLocal1 = productos.filter(p => p.barril_activo_local1);
  const barrilesActivosLocal2 = productos.filter(p => p.barril_activo_local2);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4B896] text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header - Fixed */}
      <header className="bg-[#0a0a0a] border-b border-[#2a2a2a] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-3 hover:opacity-80 transition"
            >
              <img
                src={logo}
                alt="El Taller"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h1 className="text-base font-bold text-[#D4B896] tracking-wide">
                  EL TALLER
                </h1>
                <p className="text-[10px] text-gray-500">Productos</p>
              </div>
            </button>
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C4A576] transition text-sm"
          >
            + Nuevo Producto
          </button>
        </div>
      </header>

      {/* Filtros - Fixed */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFiltroCategoria("")}
              className={`px-3 py-1.5 rounded-lg font-medium transition text-sm whitespace-nowrap flex-shrink-0 ${
                filtroCategoria === ""
                  ? "bg-[#D4B896] text-[#0a0a0a]"
                  : "bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]"
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFiltroCategoria(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition text-sm whitespace-nowrap flex-shrink-0 ${
                  filtroCategoria === cat.id
                    ? "bg-[#D4B896] text-[#0a0a0a]"
                    : "bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]"
                }`}
              >
                {cat.icono} {cat.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel de Barriles Activos - Resumen rápido */}
      {(barrilesActivosLocal1.length > 0 || barrilesActivosLocal2.length > 0) && (
        <div className="bg-[#0f0f0f] border-b border-[#1a1a1a] flex-shrink-0">
          <div className="max-w-7xl mx-auto px-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Local 1 */}
              <div className="bg-[#141414] rounded-lg p-2 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">📍 Local 1</span>
                  <button 
                    onClick={() => abrirModalBarril(1)}
                    className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded hover:bg-emerald-500/30 transition"
                  >
                    + Activar
                  </button>
                </div>
                {barrilesActivosLocal1.length > 0 ? (
                  <div className="space-y-1">
                    {barrilesActivosLocal1.map(b => (
                      <div key={b.id} className="flex items-center justify-between bg-black/30 rounded px-2 py-1">
                        <span className="text-[10px] text-gray-300 truncate flex-1">{b.nombre}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-12 bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                b.vasos_disponibles_local1 <= 15 ? 'bg-red-500' :
                                b.vasos_disponibles_local1 <= 30 ? 'bg-yellow-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${(b.vasos_disponibles_local1 / b.capacidad_barril) * 100}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${
                            b.vasos_disponibles_local1 <= 15 ? 'text-red-400' :
                            b.vasos_disponibles_local1 <= 30 ? 'text-yellow-400' : 'text-emerald-400'
                          }`}>
                            {b.vasos_disponibles_local1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500">Sin barriles activos</p>
                )}
              </div>

              {/* Local 2 */}
              <div className="bg-[#141414] rounded-lg p-2 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">📍 Local 2</span>
                  <button 
                    onClick={() => abrirModalBarril(2)}
                    className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded hover:bg-emerald-500/30 transition"
                  >
                    + Activar
                  </button>
                </div>
                {barrilesActivosLocal2.length > 0 ? (
                  <div className="space-y-1">
                    {barrilesActivosLocal2.map(b => (
                      <div key={b.id} className="flex items-center justify-between bg-black/30 rounded px-2 py-1">
                        <span className="text-[10px] text-gray-300 truncate flex-1">{b.nombre}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-12 bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                b.vasos_disponibles_local2 <= 15 ? 'bg-red-500' :
                                b.vasos_disponibles_local2 <= 30 ? 'bg-yellow-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${(b.vasos_disponibles_local2 / b.capacidad_barril) * 100}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${
                            b.vasos_disponibles_local2 <= 15 ? 'text-red-400' :
                            b.vasos_disponibles_local2 <= 30 ? 'text-yellow-400' : 'text-emerald-400'
                          }`}>
                            {b.vasos_disponibles_local2}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500">Sin barriles activos</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Productos - Scrollable - GRID OPTIMIZADO PARA TABLET */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 py-3">
          {/* Grid responsive optimizado para tablet landscape */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {productosFiltrados.map((producto) => {
              const esBarril = producto.unidad_medida === "barriles";

              return (
                <div
                  key={producto.id}
                  className={`bg-[#141414] rounded-xl p-3 transition-all border-l-4 ${
                    producto.categoria?.nombre?.includes("Barril")
                      ? "border-l-amber-500"
                      : producto.categoria?.nombre?.includes("Botella")
                        ? "border-l-green-500"
                        : producto.categoria?.nombre?.includes("Lata")
                          ? "border-l-blue-500"
                          : producto.categoria?.nombre?.includes("Comida") ||
                              producto.categoria?.nombre?.includes("Piqueo")
                            ? "border-l-orange-500"
                            : producto.categoria?.nombre?.includes("Bebida")
                              ? "border-l-purple-500"
                              : "border-l-gray-700"
                  }`}
                >
                  {/* Header compacto */}
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-2xl">{producto.categoria?.icono || "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm leading-tight truncate">
                        {producto.nombre}
                      </h3>
                      <span className="text-[10px] text-gray-500 block truncate">
                        {producto.categoria?.nombre}
                      </span>
                    </div>
                  </div>

                  {/* Precio */}
                  <div className="mb-2">
                    <span className="text-[#D4B896] font-black text-lg">
                      ${Number(producto.precio_venta).toLocaleString()}
                    </span>
                    {esBarril && (
                      <span className="text-[10px] text-gray-500 ml-1">/ vaso</span>
                    )}
                  </div>

                  {/* STOCK PARA BARRILES */}
                  {esBarril ? (
                    <div className="space-y-2">
                      {/* Local 1 */}
                      <div className="bg-black/40 rounded-lg p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-white">📍 L1</span>
                          <span className="text-[10px] text-gray-400">
                            🛢️ {producto.stock_local1} bodega
                          </span>
                        </div>
                        
                        {producto.barril_activo_local1 ? (
                          <>
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                              🟢 ACTIVO
                            </span>
                            <div className="mt-1">
                              <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    producto.vasos_disponibles_local1 <= 15 ? 'bg-red-500' :
                                    producto.vasos_disponibles_local1 <= 30 ? 'bg-yellow-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${(producto.vasos_disponibles_local1 / producto.capacidad_barril) * 100}%` }}
                                />
                              </div>
                              <div className="flex justify-between">
                                <span className={`text-xs font-bold ${
                                  producto.vasos_disponibles_local1 <= 15 ? 'text-red-400' :
                                  producto.vasos_disponibles_local1 <= 30 ? 'text-yellow-400' : 'text-emerald-400'
                                }`}>
                                  {producto.vasos_disponibles_local1} vasos
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {Math.round((producto.vasos_disponibles_local1 / producto.capacidad_barril) * 100)}%
                                </span>
                              </div>
                            </div>
                            {producto.vasos_disponibles_local1 <= 15 && producto.stock_local1 > 0 && (
                              <button
                                onClick={() => handleCambiarBarril(producto.id, 1)}
                                className="w-full mt-1 py-1 text-[10px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
                              >
                                🔄 Cambiar
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleActivarBarril(producto.id, 1)}
                            disabled={producto.stock_local1 <= 0}
                            className="w-full mt-1 py-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition disabled:opacity-30"
                          >
                            {producto.stock_local1 > 0 ? '▶ Activar' : '❌ Sin stock'}
                          </button>
                        )}
                      </div>

                      {/* Local 2 */}
                      <div className="bg-black/40 rounded-lg p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-white">📍 L2</span>
                          <span className="text-[10px] text-gray-400">
                            🛢️ {producto.stock_local2} bodega
                          </span>
                        </div>
                        
                        {producto.barril_activo_local2 ? (
                          <>
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                              🟢 ACTIVO
                            </span>
                            <div className="mt-1">
                              <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    producto.vasos_disponibles_local2 <= 15 ? 'bg-red-500' :
                                    producto.vasos_disponibles_local2 <= 30 ? 'bg-yellow-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${(producto.vasos_disponibles_local2 / producto.capacidad_barril) * 100}%` }}
                                />
                              </div>
                              <div className="flex justify-between">
                                <span className={`text-xs font-bold ${
                                  producto.vasos_disponibles_local2 <= 15 ? 'text-red-400' :
                                  producto.vasos_disponibles_local2 <= 30 ? 'text-yellow-400' : 'text-emerald-400'
                                }`}>
                                  {producto.vasos_disponibles_local2} vasos
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {Math.round((producto.vasos_disponibles_local2 / producto.capacidad_barril) * 100)}%
                                </span>
                              </div>
                            </div>
                            {producto.vasos_disponibles_local2 <= 15 && producto.stock_local2 > 0 && (
                              <button
                                onClick={() => handleCambiarBarril(producto.id, 2)}
                                className="w-full mt-1 py-1 text-[10px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
                              >
                                🔄 Cambiar
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleActivarBarril(producto.id, 2)}
                            disabled={producto.stock_local2 <= 0}
                            className="w-full mt-1 py-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition disabled:opacity-30"
                          >
                            {producto.stock_local2 > 0 ? '▶ Activar' : '❌ Sin stock'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* STOCK NORMAL - Más compacto */
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-black/40 rounded-lg p-2 text-center">
                        <span className="text-[10px] text-gray-500 block">Local 1</span>
                        <span className={`text-xl font-black ${producto.stock_local1 <= producto.alerta_stock ? "text-red-500" : "text-emerald-500"}`}>
                          {producto.stock_local1}
                        </span>
                      </div>
                      <div className="bg-black/40 rounded-lg p-2 text-center">
                        <span className="text-[10px] text-gray-500 block">Local 2</span>
                        <span className={`text-xl font-black ${producto.stock_local2 <= producto.alerta_stock ? "text-red-500" : "text-emerald-500"}`}>
                          {producto.stock_local2}
                        </span>
                      </div>
                    </div>
                  )}

                  {producto.disponible_b2b && (
                    <div className="mb-2">
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                        💼 B2B: ${Number(producto.precio_mayorista).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Botones de acción compactos */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEditar(producto)}
                      className="flex-1 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-xs font-semibold"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(producto.id)}
                      className="py-2 px-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {productosFiltrados.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-400 text-lg mb-2">No hay productos</p>
              <p className="text-gray-600 text-sm mb-6">
                Agrega tu primer producto para empezar
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setModalOpen(true);
                }}
                className="px-6 py-3 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C4A576] transition"
              >
                Crear primer producto
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Seleccionar Barril para Activar */}
      {modalBarril.open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-[#2a2a2a]">
              <h2 className="text-lg font-bold text-white">
                🛢️ Activar Barril - Local {modalBarril.local}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Selecciona el barril que deseas activar en la máquina
              </p>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {barrilesDisponibles.length > 0 ? (
                barrilesDisponibles.map((barril) => (
                  <button
                    key={barril.id}
                    onClick={() => handleActivarBarril(barril.id, modalBarril.local)}
                    className="w-full p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:border-emerald-500 hover:bg-[#1f1f1f] transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{barril.categoria?.icono || "🍺"}</span>
                      <div className="flex-1">
                        <h3 className="text-white font-bold">{barril.nombre}</h3>
                        <p className="text-xs text-gray-400">
                          {barril.capacidad_barril} vasos por barril
                        </p>
                        <p className="text-xs text-emerald-400 mt-1">
                          🛢️ {modalBarril.local === 1 ? barril.stock_local1 : barril.stock_local2} disponibles en bodega
                        </p>
                      </div>
                      <span className="text-emerald-500 text-2xl">▶</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No hay barriles disponibles</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Asegúrate de tener stock en bodega
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#2a2a2a]">
              <button
                onClick={() => setModalBarril({ open: false, local: null, productoActual: null })}
                className="w-full py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Producto */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[#2a2a2a]">
              <h2 className="text-lg font-bold text-white">
                {productoEditar ? "Editar Producto" : "Nuevo Producto"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#D4B896] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) =>
                    setFormData({ ...formData, categoria_id: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#D4B896]"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icono} {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Precio Venta
                  </label>
                  <input
                    type="number"
                    value={formData.precio_venta}
                    onChange={(e) =>
                      setFormData({ ...formData, precio_venta: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#D4B896]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Precio Mayorista
                  </label>
                  <input
                    type="number"
                    value={formData.precio_mayorista}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio_mayorista: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#D4B896]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Presentación
                </label>
                <select
                  value={formData.presentacion || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, presentacion: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#D4B896]"
                >
                  <option value="">Sin especificar</option>
                  <option value="Barril">Barril</option>
                  <option value="Botella">Botella</option>
                  <option value="Lata">Lata</option>
                  <option value="Litro">Litro</option>
                  <option value="Media">Media (500ml)</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              {/* Campos específicos de barril */}
              {(formData.presentacion === 'Barril' || 
                categorias.find(c => c.id === formData.categoria_id)?.nombre?.toLowerCase().includes('barril')) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-xs text-amber-400 mb-2 font-semibold">🛢️ Configuración de Barril</p>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Capacidad (vasos por barril)
                    </label>
                    <input
                      type="number"
                      value={formData.capacidad_barril}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacidad_barril: parseInt(e.target.value) || 85,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Stock Local 1
                  </label>
                  <input
                    type="number"
                    value={formData.stock_local1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_local1: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#D4B896]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Stock Local 2
                  </label>
                  <input
                    type="number"
                    value={formData.stock_local2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_local2: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#D4B896]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Alerta Stock Bajo
                </label>
                <input
                  type="number"
                  value={formData.alerta_stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alerta_stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#D4B896]"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="disponible_b2b"
                  checked={formData.disponible_b2b}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      disponible_b2b: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-[#D4B896] bg-[#1a1a1a] border-[#2a2a2a] rounded focus:ring-[#D4B896]"
                />
                <label
                  htmlFor="disponible_b2b"
                  className="ml-2 text-xs text-gray-300"
                >
                  Disponible para venta B2B (mayorista)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a] text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C4A576] transition text-sm"
                >
                  {productoEditar ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}