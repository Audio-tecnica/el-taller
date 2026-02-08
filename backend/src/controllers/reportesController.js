const { Op } = require('sequelize');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Pedido = require('../models/Pedido');
const ItemPedido = require('../models/ItemPedido');
const Mesa = require('../models/Mesa');
const Local = require('../models/Local');
const Usuario = require('../models/Usuario');
const MovimientoInventario = require('../models/MovimientoInventario');
const Proveedor = require('../models/Proveedor');

module.exports = {
  // ==================== REPORTES EXISTENTES ====================
  
  // Ventas del día
  getVentasHoy: async (req, res) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const pedidos = await Pedido.findAll({
        where: {
          estado: 'cerrado',
          created_at: {
            [Op.gte]: hoy
          }
        },
        include: [{
          model: ItemPedido,
          as: 'items',
          include: [{ model: Producto, as: 'producto' }]
        }]
      });

      const totalVentas = pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
      const totalPedidos = pedidos.length;
      const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

      res.json({
        total: totalVentas,
        pedidos: totalPedidos,
        ticket_promedio: ticketPromedio,
        detalle: pedidos
      });
    } catch (error) {
      console.error('Error en getVentasHoy:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Ventas por rango de fechas
  getVentasPorRango: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      
      const pedidos = await Pedido.findAll({
        where: {
          estado: 'cerrado',
          created_at: {
            [Op.between]: [
              new Date(fecha_inicio + ' 00:00:00'),
              new Date(fecha_fin + ' 23:59:59')
            ]
          }
        }
      });

      const total = pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

      res.json({
        total,
        pedidos: pedidos.length,
        detalle: pedidos
      });
    } catch (error) {
      console.error('Error en getVentasPorRango:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Productos más vendidos
  getProductosTop: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, limite = 10 } = req.query;
      
      const items = await ItemPedido.findAll({
        include: [
          {
            model: Producto,
            as: 'producto',
            attributes: ['id', 'nombre', 'precio_venta']
          },
          {
            model: Pedido,
            as: 'pedido',
            where: {
              estado: 'cerrado',
              created_at: {
                [Op.between]: [
                  new Date(fecha_inicio + ' 00:00:00'),
                  new Date(fecha_fin + ' 23:59:59')
                ]
              }
            },
            attributes: []
          }
        ]
      });

      const productosAgrupados = items.reduce((acc, item) => {
        const id = item.producto_id;
        if (!acc[id]) {
          acc[id] = {
            producto: item.producto?.nombre || 'Sin nombre',
            cantidad: 0,
            total: 0
          };
        }
        acc[id].cantidad += item.cantidad;
        acc[id].total += parseFloat(item.subtotal || 0);
        return acc;
      }, {});

      const resultado = Object.values(productosAgrupados)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, parseInt(limite));

      res.json(resultado);
    } catch (error) {
      console.error('Error en getProductosTop:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Ventas por categoría
  getVentasPorCategoria: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      
      const items = await ItemPedido.findAll({
        include: [
          {
            model: Producto,
            as: 'producto',
            include: [{
              model: Categoria,
              as: 'categoria',
              attributes: ['id', 'nombre']
            }]
          },
          {
            model: Pedido,
            as: 'pedido',
            where: {
              estado: 'cerrado',
              created_at: {
                [Op.between]: [
                  new Date(fecha_inicio + ' 00:00:00'),
                  new Date(fecha_fin + ' 23:59:59')
                ]
              }
            },
            attributes: []
          }
        ]
      });

      const categorias = items.reduce((acc, item) => {
        const categoria = item.producto?.categoria?.nombre || 'Sin categoría';
        if (!acc[categoria]) {
          acc[categoria] = {
            categoria,
            cantidad: 0,
            total: 0
          };
        }
        acc[categoria].cantidad += item.cantidad;
        acc[categoria].total += parseFloat(item.subtotal || 0);
        return acc;
      }, {});

      res.json(Object.values(categorias));
    } catch (error) {
      console.error('Error en getVentasPorCategoria:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Cortesías
  getCortesias: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      
      const pedidos = await Pedido.findAll({
        where: {
          es_cortesia: true,
          estado: 'cerrado',
          created_at: {
            [Op.between]: [
              new Date(fecha_inicio + ' 00:00:00'),
              new Date(fecha_fin + ' 23:59:59')
            ]
          }
        },
        include: [
          {
            model: ItemPedido,
            as: 'items',
            include: [{ model: Producto, as: 'producto' }]
          },
          { model: Mesa, as: 'mesa' }
        ]
      });

      const total = pedidos.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

      res.json({
        total,
        cantidad: pedidos.length,
        detalle: pedidos
      });
    } catch (error) {
      console.error('Error en getCortesias:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==================== NUEVOS REPORTES PREMIUM ====================

  // 1️⃣ Ventas Detalladas
  getVentasDetalladas: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, local_id } = req.query;
      
      const where = {
        estado: 'cerrado',
        created_at: {
          [Op.between]: [
            new Date(fecha_inicio + ' 00:00:00'),
            new Date(fecha_fin + ' 23:59:59')
          ]
        }
      };

      const pedidos = await Pedido.findAll({
        where,
        include: [
          {
            model: ItemPedido,
            as: 'items',
            include: [{ model: Producto, as: 'producto' }]
          },
          {
            model: Mesa,
            as: 'mesa',
            include: [{ model: Local, as: 'local' }]
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'email']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      const resultado = pedidos
        .filter(p => !local_id || p.mesa?.local_id === local_id)
        .map(p => ({
          id: p.id,
          fecha: p.created_at,
          mesa: p.mesa?.nombre || 'N/A',
          local: p.mesa?.local?.nombre || 'N/A',
          mesero: p.usuario?.nombre || 'Sin mesero',
          subtotal: parseFloat(p.subtotal || 0),
          descuento: parseFloat(p.descuento || 0),
          total: parseFloat(p.total || 0),
          metodo_pago: p.metodo_pago || 'efectivo',
          items: p.items.map(i => ({
            producto: i.producto?.nombre,
            cantidad: i.cantidad,
            precio: parseFloat(i.precio_unitario || 0),
            subtotal: parseFloat(i.subtotal || 0)
          }))
        }));

      res.json(resultado);
    } catch (error) {
      console.error('Error en getVentasDetalladas:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // 2️⃣ Gastos
  getGastos: async (req, res) => {
    try {
      // Por ahora retornamos un array vacío
      // Más adelante puedes crear una tabla de gastos
      res.json([]);
    } catch (error) {
      console.error('Error en getGastos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // 3️⃣ Compras Detalladas - CORREGIDO
  getComprasDetalladas: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, proveedor_id } = req.query;
      
      const where = {
        tipo: 'entrada',
        fecha_movimiento: {  // ✅ CORREGIDO: era 'fecha'
          [Op.between]: [
            new Date(fecha_inicio + ' 00:00:00'), 
            new Date(fecha_fin + ' 23:59:59')
          ] 
        }
      };
      
      if (proveedor_id) where.proveedor_id = proveedor_id;
      
      const movimientos = await MovimientoInventario.findAll({
        where,
        include: [
          { model: Producto, as: 'producto' },
          { model: Proveedor, as: 'proveedor' }
        ],
        order: [['fecha_movimiento', 'DESC']]  // ✅ CORREGIDO: era 'fecha'
      });
      
      const resultado = movimientos.map(m => ({
        fecha: m.fecha_movimiento,  // ✅ CORREGIDO: era 'fecha'
        proveedor: m.proveedor?.nombre || 'Sin proveedor',
        factura: m.numero_factura || 'N/A',
        producto: m.producto?.nombre,
        cantidad: m.cantidad,
        costo_unitario: parseFloat(m.costo_unitario || 0),
        total: m.cantidad * parseFloat(m.costo_unitario || 0),
        forma_pago: 'contado',
        estado: 'pagada'
      }));
      
      res.json(resultado);
    } catch (error) {
      console.error('Error en getComprasDetalladas:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // 4️⃣ Inventario Valorizado
  getInventarioValorizado: async (req, res) => {
    try {
      const { local_id } = req.query;
      
      const productos = await Producto.findAll({
        where: { activo: true },
        include: [{ model: Categoria, as: 'categoria' }]
      });
      
      const resultado = productos.map(p => {
        const stockActual = local_id 
          ? (local_id == 1 ? p.stock_local1 : p.stock_local2)
          : (p.stock_local1 + p.stock_local2);
        
        return {
          codigo: p.id.substring(0, 8),
          producto: p.nombre,
          categoria: p.categoria?.nombre || 'Sin categoría',
          stock_local1: p.stock_local1 || 0,
          stock_local2: p.stock_local2 || 0,
          stock_total: stockActual,
          costo_promedio: parseFloat(p.costo_promedio || 0),
          valor_total: stockActual * parseFloat(p.costo_promedio || 0),
          precio_venta: parseFloat(p.precio_venta || 0)
        };
      });
      
      res.json(resultado);
    } catch (error) {
      console.error('Error en getInventarioValorizado:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // 5️⃣ Kardex - CORREGIDO
  getKardex: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, producto_id, tipo } = req.query;
      
      const where = {
        fecha_movimiento: {  // ✅ CORREGIDO: era 'fecha'
          [Op.between]: [
            new Date(fecha_inicio + ' 00:00:00'), 
            new Date(fecha_fin + ' 23:59:59')
          ] 
        }
      };
      
      if (producto_id) where.producto_id = producto_id;
      if (tipo) where.tipo = tipo;
      
      const movimientos = await MovimientoInventario.findAll({
        where,
        include: [
          { model: Producto, as: 'producto' },
          { model: Usuario, as: 'usuario' }
        ],
        order: [['fecha_movimiento', 'DESC']]  // ✅ CORREGIDO: era 'fecha'
      });
      
      const resultado = movimientos.map(m => ({
        fecha: m.fecha_movimiento,  // ✅ CORREGIDO: era 'fecha'
        producto: m.producto?.nombre,
        tipo: m.tipo,
        cantidad: m.cantidad,
        stock_anterior: m.stock_anterior,
        stock_nuevo: m.stock_nuevo,
        origen: m.observaciones || `${m.tipo} por ${m.usuario?.nombre || 'Sistema'}`
      }));
      
      res.json(resultado);
    } catch (error) {
      console.error('Error en getKardex:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // 6️⃣ Estado de Resultados
  getEstadoResultados: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, local_id } = req.query;
      
      const inicio = new Date(fecha_inicio + ' 00:00:00');
      const fin = new Date(fecha_fin + ' 23:59:59');
      
      // 1. Ingresos por ventas
      const pedidos = await Pedido.findAll({
        where: {
          estado: 'cerrado',
          created_at: { [Op.between]: [inicio, fin] }
        },
        include: [
          {
            model: ItemPedido,
            as: 'items',
            include: [{ model: Producto, as: 'producto' }]
          },
          {
            model: Mesa,
            as: 'mesa',
            include: [{ model: Local, as: 'local' }]
          }
        ]
      });

      const pedidosFiltrados = local_id
        ? pedidos.filter(p => p.mesa?.local_id === local_id)
        : pedidos;

      const ventasBrutas = pedidosFiltrados.reduce((sum, p) => 
        sum + parseFloat(p.total || 0), 0
      );

      const descuentos = pedidosFiltrados.reduce((sum, p) => 
        sum + parseFloat(p.descuento || 0), 0
      );

      const ventasNetas = ventasBrutas - descuentos;

      // 2. Costo de ventas
      let costoVentas = 0;
      pedidosFiltrados.forEach(pedido => {
        pedido.items?.forEach(item => {
          const costoUnitario = parseFloat(item.producto?.costo_promedio || 0);
          costoVentas += item.cantidad * costoUnitario;
        });
      });

      const utilidadBruta = ventasNetas - costoVentas;
      const margenBruto = ventasNetas > 0 ? (utilidadBruta / ventasNetas) * 100 : 0;

      // 3. Gastos operativos (por ahora en 0, puedes agregar tabla de gastos)
      const gastosOperativos = 0;

      const utilidadOperativa = utilidadBruta - gastosOperativos;
      const utilidadNeta = utilidadOperativa;

      res.json({
        periodo: {
          inicio: fecha_inicio,
          fin: fecha_fin
        },
        ingresos: {
          ventas_brutas: ventasBrutas,
          descuentos: descuentos,
          ventas_netas: ventasNetas
        },
        costos: {
          costo_ventas: costoVentas
        },
        utilidad_bruta: utilidadBruta,
        margen_bruto: margenBruto,
        gastos_operativos: gastosOperativos,
        utilidad_operativa: utilidadOperativa,
        utilidad_neta: utilidadNeta
      });
    } catch (error) {
      console.error('Error en getEstadoResultados:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // 7️⃣ Cierre de Caja
  getCierreCaja: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, local_id } = req.query;
      
      const pedidos = await Pedido.findAll({
        where: {
          estado: 'cerrado',
          created_at: {
            [Op.between]: [
              new Date(fecha_inicio + ' 00:00:00'),
              new Date(fecha_fin + ' 23:59:59')
            ]
          }
        },
        include: [
          {
            model: Mesa,
            as: 'mesa',
            include: [{ model: Local, as: 'local' }]
          }
        ]
      });

      const pedidosFiltrados = local_id
        ? pedidos.filter(p => p.mesa?.local_id === local_id)
        : pedidos;

      const porMetodoPago = pedidosFiltrados.reduce((acc, p) => {
        const metodo = p.metodo_pago || 'efectivo';
        if (!acc[metodo]) {
          acc[metodo] = { cantidad: 0, total: 0 };
        }
        acc[metodo].cantidad += 1;
        acc[metodo].total += parseFloat(p.total || 0);
        return acc;
      }, {});

      const totalVentas = pedidosFiltrados.reduce((sum, p) => 
        sum + parseFloat(p.total || 0), 0
      );

      res.json({
        fecha: fecha_inicio,
        total_ventas: totalVentas,
        total_pedidos: pedidosFiltrados.length,
        metodos_pago: Object.entries(porMetodoPago).map(([metodo, data]) => ({
          metodo,
          cantidad: data.cantidad,
          total: data.total
        })),
        efectivo: porMetodoPago.efectivo?.total || 0,
        tarjeta: (porMetodoPago.tarjeta?.total || 0) + (porMetodoPago.datafono?.total || 0),
        transferencia: porMetodoPago.transferencia?.total || 0
      });
    } catch (error) {
      console.error('Error en getCierreCaja:', error);
      res.status(500).json({ error: error.message });
    }
  }
};