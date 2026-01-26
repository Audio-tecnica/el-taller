const {
  Pedido,
  ItemPedido,
  Producto,
  Mesa,
  Local,
  Usuario,
  Categoria,
  MovimientoInventario,
  Proveedor
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const reportesPremiumController = {
  // ==========================================
  // REPORTES DE VENTAS (Mejorados)
  // ==========================================

  // Ventas hoy (ya existente, mejorado)
  getVentasHoy: async (req, res) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      const pedidos = await Pedido.findAll({
        where: {
          estado: 'cerrado',
          closed_at: { [Op.between]: [hoy, manana] }
        },
        include: [
          { model: Local, as: 'local' },
          { model: Usuario, as: 'usuario' },
          { model: ItemPedido, as: 'items', include: [{ model: Producto, as: 'producto' }] }
        ]
      });

      const totalVentas = pedidos.reduce((sum, p) => sum + parseFloat(p.total_final || 0), 0);
      const totalCortesias = pedidos.reduce((sum, p) => sum + parseFloat(p.monto_cortesia || 0), 0);

      // ⭐ NUEVO: Calcular costo de ventas del día
      let costoVentas = 0;
      for (const pedido of pedidos) {
        for (const item of pedido.items || []) {
          const costo = parseFloat(item.producto?.costo_promedio || 0);
          costoVentas += costo * item.cantidad;
        }
      }

      const utilidadBruta = totalVentas - costoVentas;
      const margenBruto = totalVentas > 0 ? (utilidadBruta / totalVentas) * 100 : 0;

      // Por local
      const ventasPorLocal = {};
      pedidos.forEach(p => {
        const localNombre = p.local?.nombre || 'Sin local';
        if (!ventasPorLocal[localNombre]) {
          ventasPorLocal[localNombre] = { total: 0, cantidad: 0, costo: 0, utilidad: 0 };
        }
        ventasPorLocal[localNombre].total += parseFloat(p.total_final || 0);
        ventasPorLocal[localNombre].cantidad += 1;
        
        // Calcular costo por local
        let costoLocal = 0;
        (p.items || []).forEach(item => {
          costoLocal += parseFloat(item.producto?.costo_promedio || 0) * item.cantidad;
        });
        ventasPorLocal[localNombre].costo += costoLocal;
        ventasPorLocal[localNombre].utilidad = ventasPorLocal[localNombre].total - ventasPorLocal[localNombre].costo;
      });

      // Por método de pago
      const ventasPorMetodo = {};
      pedidos.forEach(p => {
        const metodo = p.metodo_pago || 'efectivo';
        if (!ventasPorMetodo[metodo]) {
          ventasPorMetodo[metodo] = { total: 0, cantidad: 0 };
        }
        ventasPorMetodo[metodo].total += parseFloat(p.total_final || 0);
        ventasPorMetodo[metodo].cantidad += 1;
      });

      res.json({
        fecha: hoy.toISOString().split('T')[0],
        totalVentas,
        totalCortesias,
        costoVentas,
        utilidadBruta,
        margenBruto: margenBruto.toFixed(2),
        cantidadPedidos: pedidos.length,
        ticketPromedio: pedidos.length > 0 ? totalVentas / pedidos.length : 0,
        ventasPorLocal,
        ventasPorMetodo
      });
    } catch (error) {
      console.error('Error en getVentasHoy:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // REPORTES DE COMPRAS
  // ==========================================

  // Análisis de compras por período
  getComprasPorPeriodo: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, proveedor_id } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Se requieren fecha_inicio y fecha_fin' });
      }

      const inicio = new Date(fecha_inicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha_fin);
      fin.setHours(23, 59, 59, 999);

      const where = {
        tipo: 'compra',
        fecha_movimiento: { [Op.between]: [inicio, fin] }
      };

      if (proveedor_id) {
        where.proveedor_id = proveedor_id;
      }

      const movimientos = await MovimientoInventario.findAll({
        where,
        include: [
          { model: Producto, as: 'producto', include: [{ model: Categoria, as: 'categoria' }] },
          { model: Proveedor, as: 'proveedor' },
          { model: Local, as: 'local' }
        ],
        order: [['fecha_movimiento', 'DESC']]
      });

      // Totales
      const totalCompras = movimientos.reduce((sum, m) => sum + parseFloat(m.costo_total || 0), 0);
      const totalUnidades = movimientos.reduce((sum, m) => sum + m.cantidad, 0);

      // Por proveedor
      const porProveedor = {};
      movimientos.forEach(m => {
        const prov = m.proveedor?.nombre || 'Sin proveedor';
        if (!porProveedor[prov]) {
          porProveedor[prov] = { total: 0, cantidad: 0, productos: 0 };
        }
        porProveedor[prov].total += parseFloat(m.costo_total || 0);
        porProveedor[prov].cantidad += m.cantidad;
        porProveedor[prov].productos += 1;
      });

      // Por categoría
      const porCategoria = {};
      movimientos.forEach(m => {
        const cat = m.producto?.categoria?.nombre || 'Sin categoría';
        if (!porCategoria[cat]) {
          porCategoria[cat] = { total: 0, cantidad: 0 };
        }
        porCategoria[cat].total += parseFloat(m.costo_total || 0);
        porCategoria[cat].cantidad += m.cantidad;
      });

      // Productos más comprados
      const productosMasComprados = {};
      movimientos.forEach(m => {
        const prod = m.producto_id;
        if (!productosMasComprados[prod]) {
          productosMasComprados[prod] = {
            producto: m.producto?.nombre,
            categoria: m.producto?.categoria?.nombre,
            cantidad: 0,
            total: 0,
            promedio_costo: 0
          };
        }
        productosMasComprados[prod].cantidad += m.cantidad;
        productosMasComprados[prod].total += parseFloat(m.costo_total || 0);
      });

      Object.values(productosMasComprados).forEach(p => {
        p.promedio_costo = p.cantidad > 0 ? p.total / p.cantidad : 0;
      });

      const topProductos = Object.values(productosMasComprados)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      res.json({
        fecha_inicio,
        fecha_fin,
        totalCompras,
        totalUnidades,
        cantidadCompras: movimientos.length,
        ticketPromedio: movimientos.length > 0 ? totalCompras / movimientos.length : 0,
        porProveedor: Object.entries(porProveedor).map(([nombre, data]) => ({
          proveedor: nombre,
          ...data
        })).sort((a, b) => b.total - a.total),
        porCategoria: Object.entries(porCategoria).map(([nombre, data]) => ({
          categoria: nombre,
          ...data
        })).sort((a, b) => b.total - a.total),
        topProductos
      });
    } catch (error) {
      console.error('Error en getComprasPorPeriodo:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // ANÁLISIS COMPRAS VS VENTAS
  // ==========================================

  // Análisis financiero completo
  getAnalisisFinanciero: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, local_id } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Se requieren fecha_inicio y fecha_fin' });
      }

      const inicio = new Date(fecha_inicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha_fin);
      fin.setHours(23, 59, 59, 999);

      // VENTAS
      const whereVentas = {
        estado: 'cerrado',
        closed_at: { [Op.between]: [inicio, fin] }
      };
      if (local_id) whereVentas.local_id = local_id;

      const pedidos = await Pedido.findAll({
        where: whereVentas,
        include: [{ model: ItemPedido, as: 'items', include: [{ model: Producto, as: 'producto' }] }]
      });

      const totalVentas = pedidos.reduce((sum, p) => sum + parseFloat(p.total_final || 0), 0);
      const totalCortesias = pedidos.reduce((sum, p) => sum + parseFloat(p.monto_cortesia || 0), 0);

      // Costo de ventas
      let costoVentas = 0;
      for (const pedido of pedidos) {
        for (const item of pedido.items || []) {
          costoVentas += parseFloat(item.producto?.costo_promedio || 0) * item.cantidad;
        }
      }

      // COMPRAS
      const whereCompras = {
        tipo: 'compra',
        fecha_movimiento: { [Op.between]: [inicio, fin] }
      };
      if (local_id) whereCompras.local_id = local_id;

      const compras = await MovimientoInventario.findAll({ where: whereCompras });
      const totalCompras = compras.reduce((sum, m) => sum + parseFloat(m.costo_total || 0), 0);

      // GASTOS OPERATIVOS (Mermas, donaciones, etc.)
      const whereGastos = {
        tipo: { [Op.in]: ['merma', 'donacion', 'consumo_interno'] },
        fecha_movimiento: { [Op.between]: [inicio, fin] }
      };
      if (local_id) whereGastos.local_id = local_id;

      const gastos = await MovimientoInventario.findAll({ where: whereGastos });
      const totalGastos = gastos.reduce((sum, m) => sum + parseFloat(m.costo_total || 0), 0);

      // ANÁLISIS
      const utilidadBruta = totalVentas - costoVentas;
      const utilidadOperativa = utilidadBruta - totalGastos;
      const margenBruto = totalVentas > 0 ? (utilidadBruta / totalVentas) * 100 : 0;
      const margenOperativo = totalVentas > 0 ? (utilidadOperativa / totalVentas) * 100 : 0;
      const rotacionInventario = totalCompras > 0 ? costoVentas / totalCompras : 0;

      res.json({
        periodo: { fecha_inicio, fecha_fin },
        ventas: {
          total: totalVentas,
          cortesias: totalCortesias,
          cantidad_pedidos: pedidos.length,
          ticket_promedio: pedidos.length > 0 ? totalVentas / pedidos.length : 0
        },
        costos: {
          costo_ventas: costoVentas,
          compras: totalCompras,
          gastos_operativos: totalGastos
        },
        rentabilidad: {
          utilidad_bruta: utilidadBruta,
          utilidad_operativa: utilidadOperativa,
          margen_bruto_porcentaje: margenBruto.toFixed(2),
          margen_operativo_porcentaje: margenOperativo.toFixed(2)
        },
        indicadores: {
          rotacion_inventario: rotacionInventario.toFixed(2),
          inversion_inventario: totalCompras
        }
      });
    } catch (error) {
      console.error('Error en getAnalisisFinanciero:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // ANÁLISIS DE PRODUCTOS
  // ==========================================

  // Productos por rentabilidad
  getProductosPorRentabilidad: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, limite = 20 } = req.query;

      let whereClause = { estado: 'cerrado' };

      if (fecha_inicio && fecha_fin) {
        const inicio = new Date(fecha_inicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fecha_fin);
        fin.setHours(23, 59, 59, 999);
        whereClause.closed_at = { [Op.between]: [inicio, fin] };
      }

      const pedidos = await Pedido.findAll({
        where: whereClause,
        attributes: ['id']
      });

      const pedidoIds = pedidos.map(p => p.id);

      if (pedidoIds.length === 0) {
        return res.json([]);
      }

      const items = await ItemPedido.findAll({
        where: { pedido_id: { [Op.in]: pedidoIds } },
        include: [
          {
            model: Producto,
            as: 'producto',
            include: [{ model: Categoria, as: 'categoria' }]
          }
        ]
      });

      // Agrupar y calcular rentabilidad
      const productosAgrupados = {};
      items.forEach(item => {
        const prodId = item.producto_id;
        if (!productosAgrupados[prodId]) {
          productosAgrupados[prodId] = {
            producto: item.producto,
            cantidadVendida: 0,
            totalVentas: 0,
            costoTotal: 0,
            utilidad: 0,
            margen: 0
          };
        }
        const costo = parseFloat(item.producto?.costo_promedio || 0) * item.cantidad;
        const venta = parseFloat(item.subtotal || 0);

        productosAgrupados[prodId].cantidadVendida += item.cantidad;
        productosAgrupados[prodId].totalVentas += venta;
        productosAgrupados[prodId].costoTotal += costo;
        productosAgrupados[prodId].utilidad = productosAgrupados[prodId].totalVentas - productosAgrupados[prodId].costoTotal;
        productosAgrupados[prodId].margen = productosAgrupados[prodId].costoTotal > 0
          ? (productosAgrupados[prodId].utilidad / productosAgrupados[prodId].costoTotal) * 100
          : 0;
      });

      const ranking = Object.values(productosAgrupados)
        .map(item => ({
          producto_id: item.producto?.id,
          nombre: item.producto?.nombre,
          categoria: item.producto?.categoria?.nombre,
          cantidadVendida: item.cantidadVendida,
          totalVentas: item.totalVentas,
          costoTotal: item.costoTotal,
          utilidad: item.utilidad,
          margen_porcentaje: item.margen.toFixed(2)
        }))
        .sort((a, b) => b.utilidad - a.utilidad)
        .slice(0, parseInt(limite));

      res.json(ranking);
    } catch (error) {
      console.error('Error en getProductosPorRentabilidad:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // REPORTES DE INVENTARIO
  // ==========================================

  // Historial de movimientos con valorización
  getHistorialMovimientos: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, tipo, local_id } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Se requieren fecha_inicio y fecha_fin' });
      }

      const inicio = new Date(fecha_inicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha_fin);
      fin.setHours(23, 59, 59, 999);

      const where = {
        fecha_movimiento: { [Op.between]: [inicio, fin] }
      };

      if (tipo) where.tipo = tipo;
      if (local_id) where.local_id = local_id;

      const movimientos = await MovimientoInventario.findAll({
        where,
        include: [
          { model: Producto, as: 'producto', include: [{ model: Categoria, as: 'categoria' }] },
          { model: Local, as: 'local' },
          { model: Proveedor, as: 'proveedor' },
          { model: Usuario, as: 'usuario' }
        ],
        order: [['fecha_movimiento', 'DESC']]
      });

      // Agrupar por tipo
      const porTipo = {};
      let valorTotalEntradas = 0;
      let valorTotalSalidas = 0;

      movimientos.forEach(m => {
        if (!porTipo[m.tipo]) {
          porTipo[m.tipo] = { cantidad: 0, valor: 0, movimientos: 0 };
        }
        porTipo[m.tipo].cantidad += Math.abs(m.cantidad);
        porTipo[m.tipo].valor += parseFloat(m.costo_total || 0);
        porTipo[m.tipo].movimientos += 1;

        if (m.cantidad > 0) {
          valorTotalEntradas += parseFloat(m.costo_total || 0);
        } else {
          valorTotalSalidas += parseFloat(m.costo_total || 0);
        }
      });

      res.json({
        periodo: { fecha_inicio, fecha_fin },
        total_movimientos: movimientos.length,
        valor_entradas: valorTotalEntradas,
        valor_salidas: valorTotalSalidas,
        por_tipo: Object.entries(porTipo).map(([tipo, data]) => ({
          tipo,
          ...data
        })),
        movimientos: movimientos.slice(0, 100) // Limitar a 100 para rendimiento
      });
    } catch (error) {
      console.error('Error en getHistorialMovimientos:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = reportesPremiumController;
