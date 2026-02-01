import { useState, useEffect } from 'react';
import clientesB2BService from '../../services/clientesB2BService';
import { productosService } from '../../services/productosService';
import ventasB2BService from '../../services/ventasB2BService';
import { authService } from '../../services/authService';

export default function FormularioVentaB2B({ onClose, onGuardar }) {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [buscandoProducto, setBuscandoProducto] = useState('');

  const [formData, setFormData] = useState({
    cliente_b2b_id: '',
    metodo_pago: 'Credito',
    notas: '',
    aplicar_descuento_cliente: true
  });

  const [items, setItems] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  useEffect(() => {
    cargarClientes();
    cargarProductos();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await clientesB2BService.obtenerClientes({ 
        estado: 'Activo',
        limite: 100 
      });
      setClientes(response.clientes || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await productosService.obtenerProductos({ limite: 1000 });
      setProductos(response.productos || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const handleClienteChange = async (e) => {
    const clienteId = e.target.value;
    setFormData({ ...formData, cliente_b2b_id: clienteId });

    if (clienteId) {
      try {
        const cliente = await clientesB2BService.obtenerClientePorId(clienteId);
        setClienteSeleccionado(cliente);
      } catch (error) {
        console.error('Error al cargar cliente:', error);
      }
    } else {
      setClienteSeleccionado(null);
    }
  };

  const handleAgregarProducto = (producto) => {
    const itemExistente = items.find(item => item.producto_id === producto.id);
    
    if (itemExistente) {
      setItems(items.map(item =>
        item.producto_id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setItems([...items, {
        producto_id: producto.id,
        nombre_producto: producto.nombre,
        precio_unitario: producto.precio,
        cantidad: 1,
        descuento_porcentaje: 0
      }]);
    }
    setBuscandoProducto('');
  };

  const handleCantidadChange = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      handleEliminarItem(productoId);
      return;
    }
    setItems(items.map(item =>
      item.producto_id === productoId
        ? { ...item, cantidad: parseInt(nuevaCantidad) }
        : item
    ));
  };

  const handlePrecioChange = (productoId, nuevoPrecio) => {
    setItems(items.map(item =>
      item.producto_id === productoId
        ? { ...item, precio_unitario: parseFloat(nuevoPrecio) }
        : item
    ));
  };

  const handleDescuentoChange = (productoId, nuevoDescuento) => {
    setItems(items.map(item =>
      item.producto_id === productoId
        ? { ...item, descuento_porcentaje: parseFloat(nuevoDescuento) }
        : item
    ));
  };

  const handleEliminarItem = (productoId) => {
    setItems(items.filter(item => item.producto_id !== productoId));
  };

  const calcularTotales = () => {
    let subtotal = 0;
    let descuentoTotal = 0;

    items.forEach(item => {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      const descuentoPorcentaje = item.descuento_porcentaje || 
        (formData.aplicar_descuento_cliente && clienteSeleccionado?.descuento_porcentaje 
          ? clienteSeleccionado.descuento_porcentaje 
          : 0);
      const itemDescuento = itemSubtotal * (descuentoPorcentaje / 100);
      
      subtotal += itemSubtotal;
      descuentoTotal += itemDescuento;
    });

    const total = subtotal - descuentoTotal;

    return { subtotal, descuentoTotal, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cliente_b2b_id) {
      alert('Por favor seleccione un cliente');
      return;
    }

    if (items.length === 0) {
      alert('Por favor agregue al menos un producto');
      return;
    }

    try {
      setGuardando(true);
      
      const user = authService.getCurrentUser();
      
      const ventaData = {
        cliente_b2b_id: formData.cliente_b2b_id,
        local_id: user?.local_asignado_id || null,
        metodo_pago: formData.metodo_pago,
        notas: formData.notas,
        aplicar_descuento_cliente: formData.aplicar_descuento_cliente,
        items: items.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_porcentaje: item.descuento_porcentaje
        }))
      };

      await ventasB2BService.crearVenta(ventaData);
      onGuardar();
      onClose();
    } catch (error) {
      console.error('Error al crear venta:', error);
      alert(error.response?.data?.error || 'Error al crear la factura');
    } finally {
      setGuardando(false);
    }
  };

  const { subtotal, descuentoTotal, total } = calcularTotales();

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(buscandoProducto.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(buscandoProducto.toLowerCase())
  ).slice(0, 10);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-800">Nueva Factura B2B</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selección de Cliente */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <select
                  value={formData.cliente_b2b_id}
                  onChange={handleClienteChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Seleccione un cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.razon_social} - {cliente.numero_documento}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pago *
                </label>
                <select
                  value={formData.metodo_pago}
                  onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="Credito">Crédito</option>
                  <option value="Contado">Contado</option>
                </select>
              </div>
            </div>

            {/* Info del Cliente */}
            {clienteSeleccionado && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Límite de Crédito:</span>
                    <div className="font-semibold text-gray-900">
                      {formatearMoneda(clienteSeleccionado.limite_credito)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Crédito Disponible:</span>
                    <div className="font-semibold text-green-600">
                      {formatearMoneda(clienteSeleccionado.credito_disponible)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Días de Crédito:</span>
                    <div className="font-semibold text-gray-900">
                      {clienteSeleccionado.dias_credito} días
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Descuento:</span>
                    <div className="font-semibold text-gray-900">
                      {clienteSeleccionado.descuento_porcentaje}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Productos */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos</h3>
            
            {/* Buscador de Productos */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar Producto
              </label>
              <input
                type="text"
                value={buscandoProducto}
                onChange={(e) => setBuscandoProducto(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white"
              />
              
              {/* Lista de productos filtrados */}
              {buscandoProducto && productosFiltrados.length > 0 && (
                <div className="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto bg-white">
                  {productosFiltrados.map(producto => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => handleAgregarProducto(producto)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{producto.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {producto.codigo} - {formatearMoneda(producto.precio)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabla de Items */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Desc %
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No hay productos agregados
                      </td>
                    </tr>
                  ) : (
                    items.map(item => {
                      const itemSubtotal = item.cantidad * item.precio_unitario;
                      const descuento = item.descuento_porcentaje || 
                        (formData.aplicar_descuento_cliente && clienteSeleccionado?.descuento_porcentaje 
                          ? clienteSeleccionado.descuento_porcentaje 
                          : 0);
                      const itemTotal = itemSubtotal - (itemSubtotal * descuento / 100);

                      return (
                        <tr key={item.producto_id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.nombre_producto}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.precio_unitario}
                              onChange={(e) => handlePrecioChange(item.producto_id, e.target.value)}
                              min="0"
                              step="100"
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.cantidad}
                              onChange={(e) => handleCantidadChange(item.producto_id, e.target.value)}
                              min="1"
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.descuento_porcentaje}
                              onChange={(e) => handleDescuentoChange(item.producto_id, e.target.value)}
                              min="0"
                              max="100"
                              step="0.5"
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {formatearMoneda(itemTotal)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleEliminarItem(item.producto_id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Checkbox Descuento */}
            {clienteSeleccionado?.descuento_porcentaje > 0 && (
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.aplicar_descuento_cliente}
                    onChange={(e) => setFormData({ ...formData, aplicar_descuento_cliente: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Aplicar descuento del cliente ({clienteSeleccionado.descuento_porcentaje}%)
                  </span>
                </label>
              </div>
            )}
          </section>

          {/* Totales */}
          <section className="border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatearMoneda(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Descuento:</span>
                  <span className="font-semibold text-orange-600">
                    -{formatearMoneda(descuentoTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-300 pt-2">
                  <span>Total:</span>
                  <span>{formatearMoneda(total)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Notas */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas / Observaciones
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows="3"
              placeholder="Notas adicionales..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4B896] focus:border-transparent text-gray-900 bg-white resize-none"
            />
          </section>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || items.length === 0}
              className="px-6 py-2 bg-[#D4B896] text-black font-semibold rounded-lg hover:bg-[#c4a886] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? 'Guardando...' : 'Crear Factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}