import { useState, useEffect, useCallback } from "react";
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

  const [modalBarril, setModalBarril] = useState({ open: false, local: null });
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

  const cargarDatos = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([
        productosService.getProductos(),
        productosService.getCategorias(),
      ]);
      setProductos(prods);
      setCategorias(cats);
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

  // Refresh cuando vuelves a la pestana
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
    if (window.confirm("Eliminar este producto?")) {
      try {
        await productosService.eliminarProducto(id);
        toast.success("Producto eliminado");
        cargarDatos();
      } catch {
        toast.error("Error al eliminar");
      }
    }
  };

 const _abrirModalBarril = (local) => {
    const stockKey = "stock_local" + local;
    const barrilActivoKey = "barril_activo_local" + local;

    const barriles = productos.filter(
      (p) => p.unidad_medida === "barriles" && p[stockKey] > 0 && !p[barrilActivoKey]
    );

    if (barriles.length === 0) {
      toast.error("No hay barriles disponibles en bodega para Local " + local);
      return;
    }

    setBarrilesDisponibles(barriles);
    setModalBarril({ open: true, local });
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
        toast.success("Barril activado en maquina");
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
    if (window.confirm("Cambiar barril vacio y activar uno nuevo en Local " + local + "?")) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4B896] text-xl">Cargando...</div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
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
              <p className="text-[10px] text-gray-500">Productos</p>
            </div>
          </button>
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

          {productos.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-400 text-lg mb-2">No hay productos</p>
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

      {modalBarril.open && (
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
      )}

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
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) =>
                    setFormData({ ...formData, categoria_id: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white text-sm"
                >
                  <option value="">Sin categoria</option>
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
                  Presentacion
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
                    Configuracion de Barril
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
      )}
    </div>
  );
}