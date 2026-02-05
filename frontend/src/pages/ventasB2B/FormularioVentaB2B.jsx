import { useState, useEffect, useMemo } from "react";
import clientesB2BService from "../../services/clientesB2BService";
import { productosService } from "../../services/productosService";
import ventasB2BService from "../../services/ventasB2BService";
import impuestosService from "../../services/impuestosService";
import SelectorImpuestos from "../../components/SelectorImpuestos";

// ── Badges de presentación ────────────────────────────────────
const getPresentacionBadge = (presentacion) => {
  if (!presentacion) return null;
  const configs = {
    Barril: { bg: "bg-amber-100", text: "text-amber-800", icon: "🛢️" },
    Botella: { bg: "bg-blue-100", text: "text-blue-800", icon: "🍶" },
    Caja: { bg: "bg-purple-100", text: "text-purple-800", icon: "📦" },
    Paquete: { bg: "bg-pink-100", text: "text-pink-800", icon: "📬" },
    Unidad: { bg: "bg-gray-100", text: "text-gray-800", icon: "1️⃣" },
  };
  const c = configs[presentacion] || {
    bg: "bg-gray-100",
    text: "text-gray-700",
    icon: "📦",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${c.bg} ${c.text}`}
    >
      <span>{c.icon}</span>
      <span>{presentacion}</span>
    </span>
  );
};

export default function FormularioVentaB2B({ onClose, onGuardar }) {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [locales, setLocales] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [buscandoProducto, setBuscandoProducto] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  // Estados de carga y error
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [errorClientes, setErrorClientes] = useState(null);
  const [errorProductos, setErrorProductos] = useState(null);

  const [formData, setFormData] = useState({
    cliente_b2b_id: "",
    local_id: "",
    metodo_pago: "Credito",
    notas: "",
    aplicar_descuento_cliente: true,
  });

  const [items, setItems] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Estados para impuestos
  const [impuestosSeleccionados, setImpuestosSeleccionados] = useState([]);
  const [impuestosCliente, setImpuestosCliente] = useState([]);

  useEffect(() => {
    cargarClientes();
    cargarProductos();
    cargarLocales();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoadingClientes(true);
      setErrorClientes(null);
      const response = await clientesB2BService.obtenerClientes({
        estado: "Activo",
        limite: 100,
      });
      setClientes(response.clientes || []);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setErrorClientes("No se pudo conectar al servidor. Intenta recargar.");
    } finally {
      setLoadingClientes(false);
    }
  };

  const cargarProductos = async () => {
    try {
      setLoadingProductos(true);
      setErrorProductos(null);
      const response = await productosService.getProductos();
      const lista = Array.isArray(response) ? response : response.productos || [];
      setProductos(lista.filter((p) => p.disponible_b2b));
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setErrorProductos("No se pudo conectar al servidor. Intenta recargar.");
    } finally {
      setLoadingProductos(false);
    }
  };

  const cargarLocales = async () => {
    try {
      const response = await fetch(
        "https://el-taller.onrender.com/api/mesas/locales",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await response.json();
      setLocales(data);
    } catch (error) {
      console.error("Error al cargar locales:", error);
    }
  };

  // Categorías únicas sacadas de los productos
  const categorias = useMemo(() => {
    const map = {};
    productos.forEach((p) => {
      if (p.categoria && !map[p.categoria.id]) {
        map[p.categoria.id] = p.categoria;
      }
    });
    return Object.values(map);
  }, [productos]);

  // 🔴 FILTRAR PRODUCTOS POR LOCAL SELECCIONADO
  const productosFiltrados = useMemo(() => {
    return productos
      .filter((p) => {
        // Filtrar por búsqueda y categoría
        const matchBuscar =
          !buscandoProducto ||
          p.nombre.toLowerCase().includes(buscandoProducto.toLowerCase()) ||
          (p.presentacion &&
            p.presentacion.toLowerCase().includes(buscandoProducto.toLowerCase())) ||
          (p.categoria?.nombre &&
            p.categoria.nombre.toLowerCase().includes(buscandoProducto.toLowerCase()));
        const matchCategoria = !categoriaFiltro || p.categoria?.id === categoriaFiltro;
        
        // 🔴 FILTRAR POR STOCK DEL LOCAL SELECCIONADO
        let tieneStock = true;
        if (formData.local_id) {
          // Identificar qué local es (local1 o local2)
          const localNombre = locales.find(l => l.id === formData.local_id)?.nombre || '';
          
          if (localNombre.toLowerCase().includes('castellana')) {
            tieneStock = (p.stock_local1 || 0) > 0;
          } else if (localNombre.toLowerCase().includes('avenida') || localNombre.toLowerCase().includes('1ra')) {
            tieneStock = (p.stock_local2 || 0) > 0;
          } else {
            // Si no coincide con ninguno, usar stock total
            tieneStock = ((p.stock_local1 || 0) + (p.stock_local2 || 0)) > 0;
          }
        }
        
        return matchBuscar && matchCategoria && tieneStock;
      })
      .slice(0, 12);
  }, [productos, buscandoProducto, categoriaFiltro, formData.local_id, locales]);

  // Precio a usar para B2B: SIEMPRE precio_barril para barriles
  const getPrecioB2B = (producto) => {
    if (producto.presentacion === "Barril") {
      return parseFloat(producto.precio_barril || 450000);
    }
    return parseFloat(producto.precio_mayorista || producto.precio_venta);
  };

  // 🔴 OBTENER STOCK DEL LOCAL SELECCIONADO
  const getStockLocal = (producto) => {
    if (!formData.local_id) {
      // Si no hay local seleccionado, mostrar stock total
      return (producto.stock_local1 || 0) + (producto.stock_local2 || 0);
    }
    
    const localNombre = locales.find(l => l.id === formData.local_id)?.nombre || '';
    
    if (localNombre.toLowerCase().includes('castellana')) {
      return producto.stock_local1 || 0;
    } else if (localNombre.toLowerCase().includes('avenida') || localNombre.toLowerCase().includes('1ra')) {
      return producto.stock_local2 || 0;
    }
    
    // Fallback al stock total
    return (producto.stock_local1 || 0) + (producto.stock_local2 || 0);
  };

  const handleClienteChange = async (e) => {
    const clienteId = e.target.value;
    setFormData({ ...formData, cliente_b2b_id: clienteId });
    if (clienteId) {
      try {
        const cliente = await clientesB2BService.obtenerClientePorId(clienteId);
        setClienteSeleccionado(cliente);
        
        // Cargar impuestos predeterminados del cliente
        try {
          const impuestosDelCliente = await impuestosService.obtenerImpuestosCliente(clienteId);
          setImpuestosCliente(impuestosDelCliente);
          // Preseleccionar los impuestos del cliente
          const idsImpuestos = impuestosDelCliente.map(ic => ic.impuesto_id);
          setImpuestosSeleccionados(idsImpuestos);
        } catch (err) {
          console.log("Cliente sin impuestos predeterminados");
          setImpuestosCliente([]);
          setImpuestosSeleccionados([]);
        }
      } catch (error) {
        console.error("Error al cargar cliente:", error);
      }
    } else {
      setClienteSeleccionado(null);
      setImpuestosCliente([]);
      setImpuestosSeleccionados([]);
    }
  };

  const handleAgregarProducto = (producto) => {
    const stock = getStockLocal(producto);
    const itemExistente = items.find((item) => item.producto_id === producto.id);
    const cantActual = itemExistente ? itemExistente.cantidad : 0;

    if (stock > 0 && cantActual >= stock) {
      alert(`Stock máximo alcanzado para ${producto.nombre} (${stock} unidades en este local)`);
      return;
    }

    if (itemExistente) {
      setItems(
        items.map((item) =>
          item.producto_id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setItems([
        ...items,
        {
          producto_id: producto.id,
          nombre_producto: producto.nombre,
          presentacion: producto.presentacion,
          precio_unitario: getPrecioB2B(producto),
          cantidad: 1,
          descuento_porcentaje: 0,
          stock: stock,
        },
      ]);
    }
  };

  const handleCantidadChange = (productoId, nuevaCantidad) => {
    const cantidad = parseInt(nuevaCantidad) || 0;

    if (cantidad <= 0) {
      handleEliminarItem(productoId);
      return;
    }

    const item = items.find((i) => i.producto_id === productoId);
    if (item && item.stock > 0 && cantidad > item.stock) {
      alert(`Stock máximo: ${item.stock} unidades`);
      return;
    }

    setItems(
      items.map((item) =>
        item.producto_id === productoId ? { ...item, cantidad } : item
      )
    );
  };

  const handlePrecioChange = (productoId, nuevoPrecio) => {
    const precio = parseFloat(nuevoPrecio) || 0;
    setItems(
      items.map((item) =>
        item.producto_id === productoId ? { ...item, precio_unitario: precio } : item
      )
    );
  };

  const handleDescuentoChange = (productoId, nuevoDescuento) => {
    const descuento = parseFloat(nuevoDescuento) || 0;
    if (descuento < 0 || descuento > 100) return;

    setItems(
      items.map((item) =>
        item.producto_id === productoId
          ? { ...item, descuento_porcentaje: descuento }
          : item
      )
    );
  };

  const handleEliminarItem = (productoId) => {
    setItems(items.filter((item) => item.producto_id !== productoId));
  };

  // 🔴 CALCULAR TOTALES - CON SISTEMA DE IMPUESTOS FLEXIBLE
  const calcularTotales = () => {
    let subtotal = 0;
    let descuentoTotal = 0;

    items.forEach((item) => {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      const descuentoPorcentaje =
        item.descuento_porcentaje ||
        (formData.aplicar_descuento_cliente &&
        clienteSeleccionado?.descuento_porcentaje
          ? clienteSeleccionado.descuento_porcentaje
          : 0);
      subtotal += itemSubtotal;
      descuentoTotal += (itemSubtotal * descuentoPorcentaje) / 100;
    });

    // Base para calcular impuestos (subtotal - descuentos)
    const baseParaImpuestos = subtotal - descuentoTotal;
    
    // Si NO hay impuestos seleccionados, mostrar IVA informativo (compatibilidad)
    if (impuestosSeleccionados.length === 0) {
      const IVA_PORCENTAJE = 19;
      const baseImponible = baseParaImpuestos / (1 + IVA_PORCENTAJE / 100);
      const ivaMonto = baseParaImpuestos - baseImponible;

      return {
        subtotal,
        descuentoTotal,
        baseImponible,
        ivaPorcentaje: IVA_PORCENTAJE,
        ivaMonto,
        total: baseParaImpuestos,
        totalImpuestos: 0,
        totalRetenciones: 0,
        detalleImpuestos: [],
        usandoImpuestosFlexibles: false
      };
    }

    // NUEVO: Calcular con impuestos flexibles usando el servicio
    // Necesitamos obtener la info de los impuestos seleccionados
    // Por ahora hacemos el cálculo básico aquí
    let totalImpuestos = 0;
    let totalRetenciones = 0;
    const detalleImpuestos = [];

    // Nota: El cálculo real se hace con impuestosCliente que tiene la info completa
    impuestosCliente.forEach(impCliente => {
      if (impuestosSeleccionados.includes(impCliente.impuesto_id)) {
        const porcentaje = parseFloat(impCliente.porcentaje || impCliente.porcentaje_original);
        const monto = (baseParaImpuestos * porcentaje) / 100;
        
        if (impCliente.tipo === 'Impuesto') {
          totalImpuestos += monto;
        } else {
          totalRetenciones += monto;
        }

        detalleImpuestos.push({
          id: impCliente.impuesto_id,
          codigo: impCliente.codigo,
          nombre: impCliente.nombre,
          tipo: impCliente.tipo,
          porcentaje: porcentaje,
          base: baseParaImpuestos,
          monto: monto
        });
      }
    });

    const total = baseParaImpuestos + totalImpuestos - totalRetenciones;

    return {
      subtotal,
      descuentoTotal,
      baseImponible: baseParaImpuestos,
      ivaPorcentaje: 0,
      ivaMonto: 0,
      total,
      totalImpuestos,
      totalRetenciones,
      detalleImpuestos,
      usandoImpuestosFlexibles: true
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cliente_b2b_id) {
      alert("Por favor seleccione un cliente");
      return;
    }

    if (!formData.local_id) {
      alert("Por favor seleccione un local");
      return;
    }

    if (items.length === 0) {
      alert("Por favor agregue al menos un producto");
      return;
    }

    // 🔴 VALIDAR CRÉDITO DISPONIBLE EN EL FRONTEND
    if (formData.metodo_pago === "Credito" && clienteSeleccionado) {
      const creditoDisponible = parseFloat(clienteSeleccionado.credito_disponible || 0);
      if (total > creditoDisponible) {
        const confirmar = window.confirm(
          `⚠️ CRÉDITO INSUFICIENTE\n\n` +
          `Total de la factura: ${formatearMoneda(total)}\n` +
          `Crédito disponible: ${formatearMoneda(creditoDisponible)}\n` +
          `Faltante: ${formatearMoneda(total - creditoDisponible)}\n\n` +
          `¿Desea cambiar a método de pago EFECTIVO para continuar?`
        );
        
        if (confirmar) {
          setFormData({ ...formData, metodo_pago: "Efectivo" });
          alert("⚠️ Por favor envíe nuevamente. El método de pago se cambió a EFECTIVO.");
          return;
        } else {
          return;
        }
      }
    }

    try {
      setGuardando(true);

      const ventaData = {
        cliente_b2b_id: formData.cliente_b2b_id,
        local_id: formData.local_id,
        metodo_pago: formData.metodo_pago,
        notas: formData.notas,
        aplicar_descuento_cliente: formData.aplicar_descuento_cliente,
        items: items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_porcentaje: item.descuento_porcentaje,
        })),
        // Incluir impuestos seleccionados
        impuestos_ids: impuestosSeleccionados,
      };

      console.log("📤 Enviando venta:", ventaData);
      console.log("💳 Método de pago:", formData.metodo_pago);
      console.log("💰 Total:", formatearMoneda(total));
      if (clienteSeleccionado) {
        console.log("💳 Crédito disponible cliente:", formatearMoneda(clienteSeleccionado.credito_disponible));
      }

      await ventasB2BService.crearVenta(ventaData);

      alert("✅ Factura creada exitosamente");
      onGuardar();
      onClose();
    } catch (error) {
      console.error("❌ Error al crear venta:", error);
      console.error("📋 Respuesta del servidor:", error.response?.data);
      
      let mensajeError = error.response?.data?.error || error.message;
      
      // Agregar contexto adicional al error
      if (mensajeError.includes("Crédito insuficiente") || mensajeError.includes("crédito")) {
        mensajeError = `${mensajeError}\n\n` +
          `💡 Sugerencia: Cambie el método de pago a "Efectivo" si la venta no es a crédito.\n\n` +
          `Método actual: ${formData.metodo_pago}\n` +
          `Total factura: ${formatearMoneda(total)}\n` +
          `Crédito disponible: ${formatearMoneda(clienteSeleccionado?.credito_disponible || 0)}`;
      }
      
      alert(`Error al crear factura: ${mensajeError}`);
    } finally {
      setGuardando(false);
    }
  };

  const { 
    subtotal, 
    descuentoTotal, 
    baseImponible, 
    ivaPorcentaje, 
    ivaMonto, 
    total,
    totalImpuestos,
    totalRetenciones,
    detalleImpuestos,
    usandoImpuestosFlexibles 
  } = calcularTotales();

  const formatearMoneda = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor || 0);

  // Componente reutilizable: estado carga/error
  const renderEstadoCarga = (loading, error, onReintentar, texto) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center gap-2 py-6">
          <div className="w-5 h-5 border-2 border-[#D4B896] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">
            {texto || "Conectando con el servidor..."}
          </span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center gap-2 py-5 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-600 font-medium">⚠️ {error}</span>
          <button
            type="button"
            onClick={onReintentar}
            className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md transition font-medium"
          >
            🔄 Reintentar
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-xl">
          <div className="flex items-center gap-3">
            <svg
              className="w-7 h-7 text-[#D4B896]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 4a2 2 0 00-2 2v1h12V6a2 2 0 00-2-2H4zM2 9v5a2 2 0 002 2h8a2 2 0 002-2V9H2zm7 2a1 1 0 100 2 1 1 0 000-2z" />
            </svg>
            <h2 className="text-xl font-bold">Nueva Factura B2B</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-2xl font-bold transition"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ── Cliente + Local + Método ────────────────────────────────── */}
          <section>
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#D4B896] text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              Cliente y Local
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Cliente <span className="text-red-500">*</span>
                </label>

                {loadingClientes || errorClientes ? (
                  renderEstadoCarga(
                    loadingClientes,
                    errorClientes,
                    cargarClientes,
                    "Cargando clientes..."
                  )
                ) : (
                  <select
                    value={formData.cliente_b2b_id}
                    onChange={handleClienteChange}
                    required
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent bg-white transition"
                  >
                    <option value="">Seleccione un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.razon_social} — {cliente.numero_documento}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Local */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Local <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.local_id}
                  onChange={(e) => {
                    setFormData({ ...formData, local_id: e.target.value });
                    // Limpiar carrito al cambiar de local
                    setItems([]);
                  }}
                  required
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent transition text-gray-900 font-medium"
                >
                  <option value="">Seleccionar local</option>
                  {locales.map((local) => (
                    <option key={local.id} value={local.id}>
                      {local.nombre}
                    </option>
                  ))}
                </select>
                {formData.local_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    ℹ️ Solo se muestran productos con stock en este local
                  </p>
                )}
              </div>

              {/* Método de Pago - CORREGIDO */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Método de Pago <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.metodo_pago}
                  onChange={(e) =>
                    setFormData({ ...formData, metodo_pago: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent bg-white transition"
                >
                  <option value="Credito">💳 Crédito</option>
                  <option value="Efectivo">💵 Efectivo</option>
                </select>
                
                {/* Advertencia de crédito insuficiente */}
                {formData.metodo_pago === "Credito" && 
                 clienteSeleccionado && 
                 total > parseFloat(clienteSeleccionado.credito_disponible || 0) && 
                 items.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-300 rounded-lg">
                    <p className="text-xs text-red-700 font-bold flex items-center gap-1">
                      ⚠️ CRÉDITO INSUFICIENTE
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Total: {formatearMoneda(total)} | 
                      Disponible: {formatearMoneda(clienteSeleccionado.credito_disponible)}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      💡 Cambie a "Efectivo" para continuar
                    </p>
                  </div>
                )}
                
                {/* Confirmación de método efectivo */}
                {formData.metodo_pago === "Efectivo" && items.length > 0 && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-300 rounded-lg">
                    <p className="text-xs text-green-700 font-semibold">
                      ✅ Venta en efectivo - No requiere crédito
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Info cliente */}
            {clienteSeleccionado && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Límite Crédito</div>
                    <div className="font-bold text-gray-800">
                      {formatearMoneda(clienteSeleccionado.limite_credito)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Disponible</div>
                    <div className="font-bold text-green-600">
                      {formatearMoneda(clienteSeleccionado.credito_disponible)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Días Crédito</div>
                    <div className="font-bold text-gray-800">
                      {clienteSeleccionado.dias_credito} días
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Descuento</div>
                    <div className="font-bold text-amber-600">
                      {clienteSeleccionado.descuento_porcentaje}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Productos ─────────────────────────────────────────── */}
          <section>
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#D4B896] text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              Productos
            </h3>

            {!formData.local_id ? (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <p className="text-amber-700 font-medium">
                  ⚠️ Primero selecciona un local para ver los productos disponibles
                </p>
              </div>
            ) : loadingProductos || errorProductos ? (
              renderEstadoCarga(
                loadingProductos,
                errorProductos,
                cargarProductos,
                "Cargando productos..."
              )
            ) : (
              <>
                {/* Buscador + filtro categoría */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
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
                    </div>
                    <input
                      type="text"
                      value={buscandoProducto}
                      onChange={(e) => setBuscandoProducto(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent transition"
                    />
                  </div>

                  {categorias.length > 0 && (
                    <select
                      value={categoriaFiltro}
                      onChange={(e) => setCategoriaFiltro(e.target.value)}
                      className="px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent bg-white transition min-w-[180px]"
                    >
                      <option value="">📦 Todas las categorías</option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icono || "📦"} {cat.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Grid de productos */}
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 max-h-72 overflow-y-auto">
                    {productosFiltrados.length === 0 ? (
                      <div className="col-span-3 bg-white py-8 text-center text-gray-400">
                        {productos.length === 0
                          ? "No hay productos habilitados para B2B."
                          : "No hay productos con stock en este local"}
                      </div>
                    ) : (
                      productosFiltrados.map((producto) => {
                        const precioB2B = getPrecioB2B(producto);
                        const stock = getStockLocal(producto);
                        const enCarrito = items.find(
                          (i) => i.producto_id === producto.id
                        );
                        const esBarril = producto.presentacion === "Barril";

                        return (
                          <div
                            key={producto.id}
                            onClick={() => handleAgregarProducto(producto)}
                            className="bg-white p-4 hover:bg-gray-50 transition-all cursor-pointer border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-sm mb-1">
                                  {producto.nombre}
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getPresentacionBadge(producto.presentacion)}
                                  {esBarril && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                      🛢️ Barril Completo
                                    </span>
                                  )}
                                </div>
                              </div>
                              {enCarrito && (
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold ml-2">
                                  {enCarrito.cantidad}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div>
                                <p className="text-xl font-black text-gray-900">
                                  {formatearMoneda(precioB2B)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {esBarril ? "Por barril" : "Por unidad"}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-emerald-600">
                                  {stock} disponibles
                                </p>
                                {esBarril && stock > 0 && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    (~{stock * 85} vasos)
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Tabla de items en carrito */}
                {items.length > 0 && (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <span className="text-sm font-bold text-gray-700">
                        🛒 Carrito ({items.length} producto
                        {items.length > 1 ? "s" : ""})
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase">
                              Producto
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase">
                              Precio Unit.
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase">
                              Cantidad
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase">
                              Desc %
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-600 uppercase">
                              Total
                            </th>
                            <th className="px-4 py-2.5 text-center text-xs font-bold text-gray-600 uppercase w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {items.map((item) => {
                            const itemSubtotal = item.cantidad * item.precio_unitario;
                            const desc =
                              item.descuento_porcentaje ||
                              (formData.aplicar_descuento_cliente &&
                              clienteSeleccionado?.descuento_porcentaje
                                ? clienteSeleccionado.descuento_porcentaje
                                : 0);
                            const itemTotal = itemSubtotal - (itemSubtotal * desc) / 100;
                            const esBarril = item.presentacion === "Barril";

                            return (
                              <tr key={item.producto_id} className="bg-white hover:bg-gray-50">
                                <td className="px-4 py-2.5">
                                  <div className="text-sm font-semibold text-gray-800">
                                    {item.nombre_producto}
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {getPresentacionBadge(item.presentacion)}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="number"
                                    value={item.precio_unitario}
                                    onChange={(e) =>
                                      handlePrecioChange(item.producto_id, e.target.value)
                                    }
                                    min="0"
                                    step="1"
                                    className="w-32 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 font-bold bg-white focus:ring-2 focus:ring-[#D4B896] focus:border-[#D4B896] transition"
                                  />
                                  {esBarril && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Por barril completo
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCantidadChange(
                                          item.producto_id,
                                          item.cantidad - 1
                                        )
                                      }
                                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-lg transition"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="number"
                                      value={item.cantidad}
                                      onChange={(e) =>
                                        handleCantidadChange(
                                          item.producto_id,
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      min="1"
                                      max={item.stock}
                                      className="w-20 px-2 py-2 border-2 border-gray-300 rounded-lg text-center text-sm text-gray-900 font-bold bg-white focus:ring-2 focus:ring-[#D4B896] focus:border-[#D4B896] transition"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCantidadChange(
                                          item.producto_id,
                                          item.cantidad + 1
                                        )
                                      }
                                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-lg transition"
                                    >
                                      +
                                    </button>
                                  </div>
                                  {esBarril && (
                                    <div className="text-xs text-gray-500 mt-1 text-center">
                                      ~{item.cantidad * 85} vasos
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="number"
                                    value={item.descuento_porcentaje}
                                    onChange={(e) =>
                                      handleDescuentoChange(
                                        item.producto_id,
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 font-bold bg-white focus:ring-2 focus:ring-[#D4B896] focus:border-[#D4B896] transition"
                                  />
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="text-sm font-bold text-gray-800">
                                    {formatearMoneda(itemTotal)}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarItem(item.producto_id)}
                                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 flex items-center justify-center transition font-bold"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Checkbox descuento cliente */}
                {clienteSeleccionado?.descuento_porcentaje > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.aplicar_descuento_cliente}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aplicar_descuento_cliente: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-[#D4B896]"
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        Aplicar descuento del cliente{" "}
                        <span className="text-amber-700 font-bold">
                          ({clienteSeleccionado.descuento_porcentaje}%)
                        </span>
                      </span>
                    </label>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ── Selector de Impuestos ──────────────────────────────────────────── */}
          {clienteSeleccionado && (
            <section className="bg-white border-2 border-gray-200 rounded-xl p-5">
              <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#D4B896] text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                Impuestos y Retenciones
              </h3>
              <SelectorImpuestos
                impuestosSeleccionados={impuestosSeleccionados}
                onImpuestosChange={setImpuestosSeleccionados}
                impuestosCliente={impuestosCliente}
                subtotal={subtotal - descuentoTotal}
                disabled={guardando}
              />
            </section>
          )}

          {/* ── Resumen con IVA INFORMATIVO ──────────────────────────────────────────── */}
          <section className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#D4B896] text-gray-900 rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              Resumen de Factura
            </h3>
            <div className="flex justify-end">
              <div className="w-80 space-y-2.5">
                {/* Subtotal */}
                <div className="flex justify-between text-gray-600">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-semibold text-gray-800">
                    {formatearMoneda(subtotal)}
                  </span>
                </div>

                {/* Descuento */}
                {descuentoTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">Descuento</span>
                    <span className="font-semibold text-orange-600">
                      −{formatearMoneda(descuentoTotal)}
                    </span>
                  </div>
                )}

                {/* Impuestos flexibles (si hay seleccionados) */}
                {usandoImpuestosFlexibles && detalleImpuestos.length > 0 && (
                  <div className="space-y-1 py-2 border-t border-gray-200">
                    {detalleImpuestos.map((imp, idx) => (
                      <div 
                        key={idx}
                        className={`flex justify-between text-sm ${
                          imp.tipo === 'Retencion' ? 'text-orange-600' : 'text-blue-600'
                        }`}
                      >
                        <span>{imp.nombre}</span>
                        <span className="font-medium">
                          {imp.tipo === 'Retencion' ? '−' : '+'} {formatearMoneda(imp.monto)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total a Pagar */}
                <div className="border-t-2 border-gray-400 pt-3 flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">
                    {usandoImpuestosFlexibles ? 'Neto a Pagar' : 'Total a Pagar'}
                  </span>
                  <span className="text-2xl font-bold text-emerald-700">
                    {formatearMoneda(total)}
                  </span>
                </div>

                {/* IVA INFORMATIVO (solo si NO hay impuestos flexibles) */}
                {!usandoImpuestosFlexibles && (
                  <div className="pt-2 border-t border-gray-200 bg-blue-50 -mx-4 px-4 py-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-semibold mb-2">
                      ℹ️ Información Tributaria (Incluida en el total)
                    </p>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Base Gravable:</span>
                      <span className="font-semibold">{formatearMoneda(baseImponible)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>IVA ({ivaPorcentaje}%):</span>
                      <span className="font-semibold">{formatearMoneda(ivaMonto)}</span>
                    </div>
                  </div>
                )}

                {/* Información adicional */}
                <div className="pt-2 text-xs text-gray-500 border-t border-gray-200">
                  <p className="flex justify-between">
                    <span>Items en carrito:</span>
                    <span className="font-semibold text-gray-700">
                      {items.length}
                    </span>
                  </p>
                  <p className="flex justify-between mt-1">
                    <span>Unidades totales:</span>
                    <span className="font-semibold text-gray-700">
                      {items.reduce((sum, item) => sum + item.cantidad, 0)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Notas ────────────────────────────────────────────── */}
          <section>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Notas / Observaciones
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows="2"
              placeholder="Información adicional..."
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent resize-none transition"
            />
          </section>

          {/* ── Botones ──────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                guardando || 
                items.length === 0 || 
                (formData.metodo_pago === "Credito" && 
                 clienteSeleccionado && 
                 total > parseFloat(clienteSeleccionado.credito_disponible || 0))
              }
              className="px-6 py-2.5 bg-gradient-to-r from-[#D4B896] to-[#c4a886] text-gray-900 font-bold rounded-lg hover:shadow-md transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {guardando ? "Guardando..." : "📄 Crear Factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}