import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { inventarioService } from "../../services/inventarioService";
import toast from "react-hot-toast";
import logo from "../../assets/logo.jpeg";

export default function Inventario() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroStock, setFiltroStock] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [modalAjuste, setModalAjuste] = useState({ open: false, producto: null });
  const [modalEntrada, setModalEntrada] = useState({ open: false, producto: null });
  const [modalMovimientos, setModalMovimientos] = useState({ open: false, producto: null, movimientos: [] });

  const cargarDatos = useCallback(async () => {
    try {
      const inventarioData = await inventarioService.getInventarioConsolidado();
      setProductos(inventarioData.productos);
      setResumen(inventarioData.resumen);
    } catch {
      toast.error("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  const handleAjustar = async (productoId, local, cantidadNueva, motivo) => {
    try {
      await inventarioService.ajustarInventario(productoId, local, cantidadNueva, motivo);
      toast.success("Inventario ajustado");
      setModalAjuste({ open: false, producto: null });
      cargarDatos();
    } catch {
      toast.error("Error al ajustar inventario");
    }
  };

  const handleEntrada = async (productoId, local, cantidad, motivo) => {
    try {
      await inventarioService.registrarEntrada(productoId, local, cantidad, motivo);
      toast.success("Entrada registrada");
      setModalEntrada({ open: false, producto: null });
      cargarDatos();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4B896] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#D4B896] text-lg">Cargando inventario...</p>
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
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              <img src={logo} alt="El Taller" className="w-10 h-10 rounded-xl object-contain bg-black" />
              <div>
                <h1 className="text-xl font-black text-white">Inventario</h1>
                <p className="text-xs text-[#D4B896]">Control de Stock</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
            >
              Volver
            </button>
          </div>
        </div>
      </header>

      {/* Resumen Cards */}
      {resumen && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
        </div>
      )}

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 bg-[#141414] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:border-[#D4B896] transition"
            />
          </div>

          {/* Filtro stock */}
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
      </div>

      {/* Tabla de inventario */}
      <div className="max-w-7xl mx-auto px-4 py-4">
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
      </div>

      {/* Modal Entrada */}
      {modalEntrada.open && (
        <ModalEntrada
          producto={modalEntrada.producto}
          onClose={() => setModalEntrada({ open: false, producto: null })}
          onSubmit={handleEntrada}
        />
      )}

      {/* Modal Ajuste */}
      {modalAjuste.open && (
        <ModalAjuste
          producto={modalAjuste.producto}
          onClose={() => setModalAjuste({ open: false, producto: null })}
          onSubmit={handleAjustar}
        />
      )}

      {/* Modal Movimientos */}
      {modalMovimientos.open && (
        <ModalMovimientos
          producto={modalMovimientos.producto}
          movimientos={modalMovimientos.movimientos}
          onClose={() => setModalMovimientos({ open: false, producto: null, movimientos: [] })}
        />
      )}
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
              <option value="Devolucion de proveedor">Devolucion de proveedor</option>
              <option value="Bonificacion">Bonificacion</option>
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
    // Actualizar la cantidad al stock del nuevo local seleccionado
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