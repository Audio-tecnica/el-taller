import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pedidosService } from "../../services/pedidosService";
import { productosService } from "../../services/productosService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function Pedido() {
  const { pedido_id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [modalCobrar, setModalCobrar] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [montoCortesia, setMontoCortesia] = useState(0);
  const [razonCortesia, setRazonCortesia] = useState("");
  const [mostrarCortesia, setMostrarCortesia] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [pedido_id]);

  const cargarDatos = async () => {
    try {
      const [productosData, categoriasData] = await Promise.all([
        productosService.getProductos(),
        productosService.getCategorias(),
      ]);
      setProductos(productosData);
      setCategorias(categoriasData);

      const pedidosAbiertos = await pedidosService.getPedidosAbiertos();
      const pedidoActual = pedidosAbiertos.find((p) => p.id === pedido_id);
      if (pedidoActual) {
        setPedido(pedidoActual);
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarProducto = async (producto) => {
    try {
      const pedidoActualizado = await pedidosService.agregarItem(
        pedido_id,
        producto.id,
        1,
      );
      setPedido((prev) => ({
        ...prev,
        items: pedidoActualizado.items,
        subtotal: pedidoActualizado.subtotal,
      }));
      toast.success(`+1 ${producto.nombre}`, { duration: 1000 });
    } catch (error) {
      toast.error("Error al agregar producto");
    }
  };

  const handleQuitarItem = async (item) => {
    try {
      const pedidoActualizado = await pedidosService.quitarItem(
        pedido_id,
        item.id,
        1,
      );
      setPedido((prev) => ({
        ...prev,
        items: pedidoActualizado.items,
        subtotal: pedidoActualizado.subtotal,
      }));
      toast.success(`-1 ${item.producto.nombre}`, { duration: 1000 });
    } catch (error) {
      toast.error("Error al quitar producto");
    }
  };

  const handleEliminarItem = async (item) => {
    try {
      const pedidoActualizado = await pedidosService.quitarItem(
        pedido_id,
        item.id,
      );
      setPedido((prev) => ({
        ...prev,
        items: pedidoActualizado.items,
        subtotal: pedidoActualizado.subtotal,
      }));
      toast.success(`Eliminado: ${item.producto.nombre}`);
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleCobrar = async () => {
    try {
      await pedidosService.cerrarPedido(
        pedido_id,
        metodoPago,
        montoCortesia,
        razonCortesia,
      );
      toast.success("¡Pedido cobrado!");
      navigate("/pos");
    } catch (error) {
      toast.error("Error al cobrar");
    }
  };

  const handleCancelar = async () => {
    if (window.confirm("¿Cancelar este pedido? La mesa quedará libre.")) {
      try {
        await pedidosService.cancelarPedido(pedido_id);
        toast.success("Pedido cancelado");
        navigate("/pos");
      } catch (error) {
        toast.error("Error al cancelar");
      }
    }
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
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Panel izquierdo - Productos */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#0a0a0a] border-b border-[#2a2a2a] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/pos")}
                className="flex items-center space-x-3 hover:opacity-80 transition"
              >
                <img
                  src={logo}
                  alt="El Taller"
                  className="w-10 h-10 rounded-full object-contain bg-black"
                />
                <div>
                  <h1 className="text-lg font-bold text-[#D4B896]">
                    Mesa {pedido?.mesa?.numero}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {pedido?.local?.nombre}
                  </p>
                </div>
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancelar}
                className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition border border-red-500/30"
              >
                ✕ Cancelar
              </button>
              <button
                onClick={() => navigate("/pos")}
                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
              >
                ← Volver
              </button>
            </div>
          </div>
        </header>

        {/* Categorías */}
        <div className="px-4 py-3 border-b border-[#2a2a2a] overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroCategoria("")}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                filtroCategoria === ""
                  ? "bg-[#D4B896] text-[#0a0a0a]"
                  : "bg-[#141414] text-gray-400 border border-[#2a2a2a]"
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFiltroCategoria(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  filtroCategoria === cat.id
                    ? "bg-[#D4B896] text-[#0a0a0a]"
                    : "bg-[#141414] text-gray-400 border border-[#2a2a2a]"
                }`}
              >
                {cat.icono} {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {productosFiltrados.map((producto) => (
              <button
                key={producto.id}
                onClick={() => handleAgregarProducto(producto)}
                className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 text-left hover:border-[#D4B896] hover:bg-[#1a1a1a] transition-all active:scale-95"
              >
                <p className="text-white font-medium truncate">
                  {producto.nombre}
                </p>
                <p className="text-[#D4B896] font-bold mt-1">
                  ${Number(producto.precio_venta).toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {producto.categoria?.icono} {producto.categoria?.nombre}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho - Cuenta */}
      <div className="w-80 lg:w-96 bg-[#141414] border-l border-[#2a2a2a] flex flex-col">
        {/* Header cuenta */}
        <div className="p-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white">Cuenta</h2>
          <p className="text-sm text-gray-500">Mesa {pedido?.mesa?.numero}</p>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(!pedido?.items || pedido.items.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500">Sin productos</p>
              <p className="text-xs text-gray-600 mt-1">
                Toca un producto para agregar
              </p>
            </div>
          )}

          {pedido?.items?.map((item) => (
            <div
              key={item.id}
              className="bg-[#1a1a1a] rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {item.producto?.nombre}
                </p>
                <p className="text-sm text-gray-500">
                  ${Number(item.precio_unitario).toLocaleString()} c/u
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => handleQuitarItem(item)}
                  className="w-8 h-8 bg-[#2a2a2a] text-white rounded-lg hover:bg-red-500/20 hover:text-red-500 transition"
                >
                  -
                </button>
                <span className="text-white font-bold w-8 text-center">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => handleAgregarProducto(item.producto)}
                  className="w-8 h-8 bg-[#2a2a2a] text-white rounded-lg hover:bg-emerald-500/20 hover:text-emerald-500 transition"
                >
                  +
                </button>
              </div>
              <div className="text-right ml-3">
                <p className="text-[#D4B896] font-bold">
                  ${Number(item.subtotal).toLocaleString()}
                </p>
                <button
                  onClick={() => handleEliminarItem(item)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total y cobrar */}
        <div className="p-4 border-t border-[#2a2a2a] space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-white font-bold text-xl">
              ${Number(pedido?.subtotal || 0).toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setModalCobrar(true)}
            disabled={!pedido?.items?.length}
            className="w-full py-4 bg-[#D4B896] text-[#0a0a0a] font-bold text-lg rounded-xl hover:bg-[#C4A576] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cobrar ${Number(pedido?.subtotal || 0).toLocaleString()}
          </button>
        </div>
      </div>

      {/* Modal Cobrar */}
      {modalCobrar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-xl font-bold text-white">Cobrar Pedido</h2>
              <p className="text-gray-500">Mesa {pedido?.mesa?.numero}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Resumen */}
              <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-medium">
                    ${Number(pedido?.subtotal || 0).toLocaleString()}
                  </span>
                </div>
                {montoCortesia > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Cortesía</span>
                    <span>-${Number(montoCortesia).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#2a2a2a] pt-2 mt-2">
                  <span className="text-[#D4B896] font-bold">
                    Total a cobrar
                  </span>
                  <span className="text-[#D4B896] font-bold text-xl">
                    $
                    {Math.max(
                      0,
                      Number(pedido?.subtotal || 0) - montoCortesia,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Botón para mostrar/ocultar cortesía */}
              <button
                type="button"
                onClick={() => setMostrarCortesia(!mostrarCortesia)}
                className="w-full py-2 text-sm text-[#D4B896] hover:underline"
              >
                {mostrarCortesia
                  ? "✕ Cancelar cortesía"
                  : "🎁 Aplicar cortesía"}
              </button>

              {/* Campos de cortesía */}
              {mostrarCortesia && (
                <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-3 border border-[#D4B896]/30">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Monto de cortesía
                    </label>
                    <input
                      type="number"
                      value={montoCortesia}
                      onChange={(e) =>
                        setMontoCortesia(
                          Math.min(
                            parseFloat(e.target.value) || 0,
                            pedido?.subtotal || 0,
                          ),
                        )
                      }
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                      placeholder="0"
                      max={pedido?.subtotal || 0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Razón
                    </label>
                    <select
                      value={razonCortesia}
                      onChange={(e) => setRazonCortesia(e.target.value)}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                    >
                      <option value="">Seleccionar razón</option>
                      <option value="cumpleaños">🎂 Cumpleaños</option>
                      <option value="cliente_vip">⭐ Cliente VIP</option>
                      <option value="promocion">🏷️ Promoción</option>
                      <option value="disculpa">
                        🙏 Disculpa por inconveniente
                      </option>
                      <option value="fidelizacion">❤️ Fidelización</option>
                      <option value="cortesia_casa">
                        🏠 Cortesía de la casa
                      </option>
                      <option value="otro">📝 Otro</option>
                    </select>
                  </div>
                  {/* Botones rápidos de cortesía */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMontoCortesia(
                          Math.round((pedido?.subtotal || 0) * 0.1),
                        )
                      }
                      className="flex-1 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg text-sm hover:bg-[#3a3a3a]"
                    >
                      10%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMontoCortesia(
                          Math.round((pedido?.subtotal || 0) * 0.2),
                        )
                      }
                      className="flex-1 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg text-sm hover:bg-[#3a3a3a]"
                    >
                      20%
                    </button>
                    <button
                      type="button"
                      onClick={() => setMontoCortesia(pedido?.subtotal || 0)}
                      className="flex-1 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg text-sm hover:bg-[#3a3a3a]"
                    >
                      100%
                    </button>
                  </div>
                </div>
              )}

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Método de pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "efectivo", label: "💵 Efectivo" },
                    { id: "transferencia", label: "🏦 Transfer" },
                    { id: "nequi", label: "📱 Nequi" },
                  ].map((metodo) => (
                    <button
                      key={metodo.id}
                      type="button"
                      onClick={() => setMetodoPago(metodo.id)}
                      className={`py-3 px-2 rounded-lg text-sm font-medium transition ${
                        metodoPago === metodo.id
                          ? "bg-[#D4B896] text-[#0a0a0a]"
                          : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]"
                      }`}
                    >
                      {metodo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setModalCobrar(false);
                    setMontoCortesia(0);
                    setRazonCortesia("");
                    setMostrarCortesia(false);
                  }}
                  className="flex-1 py-3 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCobrar}
                  className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition"
                >
                  ✓ Cobrar $
                  {Math.max(
                    0,
                    Number(pedido?.subtotal || 0) - montoCortesia,
                  ).toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}