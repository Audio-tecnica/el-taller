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
      if (productoEditar) {
        await productosService.actualizarProducto(productoEditar.id, formData);
        toast.success("Producto actualizado");
      } else {
        await productosService.crearProducto(formData);
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
      stock_local1: producto.stock_local1,
      stock_local2: producto.stock_local2,
      alerta_stock: producto.alerta_stock,
      disponible_b2b: producto.disponible_b2b,
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

  const handleActivarBarril = async (productoId, local) => {
    if (window.confirm(`¿Activar barril en Local ${local}?`)) {
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
          },
        );

        if (response.ok) {
          toast.success("Barril activado en máquina");
          cargarDatos();
        } else {
          const error = await response.json();
          toast.error(error.error || "Error al activar barril");
        }
      } catch (error) {
        toast.error("Error al activar barril");
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
      stock_local1: 0,
      stock_local2: 0,
      alerta_stock: 10,
      disponible_b2b: false,
    });
  };

  const productosFiltrados = filtroCategoria
    ? productos.filter((p) => p.categoria_id === filtroCategoria)
    : productos;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4B896] text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-4 hover:opacity-80 transition"
            >
              <img
                src={logo}
                alt="El Taller"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h1 className="text-lg font-bold text-[#D4B896] tracking-wide">
                  EL TALLER
                </h1>
                <p className="text-xs text-gray-500">Productos</p>
              </div>
            </button>
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="px-5 py-2.5 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C4A576] transition"
          >
            + Nuevo Producto
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltroCategoria("")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
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
              className={`px-4 py-2 rounded-lg font-medium transition ${
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

      {/* Lista de Productos */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {productosFiltrados.map((producto) => {
            const esBarril = producto.unidad_medida === "barriles";

            return (
              <div
                key={producto.id}
                className={`bg-[#141414] rounded-lg p-3 transition border-2 ${
                  producto.categoria?.nombre?.includes("Barril")
                    ? "border-amber-500"
                    : producto.categoria?.nombre?.includes("Botella")
                      ? "border-green-500"
                      : producto.categoria?.nombre?.includes("Lata")
                        ? "border-blue-500"
                        : producto.categoria?.nombre?.includes("Comida") ||
                            producto.categoria?.nombre?.includes("Piqueo")
                          ? "border-orange-500"
                          : producto.categoria?.nombre?.includes("Bebida")
                            ? "border-purple-500"
                            : "border-gray-700"
                }`}
              >
                <div className="mb-2">
                  <h3 className="text-white font-semibold text-sm truncate">
                    {producto.nombre}
                  </h3>
                  <span className="text-xs text-gray-500 truncate block">
                    {producto.categoria?.icono} {producto.categoria?.nombre}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-[#D4B896] font-bold text-base">
                    ${Number(producto.precio_venta).toLocaleString()}
                  </span>
                  {esBarril && (
                    <span className="text-xs text-gray-500"> / vaso</span>
                  )}
                </div>

                {/* STOCK PARA BARRILES */}
                {esBarril ? (
                  <>
                    {/* Local 1 */}
                    <div className="mb-2">
                      <div className="bg-[#1a1a1a] rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-gray-500">
                            Local 1
                          </span>
                          {producto.barril_activo_local1 ? (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">
                              EN MÁQUINA
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-600">
                              Bodega: {producto.stock_local1}
                            </span>
                          )}
                        </div>

                        {producto.barril_activo_local1 ? (
                          <>
                            {/* Barra de progreso */}
                            <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  producto.vasos_disponibles_local1 <= 15
                                    ? "bg-red-500"
                                    : producto.vasos_disponibles_local1 <= 30
                                      ? "bg-yellow-500"
                                      : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${(producto.vasos_disponibles_local1 / producto.capacidad_barril) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-center">
                              <span
                                className={`font-bold ${
                                  producto.vasos_disponibles_local1 <= 15
                                    ? "text-red-500"
                                    : producto.vasos_disponibles_local1 <= 30
                                      ? "text-yellow-500"
                                      : "text-emerald-500"
                                }`}
                              >
                                {producto.vasos_disponibles_local1}
                              </span>
                              <span className="text-gray-500">
                                /{producto.capacidad_barril} vasos
                              </span>
                            </p>
                            {producto.vasos_disponibles_local1 <= 15 && (
                              <p className="text-[9px] text-red-400 text-center mt-1">
                                ⚠️ Casi vacío
                              </p>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleActivarBarril(producto.id, 1)}
                            disabled={producto.stock_local1 <= 0}
                            className="w-full py-1 text-[10px] bg-emerald-600 text-white rounded hover:bg-emerald-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {producto.stock_local1 > 0
                              ? "▶ Activar"
                              : "Sin stock"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Local 2 */}
                    <div className="mb-2">
                      <div className="bg-[#1a1a1a] rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-gray-500">
                            Local 2
                          </span>
                          {producto.barril_activo_local2 ? (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">
                              EN MÁQUINA
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-600">
                              Bodega: {producto.stock_local2}
                            </span>
                          )}
                        </div>

                        {producto.barril_activo_local2 ? (
                          <>
                            <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  producto.vasos_disponibles_local2 <= 15
                                    ? "bg-red-500"
                                    : producto.vasos_disponibles_local2 <= 30
                                      ? "bg-yellow-500"
                                      : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${(producto.vasos_disponibles_local2 / producto.capacidad_barril) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-center">
                              <span
                                className={`font-bold ${
                                  producto.vasos_disponibles_local2 <= 15
                                    ? "text-red-500"
                                    : producto.vasos_disponibles_local2 <= 30
                                      ? "text-yellow-500"
                                      : "text-emerald-500"
                                }`}
                              >
                                {producto.vasos_disponibles_local2}
                              </span>
                              <span className="text-gray-500">
                                /{producto.capacidad_barril} vasos
                              </span>
                            </p>
                            {producto.vasos_disponibles_local2 <= 15 && (
                              <p className="text-[9px] text-red-400 text-center mt-1">
                                ⚠️ Casi vacío
                              </p>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleActivarBarril(producto.id, 2)}
                            disabled={producto.stock_local2 <= 0}
                            className="w-full py-1 text-[10px] bg-emerald-600 text-white rounded hover:bg-emerald-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {producto.stock_local2 > 0
                              ? "▶ Activar"
                              : "Sin stock"}
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  /* STOCK NORMAL PARA NO-BARRILES */
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-[#1a1a1a] rounded p-2 text-center">
                      <p className="text-gray-500 text-[10px]">Local 1</p>
                      <p
                        className={`font-bold text-sm ${producto.stock_local1 <= producto.alerta_stock ? "text-red-500" : "text-emerald-500"}`}
                      >
                        {producto.stock_local1}
                      </p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded p-2 text-center">
                      <p className="text-gray-500 text-[10px]">Local 2</p>
                      <p
                        className={`font-bold text-sm ${producto.stock_local2 <= producto.alerta_stock ? "text-red-500" : "text-emerald-500"}`}
                      >
                        {producto.stock_local2}
                      </p>
                    </div>
                  </div>
                )}

                {producto.disponible_b2b && (
                  <div className="mb-2">
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                      B2B: ${Number(producto.precio_mayorista).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleEditar(producto)}
                    className="flex-1 py-1.5 text-xs bg-[#1a1a1a] text-gray-300 rounded hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(producto.id)}
                    className="py-1.5 px-3 text-xs bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition"
                  >
                    🗑
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-xl font-bold text-white">
                {productoEditar ? "Editar Producto" : "Nuevo Producto"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) =>
                    setFormData({ ...formData, categoria_id: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icono} {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Precio Venta
                  </label>
                  <input
                    type="number"
                    value={formData.precio_venta}
                    onChange={(e) =>
                      setFormData({ ...formData, precio_venta: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Presentación
                </label>
                <select
                  value={formData.presentacion || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, presentacion: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
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
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
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
                  className="w-5 h-5 text-[#D4B896] bg-[#1a1a1a] border-[#2a2a2a] rounded focus:ring-[#D4B896]"
                />
                <label
                  htmlFor="disponible_b2b"
                  className="ml-3 text-sm text-gray-300"
                >
                  Disponible para venta B2B (mayorista)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#C4A576] transition"
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
