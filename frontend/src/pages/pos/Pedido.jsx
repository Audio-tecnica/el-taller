import { useState, useEffect, useCallback } from "react";
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
  const [mostrarCuentaMovil, setMostrarCuentaMovil] = useState(false);
  const [mostrarModalFactura, setMostrarModalFactura] = useState(false);
  const [pedidoCobrado, setPedidoCobrado] = useState(null);
  const [procesoFacturacionActivo, setProcesoFacturacionActivo] = useState(false);

  // ✅ NUEVO: Función helper para obtener el ID del local activo
  const getLocalActivo = useCallback(() => {
    const localId = pedido?.local?.id || pedido?.local_id || null;
    console.log('🏪 PEDIDO.JSX - Local detectado:', {
      localId,
      pedidoLocalId: pedido?.local?.id,
      pedidoLocalNombre: pedido?.local?.nombre,
      pedidoCompleto: pedido
    });
    return localId;
  }, [pedido]);

  // ✅ NUEVO: Función helper para obtener datos del producto según el local activo
  const getProductoDataPorLocal = useCallback((producto) => {
    const localId = getLocalActivo();
    
    // Si no hay local definido, retornar valores por defecto
    if (!localId) {
      return {
        barrilActivo: null,
        vasosDisponibles: 0,
        stockDisponible: 0
      };
    }

    // ✅ CORREGIDO: Determinar el sufijo según el NOMBRE del local
    // Ya que los IDs son UUIDs, usamos el nombre del local
    const localNombre = pedido?.local?.nombre?.toLowerCase() || '';
    const sufijo = localNombre.includes('castellana') ? '_local1' : '_local2';
    
    console.log('🔍 DEBUG SUFIJO:', {
      localId,
      localNombre: pedido?.local?.nombre,
      sufijoUsado: sufijo
    });
    
    return {
      barrilActivo: producto[`barril_activo${sufijo}`],
      vasosDisponibles: producto[`vasos_disponibles${sufijo}`] || 0,
      stockDisponible: producto[`stock${sufijo}`] || 0
    };
  }, [getLocalActivo, pedido]);

  const cargarDatos = useCallback(async () => {
    try {
      const [productosData, categoriasData] = await Promise.all([
        productosService.getProductos(),
        productosService.getCategorias(),
      ]);
      setProductos(productosData);
      setCategorias(categoriasData);

      // Buscar el pedido actual
      const pedidosAbiertos = await pedidosService.getPedidosAbiertos();
      const pedidoActual = pedidosAbiertos.find((p) => p.id === pedido_id);
      
      if (pedidoActual) {
        setPedido(pedidoActual);
      } else {
        if (!procesoFacturacionActivo) {
          toast.success("Este pedido ya fue cobrado");
          navigate("/pos");
          return;
        }
      }
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [pedido_id, navigate, procesoFacturacionActivo]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (procesoFacturacionActivo) {
      return;
    }

    const interval = setInterval(() => {
      cargarDatos();
    }, 5000);
    return () => clearInterval(interval);
  }, [cargarDatos, procesoFacturacionActivo]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !procesoFacturacionActivo) {
        cargarDatos();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [cargarDatos, procesoFacturacionActivo]);

  useEffect(() => {
    const verificarTurnoActivo = async () => {
      try {
        const { turnosService } = await import("../../services/turnosService");
        const { authService } = await import("../../services/authService");
        
        const usuario = authService.getCurrentUser();
        
        if (usuario?.rol !== 'cajero') return;
        
        try {
          await turnosService.getMiTurnoActivo();
          console.log('✅ Turno activo verificado en Pedido');
        } catch  {
          console.error('❌ TURNO CERRADO - Expulsando del pedido');
          toast.error('Tu turno ha sido cerrado por administración');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error al verificar turno:', error);
      }
    };
    
    const turnoInterval = setInterval(verificarTurnoActivo, 10000);
    verificarTurnoActivo();
    
    return () => clearInterval(turnoInterval);
  }, [navigate]);

  const handleAgregarProducto = async (producto) => {
    console.log('➕ AGREGANDO PRODUCTO:', producto.nombre, 'cantidad: 1');
    try {
      const pedidoActualizado = await pedidosService.agregarItem(
        pedido_id,
        producto.id,
        1
      );
      console.log('✅ Producto agregado, nuevo subtotal:', pedidoActualizado.subtotal);
      setPedido((prev) => ({
        ...prev,
        items: pedidoActualizado.items,
        subtotal: pedidoActualizado.subtotal,
      }));
      toast.success("+1 " + producto.nombre, { duration: 1000 });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        toast.success("Este pedido ya fue cobrado");
        navigate("/pos");
        return;
      }
      toast.error("Error al agregar producto");
    }
  };

  const handleQuitarItem = async (item) => {
    try {
      const pedidoActualizado = await pedidosService.quitarItem(
        pedido_id,
        item.id,
        1
      );
      setPedido((prev) => ({
        ...prev,
        items: pedidoActualizado.items,
        subtotal: pedidoActualizado.subtotal,
      }));
      toast.success("-1 " + item.producto.nombre, { duration: 1000 });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        toast.success("Este pedido ya fue cobrado");
        navigate("/pos");
        return;
      }
      toast.error("Error al quitar producto");
    }
  };

  const handleEliminarItem = async (item) => {
    try {
      const pedidoActualizado = await pedidosService.quitarItem(
        pedido_id,
        item.id
      );
      setPedido((prev) => ({
        ...prev,
        items: pedidoActualizado.items,
        subtotal: pedidoActualizado.subtotal,
      }));
      toast.success("Eliminado: " + item.producto.nombre);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        toast.success("Este pedido ya fue cobrado");
        navigate("/pos");
        return;
      }
      toast.error("Error al eliminar");
    }
  };

  const handleCobrar = async () => {
    try {
      setProcesoFacturacionActivo(true);
      
      await pedidosService.cerrarPedido(
        pedido_id,
        metodoPago,
        montoCortesia,
        razonCortesia
      );
      
      setPedidoCobrado(pedido_id);
      setModalCobrar(false);
      setMostrarModalFactura(true);
      
      toast.success("Pedido cobrado!");
    } catch (err) {
      setProcesoFacturacionActivo(false);
      
      if (err.response && err.response.status === 404) {
        toast.success("Este pedido ya fue cobrado desde otro dispositivo");
        navigate("/pos");
        return;
      }
      toast.error("Error al cobrar");
    }
  };

  const descargarFacturaPDF = () => {
    const token = localStorage.getItem("token");
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const baseUrl = API_BASE.replace(/\/api$/, '');
    const url = `${baseUrl}/api/facturas/pdf/${pedidoCobrado}?token=${token}`;
    
    console.log("Descargando factura desde:", url);
    window.open(url, '_blank');
    toast.success("Factura generada! Revisa la nueva ventana", { duration: 3000 });
  };

  const finalizarSinFactura = () => {
    setProcesoFacturacionActivo(false);
    setMostrarModalFactura(false);
    navigate("/pos");
  };
  
  const finalizarConFactura = () => {
    setProcesoFacturacionActivo(false);
    setMostrarModalFactura(false);
    navigate("/pos");
  };

  const handleCancelar = async () => {
    if (window.confirm("Cancelar este pedido? La mesa quedara libre.")) {
      try {
        await pedidosService.cancelarPedido(pedido_id);
        toast.success("Pedido cancelado");
        navigate("/pos");
      } catch (err) {
        if (err.response && err.response.status === 404) {
          toast.success("Este pedido ya fue procesado");
          navigate("/pos");
          return;
        }
        toast.error("Error al cancelar");
      }
    }
  };

  const productosFiltrados = filtroCategoria
    ? productos.filter((p) => p.categoria_id === filtroCategoria)
    : productos;

  const getCategoriaColor = (categoria) => {
    if (!categoria || !categoria.nombre) return "border-gray-700";
    const nombre = categoria.nombre.toLowerCase();
    if (nombre.includes("barril")) return "border-amber-500";
    if (nombre.includes("botella")) return "border-green-500";
    if (nombre.includes("lata")) return "border-blue-500";
    if (nombre.includes("comida") || nombre.includes("piqueo")) return "border-orange-500";
    if (nombre.includes("bebida")) return "border-purple-500";
    return "border-gray-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#D4B896] text-xl">Cargando...</div>
      </div>
    );
  }

  if (!pedido && !procesoFacturacionActivo) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#D4B896] text-xl mb-4">Pedido no encontrado</p>
          <button
            onClick={() => navigate("/pos")}
            className="px-6 py-3 bg-[#D4B896] text-[#0a0a0a] font-semibold rounded-lg"
          >
            Volver al POS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex relative overflow-hidden">
      {/* Panel izquierdo - Productos */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-[#0a0a0a] border-b border-[#2a2a2a] px-4 py-3 flex-shrink-0">
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
                X Cancelar
              </button>
              <button
                onClick={() => navigate("/pos")}
                className="px-4 py-2 bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#2a2a2a] transition border border-[#2a2a2a]"
              >
                Volver
              </button>
            </div>
          </div>
        </header>

        {/* Categorías */}
        <div className="px-4 py-3 border-b border-[#2a2a2a] overflow-x-auto flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroCategoria("")}
              className={
                "px-4 py-2 rounded-lg font-medium whitespace-nowrap transition " +
                (filtroCategoria === ""
                  ? "bg-[#D4B896] text-[#0a0a0a]"
                  : "bg-[#141414] text-gray-400 border border-[#2a2a2a]")
              }
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFiltroCategoria(cat.id)}
                className={
                  "px-4 py-2 rounded-lg font-medium whitespace-nowrap transition " +
                  (filtroCategoria === cat.id
                    ? "bg-[#D4B896] text-[#0a0a0a]"
                    : "bg-[#141414] text-gray-400 border border-[#2a2a2a]")
                }
              >
                {cat.icono} {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos - con scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {productosFiltrados.map((producto) => {
              // ✅ CORREGIDO: Obtener datos según el local activo
              const { barrilActivo, vasosDisponibles, stockDisponible } = getProductoDataPorLocal(producto);

              return (
                <button
                  key={producto.id}
                  onClick={() => handleAgregarProducto(producto)}
                  className={
                    "bg-[#141414] rounded-lg p-3 text-left hover:bg-[#1a1a1a] transition-all active:scale-95 border-2 " +
                    getCategoriaColor(producto.categoria)
                  }
                >
                  <p className="text-xs font-semibold truncate leading-tight">
                    <span className="text-white">{producto.nombre}</span>
                    {producto.presentacion && (
                      <span className="text-[#D4B896] ml-1">
                        ({producto.presentacion})
                      </span>
                    )}
                  </p>
                  <p className="text-[#D4B896] font-bold text-sm mt-0.5">
                    ${Number(producto.precio_venta).toLocaleString()}
                    {producto.unidad_medida === "barriles" && (
                      <span className="text-[9px] text-gray-500"> /vaso</span>
                    )}
                  </p>

                  {/* ✅ CORREGIDO: Barra de progreso para barriles - usa datos del local activo */}
                  {producto.unidad_medida === "barriles" && barrilActivo && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className={
                            "h-1.5 rounded-full transition-all " +
                            (vasosDisponibles <= 15
                              ? "bg-red-500"
                              : vasosDisponibles <= 30
                                ? "bg-yellow-500"
                                : "bg-emerald-500")
                          }
                          style={{
                            width: ((vasosDisponibles / producto.capacidad_barril) * 100) + "%",
                          }}
                        />
                      </div>
                      <p className="text-[9px] text-gray-500 text-center mt-0.5">
                        {vasosDisponibles}/{producto.capacidad_barril} vasos
                      </p>
                    </div>
                  )}

                  {/* ✅ NUEVO: Mostrar stock para productos que NO son barriles */}
                  {producto.unidad_medida !== "barriles" && (
                    <div className="mt-1">
                      <p className={
                        "text-[10px] font-medium text-center " +
                        (stockDisponible === 0
                          ? "text-red-500"
                          : stockDisponible <= 5
                            ? "text-yellow-500"
                            : "text-emerald-500")
                      }>
                        {stockDisponible === 0 
                          ? "SIN STOCK" 
                          : `Stock: ${stockDisponible} ${producto.unidad_medida || 'unid'}`
                        }
                      </p>
                    </div>
                  )}

                  <p className="text-[9px] text-gray-500 mt-0.5 truncate">
                    {producto.categoria?.icono} {producto.categoria?.nombre}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel derecho - Cuenta */}
      <div
        className={
          "fixed lg:relative lg:w-80 xl:w-96 w-full bottom-0 lg:bottom-auto left-0 lg:left-auto bg-[#141414] border-l border-[#2a2a2a] flex flex-col transition-transform duration-300 z-40 max-h-[80vh] lg:max-h-full lg:h-full " +
          (mostrarCuentaMovil ? "translate-y-0" : "translate-y-full lg:translate-y-0")
        }
      >
        <button
          onClick={() => setMostrarCuentaMovil(false)}
          className="lg:hidden absolute top-2 right-2 w-8 h-8 bg-gray-700 rounded-full text-white flex items-center justify-center"
        >
          X
        </button>

        <div className="p-4 border-b border-[#2a2a2a] flex-shrink-0">
          <h2 className="text-lg font-bold text-white">Cuenta</h2>
          <p className="text-sm text-gray-500">Mesa {pedido?.mesa?.numero}</p>
        </div>

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

        <div className="p-4 border-t border-[#2a2a2a] space-y-4 flex-shrink-0">
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

      {/* Botón flotante para abrir cuenta en móvil */}
      <button
        onClick={() => setMostrarCuentaMovil(true)}
        className="lg:hidden fixed bottom-4 right-4 bg-[#D4B896] text-[#0a0a0a] px-6 py-4 rounded-full shadow-lg font-bold z-30 flex items-center gap-2"
      >
        <span>{pedido?.items?.length || 0}</span>
        <span>-</span>
        <span>${Number(pedido?.subtotal || 0).toLocaleString()}</span>
      </button>

      {/* Modal Cobrar */}
      {modalCobrar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-xl font-bold text-white">Cobrar Pedido</h2>
              <p className="text-gray-500">Mesa {pedido?.mesa?.numero}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-2">
                {(() => {
                  const subtotalConImpuesto = Number(pedido?.subtotal || 0);
                  const baseGravable = subtotalConImpuesto / 1.08;
                  const impoconsumo = subtotalConImpuesto - baseGravable;
                  
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Base gravable</span>
                        <span className="text-gray-300">
                          ${Math.round(baseGravable).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Impoconsumo (8%)</span>
                        <span className="text-gray-300">
                          ${Math.round(impoconsumo).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-[#2a2a2a] pt-2">
                        <span className="text-white font-medium">Subtotal</span>
                        <span className="text-white font-medium">
                          ${subtotalConImpuesto.toLocaleString()}
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
                          ${Math.max(0, subtotalConImpuesto - montoCortesia).toLocaleString()}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <button
                type="button"
                onClick={() => setMostrarCortesia(!mostrarCortesia)}
                className="w-full py-2 text-sm text-[#D4B896] hover:underline"
              >
                {mostrarCortesia ? "X Cancelar cortesia" : "Aplicar cortesia"}
              </button>

              {mostrarCortesia && (
                <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-3 border border-[#D4B896]/30">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Monto de cortesia
                    </label>
                    <input
                      type="number"
                      value={montoCortesia}
                      onChange={(e) =>
                        setMontoCortesia(
                          Math.min(
                            parseFloat(e.target.value) || 0,
                            pedido?.subtotal || 0
                          )
                        )
                      }
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                      placeholder="0"
                      max={pedido?.subtotal || 0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Razon
                    </label>
                    <select
                      value={razonCortesia}
                      onChange={(e) => setRazonCortesia(e.target.value)}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:ring-2 focus:ring-[#D4B896]"
                    >
                      <option value="">Seleccionar razon</option>
                      <option value="cumpleanos">Cumpleanos</option>
                      <option value="cliente_vip">Cliente VIP</option>
                      <option value="promocion">Promocion</option>
                      <option value="disculpa">Disculpa por inconveniente</option>
                      <option value="fidelizacion">Fidelizacion</option>
                      <option value="cortesia_casa">Cortesia de la casa</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMontoCortesia(Math.round((pedido?.subtotal || 0) * 0.1))
                      }
                      className="flex-1 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg text-sm hover:bg-[#3a3a3a]"
                    >
                      10%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMontoCortesia(Math.round((pedido?.subtotal || 0) * 0.2))
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

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Metodo de pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPago("efectivo")}
                    className={
                      "py-3 px-2 rounded-lg text-sm font-medium transition " +
                      (metodoPago === "efectivo"
                        ? "bg-[#D4B896] text-[#0a0a0a]"
                        : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]")
                    }
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago("transferencia")}
                    className={
                      "py-3 px-2 rounded-lg text-sm font-medium transition " +
                      (metodoPago === "transferencia"
                        ? "bg-[#D4B896] text-[#0a0a0a]"
                        : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]")
                    }
                  >
                    Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPago("nequi")}
                    className={
                      "py-3 px-2 rounded-lg text-sm font-medium transition " +
                      (metodoPago === "nequi"
                        ? "bg-[#D4B896] text-[#0a0a0a]"
                        : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]")
                    }
                  >
                    Nequi
                  </button>
                </div>
              </div>

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
                  Cobrar ${Math.max(0, Number(pedido?.subtotal || 0) - montoCortesia).toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Factura */}
      {mostrarModalFactura && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-xl font-bold text-white text-center">¡Pedido Cobrado!</h2>
              <p className="text-gray-400 text-center mt-2">Mesa {pedido?.mesa?.numero}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-xl p-4 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-emerald-400 font-semibold">Pago registrado exitosamente</p>
              </div>

              <div className="bg-[#1a1a1a] rounded-xl p-4 text-center">
                <p className="text-gray-400 text-sm mb-2">¿Desea generar una factura?</p>
                <p className="text-white font-bold text-2xl">
                  ${Math.max(0, Number(pedido?.subtotal || 0) - montoCortesia).toLocaleString()}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    descargarFacturaPDF();
                    finalizarConFactura();
                  }}
                  className="w-full py-4 bg-[#D4B896] text-[#0a0a0a] font-bold rounded-xl hover:bg-[#C4A576] transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  Descargar Factura PDF
                </button>

                <button
                  onClick={finalizarSinFactura}
                  className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition"
                >
                  Finalizar y Volver al POS
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  La factura electrónica estará disponible próximamente
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}