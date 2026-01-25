import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { productosService } from "../../services/productosService";
import { inventarioService } from "../../services/inventarioService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function Productos() {
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState("catalogo"); // catalogo, stock, movimientos
  
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const [modalBarril, setModalBarril] = useState({ open: false, local: null });

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

  const cargarDatos = useCallback(async () => {
    try {
      const [prods, cats, inventarioData] = await Promise.all([
        productosService.getProductos(),
        productosService.getCategorias(),
        inventarioService.getInventarioConsolidado().catch(() => ({ productos: [], resumen: null }))
      ]);
      setProductos(prods);
      setCategorias(cats);
      setResumen(inventarioData.resumen);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      cargarDatos();
    }, 10000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  // Refresh cuando vuelves a la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        cargarDatos();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [cargarDatos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const categoriaSeleccionada = categorias.find(
        (c) => c.id === formData.categoria_id
      );
      const esBarril =
        categoriaSeleccionada?.nombre?.toLowerCase().includes("barril") ||
        formData.presentacion?.toLowerCase() === "barril";

      const dataToSend = {
        ...formData,
        unidad_medida: esBarril ? "barriles" : "unidades",
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
    } catch {
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
      } catch {
        toast.error("Error al eliminar");
      }
    }
  };

  const handleActivarBarril = async (productoId, local) => {
    try {
      const response = await fetch(
        "https://el-taller.onrender.com/api/barriles/activar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({ producto_id: productoId, local }),
        }
      );

      if (response.ok) {
        toast.success("Barril activado en máquina");
        setModalBarril({ open: false, local: null });
        cargarDatos();
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al activar barril");
      }
    } catch {
      toast.error("Error al activar barril");
    }
  };

  const handleCambiarBarril = async (productoId, local) => {
    if (window.confirm("¿Cambiar barril vacío y activar uno nuevo en Local " + local + "?")) {
      try {
        await fetch("https://el-taller.onrender.com/api/barriles/desactivar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({ producto_id: productoId, local }),
        });

        const response = await fetch(
          "https://el-taller.onrender.com/api/barriles/activar",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
            body: JSON.stringify({ producto_id: productoId, local }),
          }
        );

        if (response.ok) {
          toast.success("Barril cambiado exitosamente");
          cargarDatos();
        } else {
          const error = await response.json();
          toast.error(error.error || "Error al cambiar barril");
        }
      } catch {
        toast.error("Error al cambiar barril");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4B896] text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-[#2a2a2a] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 py-2 flex justify-between items-center">
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
              <p className="text-[10px] text-gray-500">Productos e Inventario</p>
            </div>
          </button>
          {tabActiva === "catalogo" && (
            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C4A576] transition text-sm"
            >
              + Nuevo Producto
            </button>
          )}
        </div>
      </header>

      {/* Tabs de navegación */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => setTabActiva("catalogo")}
              className={
                "px-4 py-2 rounded-lg font-medium transition text-sm " +
                (tabActiva === "catalogo"
                  ? "bg-[#D4B896] text-[#0a0a0a]"
                  : "bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]")
              }
            >
              📦 Catálogo
            </button>
            <button
              onClick={() => setTabActiva("stock")}
              className={
                "px-4 py-2 rounded-lg font-medium transition text-sm " +
                (tabActiva === "stock"
                  ? "bg-[#D4B896] text-[#0a0a0a]"
                  : "bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]")
              }
            >
              📊 Control de Stock
            </button>
            <button
              onClick={() => setTabActiva("movimientos")}
              className={
                "px-4 py-2 rounded-lg font-medium transition text-sm " +
                (tabActiva === "movimientos"
                  ? "bg-[#D4B896] text-[#0a0a0a]"
                  : "bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]")
              }
            >
              📋 Movimientos
            </button>
          </div>
        </div>
      </div>

      {/* Contenido según tab activa */}
      {tabActiva === "catalogo" && (
        <TabCatalogo
          productos={productos}
          categorias={categorias}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          handleEditar={handleEditar}
          handleEliminar={handleEliminar}
          handleActivarBarril={handleActivarBarril}
          handleCambiarBarril={handleCambiarBarril}
        />
      )}
      
      {tabActiva === "stock" && (
        <TabStock 
          productos={productos} 
          resumen={resumen} 
          onRecargar={cargarDatos}
        />
      )}
      
      {tabActiva === "movimientos" && <TabMovimientos />}

      {/* Modales del catálogo */}
      {modalBarril.open && (
        <ModalBarril
          modalBarril={modalBarril}
          setModalBarril={setModalBarril}
          handleActivarBarril={handleActivarBarril}
          productos={productos}
        />
      )}

      {modalOpen && (
        <ModalProducto
          setModalOpen={setModalOpen}
          productoEditar={productoEditar}
          formData={formData}
          setFormData={setFormData}
          categorias={categorias}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ==================== TAB 1: CATÁLOGO ====================
function TabCatalogo({
  productos,
  categorias,
  filtroCategoria,
  setFiltroCategoria,
  handleEditar,
  handleEliminar,
  handleActivarBarril,
  handleCambiarBarril,
}) {
  const productosBarril = productos.filter((p) => p.unidad_medida === "barriles");
  const productosNormales = productos.filter((p) => p.unidad_medida !== "barriles");

  const productosFiltrados = filtroCategoria
    ? productos.filter((p) => p.categoria_id === filtroCategoria)
    : null;

  const getCategoriaColorBorder = (categoria) => {
    if (!categoria || !categoria.nombre) return "border-l-gray-700";
    const nombre = categoria.nombre.toLowerCase();
    if (nombre.includes("botella")) return "border-l-green-500";
    if (nombre.includes("lata")) return "border-l-blue-500";
    if (nombre.includes("comida") || nombre.includes("piqueo")) return "border-l-orange-500";
    if (nombre.includes("bebida")) return "border-l-purple-500";
    return "border-l-gray-700";
  };

  const getBarraColor = (vasos) => {
    if (vasos <= 15) return "bg-red-500";
    if (vasos <= 30) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const getVasosColor = (vasos) => {
    if (vasos <= 15) return "text-red-400";
    if (vasos <= 30) return "text-yellow-400";
    return "text-emerald-400";
  };

  const TarjetaProductoNormal = ({ producto }) => (
    <div
      className={
        "bg-[#141414] rounded-xl p-3 border-l-4 " +
        getCategoriaColorBorder(producto.categoria)
      }
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl">{producto.categoria?.icono || "📦"}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm leading-tight truncate">
            {producto.nombre}
          </h3>
          <span className="text-[10px] text-gray-500">
            {producto.categoria?.nombre}
          </span>
        </div>
      </div>

      <div className="text-[#D4B896] font-black text-lg mb-2">
        ${Number(producto.precio_venta).toLocaleString()}
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className="bg-black/40 rounded p-1.5 text-center">
          <span className="text-[9px] text-gray-500 block">L1</span>
          <span
            className={
              "text-lg font-black " +
              (producto.stock_local1 <= producto.alerta_stock
                ? "text-red-500"
                : "text-emerald-500")
            }
          >
            {producto.stock_local1}
          </span>
        </div>
        <div className="bg-black/40 rounded p-1.5 text-center">
          <span className="text-[9px] text-gray-500 block">L2</span>
          <span
            className={
              "text-lg font-black " +
              (producto.stock_local2 <= producto.alerta_stock
                ? "text-red-500"
                : "text-emerald-500")
            }
          >
            {producto.stock_local2}
          </span>
        </div>
      </div>

      {producto.disponible_b2b && (
        <div className="mb-2">
          <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
            B2B: ${Number(producto.precio_mayorista).toLocaleString()}
          </span>
        </div>
      )}

      <div className="flex gap-1">
        <button
          onClick={() => handleEditar(producto)}
          className="flex-1 py-1.5 bg-gray-700 text-white rounded text-[10px] font-semibold hover:bg-gray-600"
        >
          Editar
        </button>
        <button
          onClick={() => handleEliminar(producto.id)}
          className="py-1.5 px-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
        >
          X
        </button>
      </div>
    </div>
  );

  const TarjetaBarril = ({ producto }) => (
    <div className="bg-[#141414] rounded-xl p-3 border-l-4 border-l-amber-500">
      <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
        <div className="flex items-center gap-2 min-w-[140px]">
          <span className="text-2xl">🍺</span>
          <div>
            <h3 className="text-white font-bold text-sm">{producto.nombre}</h3>
            <span className="text-[#D4B896] font-black text-base">
              ${Number(producto.precio_venta).toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 ml-1">/ vaso</span>
          </div>
        </div>

        <div className="flex-1 bg-black/40 rounded-lg p-2 min-w-[200px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-white">Local 1</span>
            <span className="text-[10px] text-gray-400">
              {producto.stock_local1} bodega
            </span>
          </div>
          {producto.barril_activo_local1 ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                  ACTIVO
                </span>
                <span className={"text-xs font-bold " + getVasosColor(producto.vasos_disponibles_local1)}>
                  {producto.vasos_disponibles_local1} vasos
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={"h-2 rounded-full " + getBarraColor(producto.vasos_disponibles_local1)}
                  style={{
                    width: ((producto.vasos_disponibles_local1 / producto.capacidad_barril) * 100) + "%",
                  }}
                />
              </div>
              {producto.vasos_disponibles_local1 <= 15 && producto.stock_local1 > 0 && (
                <button
                  onClick={() => handleCambiarBarril(producto.id, 1)}
                  className="mt-1 w-full py-1 text-[9px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                >
                  Cambiar
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleActivarBarril(producto.id, 1)}
              disabled={producto.stock_local1 <= 0}
              className="w-full py-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 disabled:opacity-30"
            >
              {producto.stock_local1 > 0 ? "Activar" : "Sin stock"}
            </button>
          )}
        </div>

        <div className="flex-1 bg-black/40 rounded-lg p-2 min-w-[200px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-white">Local 2</span>
            <span className="text-[10px] text-gray-400">
              {producto.stock_local2} bodega
            </span>
          </div>
          {producto.barril_activo_local2 ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                  ACTIVO
                </span>
                <span className={"text-xs font-bold " + getVasosColor(producto.vasos_disponibles_local2)}>
                  {producto.vasos_disponibles_local2} vasos
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={"h-2 rounded-full " + getBarraColor(producto.vasos_disponibles_local2)}
                  style={{
                    width: ((producto.vasos_disponibles_local2 / producto.capacidad_barril) * 100) + "%",
                  }}
                />
              </div>
              {producto.vasos_disponibles_local2 <= 15 && producto.stock_local2 > 0 && (
                <button
                  onClick={() => handleCambiarBarril(producto.id, 2)}
                  className="mt-1 w-full py-1 text-[9px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                >
                  Cambiar
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleActivarBarril(producto.id, 2)}
              disabled={producto.stock_local2 <= 0}
              className="w-full py-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 disabled:opacity-30"
            >
              {producto.stock_local2 > 0 ? "Activar" : "Sin stock"}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={() => handleEditar(producto)}
            className="py-1.5 px-3 bg-gray-700 text-white rounded text-[10px] font-semibold hover:bg-gray-600"
          >
            Editar
          </button>
          <button
            onClick={() => handleEliminar(producto.id)}
            className="py-1.5 px-3 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
          >
            X
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Filtros de categoría */}
      <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFiltroCategoria("")}
              className={
                "px-3 py-1.5 rounded-lg font-medium transition text-sm whitespace-nowrap " +
                (filtroCategoria === ""
                  ? "bg-[#D4B896] text-[#0a0a0a]"
                  : "bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]")
              }
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFiltroCategoria(cat.id)}
                className={
                  "px-3 py-1.5 rounded-lg font-medium transition text-sm whitespace-nowrap " +
                  (filtroCategoria === cat.id
                    ? "bg-[#D4B896] text-[#0a0a0a]"
                    : "bg-[#141414] text-gray-400 border border-[#2a2a2a] hover:border-[#D4B896]")
                }
              >
                {cat.icono} {cat.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 py-3">
          {productosFiltrados ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {productosFiltrados.map((producto) =>
                producto.unidad_medida === "barriles" ? (
                  <div key={producto.id} className="col-span-full">
                    <TarjetaBarril producto={producto} />
                  </div>
                ) : (
                  <TarjetaProductoNormal key={producto.id} producto={producto} />
                )
              )}
            </div>
          ) : (
            <>
              {productosBarril.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🍺</span>
                    <h2 className="text-white font-bold text-lg">
                      Cerveza al Barril
                    </h2>
                    <span className="text-xs text-gray-500">
                      ({productosBarril.length} productos)
                    </span>
                    <div className="flex-1 h-px bg-amber-500/30 ml-3"></div>
                  </div>

                  <div className="space-y-2">
                    {productosBarril.map((producto) => (
                      <TarjetaBarril key={producto.id} producto={producto} />
                    ))}
                  </div>
                </div>
              )}

              {productosNormales.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📦</span>
                    <h2 className="text-white font-bold text-lg">
                      Otros Productos
                    </h2>
                    <span className="text-xs text-gray-500">
                      ({productosNormales.length} productos)
                    </span>
                    <div className="flex-1 h-px bg-gray-700 ml-3"></div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {productosNormales.map((producto) => (
                      <TarjetaProductoNormal
                        key={producto.id}
                        producto={producto}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ==================== TAB 2: STOCK ====================
function TabStock({ productos, resumen, onRecargar }) {
  const [filtroStock, setFiltroStock] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [modalAjuste, setModalAjuste] = useState({ open: false, producto: null });
  const [modalEntrada, setModalEntrada] = useState({ open: false, producto: null });
  const [modalMovimientos, setModalMovimientos] = useState({ open: false, producto: null, movimientos: [] });

  const handleAjustar = async (productoId, local, cantidadNueva, motivo) => {
    try {
      await inventarioService.ajustarInventario(productoId, local, cantidadNueva, motivo);
      toast.success("Inventario ajustado");
      setModalAjuste({ open: false, producto: null });
      onRecargar();
    } catch {
      toast.error("Error al ajustar inventario");
    }
  };

  const handleEntrada = async (productoId, local, cantidad, motivo) => {
    try {
      await inventarioService.registrarEntrada(productoId, local, cantidad, motivo);
      toast.success("Entrada registrada");
      setModalEntrada({ open: false, producto: null });
      onRecargar();
    } catch {
      toast.error("Error al registrar entrada");
    }
  };

  const verMovimientos = async (producto) => {
    try {
      const movimientos = await inventarioService.getMovimientosProducto(producto.id);
      setModalMovimientos({ open: true, producto, movimientos });
    } catch {
      toast.error("Error al cargar movimientos");
    }
  };

  // Filtrar productos
  let productosFiltrados = productos;
  
  if (busqueda) {
    productosFiltrados = productosFiltrados.filter(p => 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }

  if (filtroStock === "bajo") {
    productosFiltrados = productosFiltrados.filter(p => 
      (p.stock_local1 + p.stock_local2) <= p.alerta_stock
    );
  } else if (filtroStock === "ok") {
    productosFiltrados = productosFiltrados.filter(p => 
      (p.stock_local1 + p.stock_local2) > p.alerta_stock
    );
  }

  const getStockColor = (stock, alerta) => {
    if (stock <= 0) return "text-red-500 bg-red-500/10";
    if (stock <= alerta) return "text-yellow-500 bg-yellow-500/10";
    return "text-emerald-500 bg-emerald-500/10";
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Resumen Cards */}
        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total Productos</p>
              <p className="text-2xl font-black text-white">{resumen.total_productos}</p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Stock Local 1</p>
              <p className="text-2xl font-black text-blue-400">{resumen.total_stock_local1}</p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Stock Local 2</p>
              <p className="text-2xl font-black text-purple-400">{resumen.total_stock_local2}</p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Stock Bajo</p>
              <p className={"text-2xl font-black " + (resumen.productos_stock_bajo > 0 ? "text-red-500" : "text-emerald-500")}>
                {resumen.productos_stock_bajo}
              </p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Valor L1</p>
              <p className="text-lg font-black text-[#D4B896]">${Number(resumen.valor_inventario_local1).toLocaleString()}</p>
            </div>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Valor L2</p>
              <p className="text-lg font-black text-[#D4B896]">${Number(resumen.valor_inventario_local2).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:border-[#D4B896] transition"
            />
          </div>

          <select
            value={filtroStock}
            onChange={(e) => setFiltroStock(e.target.value)}
            className="px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white"
          >
            <option value="">Todo el stock</option>
            <option value="bajo">Stock bajo</option>
            <option value="ok">Stock OK</option>
          </select>
        </div>

        {/* Tabla de inventario */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          {/* Header de tabla */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[#1a1a1a] text-xs text-gray-500 font-semibold uppercase">
            <div className="col-span-4">Producto</div>
            <div className="col-span-2 text-center">Local 1</div>
            <div className="col-span-2 text-center">Local 2</div>
            <div className="col-span-1 text-center">Total</div>
            <div className="col-span-1 text-center">Alerta</div>
            <div className="col-span-2 text-center">Acciones</div>
          </div>

          {/* Filas */}
          <div className="divide-y divide-[#2a2a2a]">
            {productosFiltrados.map((producto) => {
              const stockTotal = (producto.stock_local1 || 0) + (producto.stock_local2 || 0);
              const stockBajo = stockTotal <= producto.alerta_stock;

              return (
                <div 
                  key={producto.id} 
                  className={"grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-[#1a1a1a] transition " + (stockBajo ? "bg-red-500/5" : "")}
                >
                  {/* Producto */}
                  <div className="col-span-4 flex items-center gap-3">
                    <span className="text-xl">{producto.categoria?.icono || "📦"}</span>
                    <div>
                      <p className="text-white font-medium text-sm">{producto.nombre}</p>
                      <p className="text-xs text-gray-500">{producto.categoria?.nombre}</p>
                    </div>
                  </div>

                  {/* Stock Local 1 */}
                  <div className="col-span-2 text-center">
                    <span className={"px-3 py-1 rounded-lg font-bold text-sm " + getStockColor(producto.stock_local1, producto.alerta_stock / 2)}>
                      {producto.stock_local1}
                    </span>
                  </div>

                  {/* Stock Local 2 */}
                  <div className="col-span-2 text-center">
                    <span className={"px-3 py-1 rounded-lg font-bold text-sm " + getStockColor(producto.stock_local2, producto.alerta_stock / 2)}>
                      {producto.stock_local2}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="col-span-1 text-center">
                    <span className={"font-bold " + (stockBajo ? "text-red-500" : "text-white")}>
                      {stockTotal}
                    </span>
                  </div>

                  {/* Alerta */}
                  <div className="col-span-1 text-center">
                    <span className="text-gray-500 text-sm">{producto.alerta_stock}</span>
                  </div>

                  {/* Acciones */}
                  <div className="col-span-2 flex justify-center gap-1">
                    <button
                      onClick={() => setModalEntrada({ open: true, producto })}
                      className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs hover:bg-emerald-500/30 transition"
                      title="Registrar entrada"
                    >
                      +Entrada
                    </button>
                    <button
                      onClick={() => setModalAjuste({ open: true, producto })}
                      className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition"
                      title="Ajustar"
                    >
                      Ajustar
                    </button>
                    <button
                      onClick={() => verMovimientos(producto)}
                      className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs hover:bg-gray-500/30 transition"
                      title="Ver historial"
                    >
                      Hist.
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {productosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          )}
        </div>

        {/* Modales */}
        {modalEntrada.open && (
          <ModalEntrada
            producto={modalEntrada.producto}
            onClose={() => setModalEntrada({ open: false, producto: null })}
            onSubmit={handleEntrada}
          />
        )}

        {modalAjuste.open && (
          <ModalAjuste
            producto={modalAjuste.producto}
            onClose={() => setModalAjuste({ open: false, producto: null })}
            onSubmit={handleAjustar}
          />
        )}

        {modalMovimientos.open && (
          <ModalMovimientos
            producto={modalMovimientos.producto}
            movimientos={modalMovimientos.movimientos}
            onClose={() => setModalMovimientos({ open: false, producto: null, movimientos: [] })}
          />
        )}
      </div>
    </div>
  );
}

// ==================== TAB 3: MOVIMIENTOS ====================
function TabMovimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: "",
    fecha_inicio: "",
    fecha_fin: ""
  });

  useEffect(() => {
    cargarMovimientos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      const data = await inventarioService.getMovimientos({ ...filtros, limit: 100 });
      setMovimientos(data);
    } catch {
      toast.error("Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "entrada": return "bg-emerald-500/20 text-emerald-400";
      case "salida": case "venta": return "bg-red-500/20 text-red-400";
      case "ajuste": return "bg-blue-500/20 text-blue-400";
      case "transferencia_entrada": return "bg-purple-500/20 text-purple-400";
      case "transferencia_salida": return "bg-orange-500/20 text-orange-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case "entrada": return "Entrada";
      case "salida": return "Salida";
      case "venta": return "Venta";
      case "ajuste": return "Ajuste";
      case "transferencia_entrada": return "Trans. Entrada";
      case "transferencia_salida": return "Trans. Salida";
      default: return tipo;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            className="px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="venta">Ventas</option>
            <option value="ajuste">Ajustes</option>
          </select>

          <input
            type="date"
            value={filtros.fecha_inicio}
            onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
            className="px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white"
          />

          <input
            type="date"
            value={filtros.fecha_fin}
            onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
            className="px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white"
          />

          <button
            onClick={() => setFiltros({ tipo: "", fecha_inicio: "", fecha_fin: "" })}
            className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
          >
            Limpiar filtros
          </button>
        </div>

        {/* Lista de movimientos */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando movimientos...</p>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {movimientos.map((mov) => (
                <div key={mov.id} className="p-4 hover:bg-[#1a1a1a] transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={"px-3 py-1 rounded-lg text-xs font-medium " + getTipoColor(mov.tipo)}>
                        {getTipoLabel(mov.tipo)}
                      </span>
                      <div>
                        <p className="text-white font-medium">{mov.producto_nombre || "Producto desconocido"}</p>
                        <p className="text-sm text-gray-500">{mov.motivo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">
                        {mov.cantidad > 0 ? "+" : ""}{mov.cantidad} unidades
                      </p>
                      <p className="text-sm text-gray-500">
                        {mov.stock_anterior} → {mov.stock_nuevo}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(mov.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== MODALES ====================

function ModalBarril({ modalBarril, setModalBarril, handleActivarBarril, productos }) {
  const stockKey = "stock_local" + modalBarril.local;
  const barrilActivoKey = "barril_activo_local" + modalBarril.local;
  
  const barrilesDisponibles = productos.filter(
    (p) => p.unidad_medida === "barriles" && p[stockKey] > 0 && !p[barrilActivoKey]
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
        <div className="p-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white">
            Activar Barril - Local {modalBarril.local}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Selecciona el barril que deseas activar
          </p>
        </div>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {barrilesDisponibles.map((barril) => (
            <button
              key={barril.id}
              onClick={() => handleActivarBarril(barril.id, modalBarril.local)}
              className="w-full p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:border-emerald-500 transition text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🍺</span>
                <div className="flex-1">
                  <h3 className="text-white font-bold">{barril.nombre}</h3>
                  <p className="text-xs text-gray-400">
                    {barril.capacidad_barril} vasos por barril
                  </p>
                  <p className="text-xs text-emerald-400">
                    {modalBarril.local === 1
                      ? barril.stock_local1
                      : barril.stock_local2}{" "}
                    en bodega
                  </p>
                </div>
                <span className="text-emerald-500 text-2xl">▶</span>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-[#2a2a2a]">
          <button
            onClick={() => setModalBarril({ open: false, local: null })}
            className="w-full py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalProducto({ setModalOpen, productoEditar, formData, setFormData, categorias, handleSubmit }) {
  return (
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
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
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
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
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
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
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
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
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
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
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
          {(formData.presentacion === "Barril" ||
            categorias
              .find((c) => c.id === formData.categoria_id)
              ?.nombre?.toLowerCase()
              .includes("barril")) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-amber-400 mb-2 font-semibold">
                Configuración de Barril
              </p>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Capacidad (vasos)
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
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
              />
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
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
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
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
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
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="disponible_b2b"
              checked={formData.disponible_b2b}
              onChange={(e) =>
                setFormData({ ...formData, disponible_b2b: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label
              htmlFor="disponible_b2b"
              className="ml-2 text-xs text-gray-300"
            >
              Disponible B2B
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a] text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg text-sm"
            >
              {productoEditar ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para registrar entrada
function ModalEntrada({ producto, onClose, onSubmit }) {
  const [local, setLocal] = useState(1);
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("Compra de inventario");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cantidad || cantidad <= 0) {
      toast.error("Ingresa una cantidad válida");
      return;
    }
    onSubmit(producto.id, local, parseInt(cantidad), motivo);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
        <div className="p-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white">Registrar Entrada</h2>
          <p className="text-sm text-gray-500">{producto.nombre}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Local</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocal(1)}
                className={"py-3 rounded-lg font-medium transition " + (local === 1 ? "bg-[#D4B896] text-[#0a0a0a]" : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]")}
              >
                Local 1 ({producto.stock_local1})
              </button>
              <button
                type="button"
                onClick={() => setLocal(2)}
                className={"py-3 rounded-lg font-medium transition " + (local === 2 ? "bg-[#D4B896] text-[#0a0a0a]" : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]")}
              >
                Local 2 ({producto.stock_local2})
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Cantidad a agregar</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-lg"
              placeholder="0"
              min="1"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Motivo</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
            >
              <option value="Compra de inventario">Compra de inventario</option>
              <option value="Devolución de proveedor">Devolución de proveedor</option>
              <option value="Bonificación">Bonificación</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition"
            >
              Registrar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para ajustar inventario
function ModalAjuste({ producto, onClose, onSubmit }) {
  const [local, setLocal] = useState(1);
  const [cantidadNueva, setCantidadNueva] = useState(producto.stock_local1);
  const [motivo, setMotivo] = useState("");

  const handleLocalChange = (nuevoLocal) => {
    setLocal(nuevoLocal);
    const nuevoStock = nuevoLocal === 1 ? producto.stock_local1 : producto.stock_local2;
    setCantidadNueva(nuevoStock);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cantidadNueva < 0) {
      toast.error("La cantidad no puede ser negativa");
      return;
    }
    if (!motivo.trim()) {
      toast.error("Debes ingresar un motivo");
      return;
    }
    onSubmit(producto.id, local, parseInt(cantidadNueva), motivo);
  };

  const stockActual = local === 1 ? producto.stock_local1 : producto.stock_local2;
  const diferencia = parseInt(cantidadNueva || 0) - stockActual;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
        <div className="p-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white">Ajustar Inventario</h2>
          <p className="text-sm text-gray-500">{producto.nombre}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Local</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLocalChange(1)}
                className={"py-3 rounded-lg font-medium transition " + (local === 1 ? "bg-[#D4B896] text-[#0a0a0a]" : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]")}
              >
                Local 1 ({producto.stock_local1})
              </button>
              <button
                type="button"
                onClick={() => handleLocalChange(2)}
                className={"py-3 rounded-lg font-medium transition " + (local === 2 ? "bg-[#D4B896] text-[#0a0a0a]" : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]")}
              >
                Local 2 ({producto.stock_local2})
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Stock actual: <span className="text-white font-bold">{stockActual}</span>
            </label>
            <input
              type="number"
              value={cantidadNueva}
              onChange={(e) => setCantidadNueva(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-lg"
              min="0"
            />
            {diferencia !== 0 && (
              <p className={"text-sm mt-2 " + (diferencia > 0 ? "text-emerald-400" : "text-red-400")}>
                {diferencia > 0 ? "+" : ""}{diferencia} unidades
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Motivo del ajuste *</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white"
              placeholder="Ej: Conteo físico, pérdida, etc."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition"
            >
              Guardar Ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para ver movimientos
function ModalMovimientos({ producto, movimientos, onClose }) {
  const getTipoColor = (tipo) => {
    switch (tipo) {
      case "entrada": return "bg-emerald-500/20 text-emerald-400";
      case "salida": case "venta": return "bg-red-500/20 text-red-400";
      case "ajuste": return "bg-blue-500/20 text-blue-400";
      case "transferencia_entrada": return "bg-purple-500/20 text-purple-400";
      case "transferencia_salida": return "bg-orange-500/20 text-orange-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case "entrada": return "Entrada";
      case "salida": return "Salida";
      case "venta": return "Venta";
      case "ajuste": return "Ajuste";
      case "transferencia_entrada": return "Trans. Entrada";
      case "transferencia_salida": return "Trans. Salida";
      default: return tipo;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-[#2a2a2a] flex-shrink-0">
          <h2 className="text-lg font-bold text-white">Historial de Movimientos</h2>
          <p className="text-sm text-gray-500">{producto.nombre}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {movimientos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay movimientos registrados</p>
          ) : (
            <div className="space-y-2">
              {movimientos.map((mov) => (
                <div key={mov.id} className="bg-[#1a1a1a] rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={"px-2 py-1 rounded text-xs font-medium " + getTipoColor(mov.tipo)}>
                      {getTipoLabel(mov.tipo)}
                    </span>
                    <div>
                      <p className="text-white text-sm">
                        {mov.cantidad > 0 ? "+" : ""}{mov.cantidad} unidades
                      </p>
                      <p className="text-xs text-gray-500">{mov.motivo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {mov.stock_anterior} → {mov.stock_nuevo}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(mov.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-[#2a2a2a] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1a1a1a] text-gray-300 rounded-lg border border-[#2a2a2a]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}