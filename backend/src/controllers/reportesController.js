const { Pedido, ItemPedido, Producto, Mesa, Local, Usuario, Turno, Categoria } = require('../models');
const { Op } = require('sequelize');

const reportesController = {
  // Resumen de ventas del día
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
          { model: Usuario, as: 'usuario' }
        ]
      });

      const totalVentas = pedidos.reduce((sum, p) => sum + parseFloat(p.total_final || 0), 0);
      const totalCortesias = pedidos.reduce((sum, p) => sum + parseFloat(p.monto_cortesia || 0), 0);
      const cantidadPedidos = pedidos.length;

      // Por local
      const ventasPorLocal = {};
      pedidos.forEach(p => {
        const localNombre = p.local?.nombre || 'Sin local';
        if (!ventasPorLocal[localNombre]) {
          ventasPorLocal[localNombre] = { total: 0, cantidad: 0 };
        }
        ventasPorLocal[localNombre].total += parseFloat(p.total_final || 0);
        ventasPorLocal[localNombre].cantidad += 1;
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
        cantidadPedidos,
        ticketPromedio: cantidadPedidos > 0 ? totalVentas / cantidadPedidos : 0,
        ventasPorLocal,
        ventasPorMetodo
      });
    } catch (error) {
      console.error('Error en getVentasHoy:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Ventas por rango de fechas
  getVentasPorRango: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, local_id } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Se requieren fecha_inicio y fecha_fin' });
      }

      const inicio = new Date(fecha_inicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha_fin);
      fin.setHours(23, 59, 59, 999);

      const where = {
        estado: 'cerrado',
        closed_at: { [Op.between]: [inicio, fin] }
      };

      if (local_id) {
        where.local_id = local_id;
      }

      const pedidos = await Pedido.findAll({
        where,
        include: [
          { model: Local, as: 'local' },
          { model: Usuario, as: 'usuario' }
        ],
        order: [['closed_at', 'DESC']]
      });

      const totalVentas = pedidos.reduce((sum, p) => sum + parseFloat(p.total_final || 0), 0);
      const totalCortesias = pedidos.reduce((sum, p) => sum + parseFloat(p.monto_cortesia || 0), 0);

      // Agrupar por día
      const ventasPorDia = {};
      pedidos.forEach(p => {
        const fecha = new Date(p.closed_at).toISOString().split('T')[0];
        if (!ventasPorDia[fecha]) {
          ventasPorDia[fecha] = { total: 0, cantidad: 0, cortesias: 0 };
        }
        ventasPorDia[fecha].total += parseFloat(p.total_final || 0);
        ventasPorDia[fecha].cantidad += 1;
        ventasPorDia[fecha].cortesias += parseFloat(p.monto_cortesia || 0);
      });

      res.json({
        fecha_inicio,
        fecha_fin,
        totalVentas,
        totalCortesias,
        cantidadPedidos: pedidos.length,
        ticketPromedio: pedidos.length > 0 ? totalVentas / pedidos.length : 0,
        ventasPorDia: Object.entries(ventasPorDia).map(([fecha, data]) => ({
          fecha,
          ...data
        })).sort((a, b) => a.fecha.localeCompare(b.fecha))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Productos más vendidos
  getProductosMasVendidos: async (req, res) => {
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

      // Agrupar por producto
      const productosAgrupados = {};
      items.forEach(item => {
        const prodId = item.producto_id;
        if (!productosAgrupados[prodId]) {
          productosAgrupados[prodId] = {
            producto: item.producto,
            cantidadVendida: 0,
            totalVentas: 0
          };
        }
        productosAgrupados[prodId].cantidadVendida += item.cantidad;
        productosAgrupados[prodId].totalVentas += parseFloat(item.subtotal || 0);
      });

      const ranking = Object.values(productosAgrupados)
        .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
        .slice(0, parseInt(limite))
        .map((item, index) => ({
          posicion: index + 1,
          producto_id: item.producto?.id,
          nombre: item.producto?.nombre,
          categoria: item.producto?.categoria?.nombre,
          cantidadVendida: item.cantidadVendida,
          totalVentas: item.totalVentas
        }));

      res.json(ranking);
    } catch (error) {
      console.error('Error en getProductosMasVendidos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Ventas por categoría
  getVentasPorCategoria: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

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

      // Agrupar por categoría
      const categoriasAgrupadas = {};
      items.forEach(item => {
        const catNombre = item.producto?.categoria?.nombre || 'Sin categoria';
        const catIcono = item.producto?.categoria?.icono || '📦';
        if (!categoriasAgrupadas[catNombre]) {
          categoriasAgrupadas[catNombre] = {
            nombre: catNombre,
            icono: catIcono,
            cantidadVendida: 0,
            totalVentas: 0
          };
        }
        categoriasAgrupadas[catNombre].cantidadVendida += item.cantidad;
        categoriasAgrupadas[catNombre].totalVentas += parseFloat(item.subtotal || 0);
      });

      const resultado = Object.values(categoriasAgrupadas)
        .sort((a, b) => b.totalVentas - a.totalVentas);

      res.json(resultado);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Resumen de cortesías
  getCortesias: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      let whereClause = { 
        estado: 'cerrado',
        tiene_cortesia: true
      };

      if (fecha_inicio && fecha_fin) {
        const inicio = new Date(fecha_inicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fecha_fin);
        fin.setHours(23, 59, 59, 999);
        whereClause.closed_at = { [Op.between]: [inicio, fin] };
      }

      const pedidos = await Pedido.findAll({
        where: whereClause,
        include: [
          { model: Mesa, as: 'mesa' },
          { model: Usuario, as: 'usuario' },
          { model: Local, as: 'local' }
        ],
        order: [['closed_at', 'DESC']]
      });

      const totalCortesias = pedidos.reduce((sum, p) => sum + parseFloat(p.monto_cortesia || 0), 0);

      // Agrupar por razón
      const porRazon = {};
      pedidos.forEach(p => {
        const razon = p.razon_cortesia || 'Sin especificar';
        if (!porRazon[razon]) {
          porRazon[razon] = { cantidad: 0, total: 0 };
        }
        porRazon[razon].cantidad += 1;
        porRazon[razon].total += parseFloat(p.monto_cortesia || 0);
      });

      res.json({
        totalCortesias,
        cantidadPedidosConCortesia: pedidos.length,
        porRazon: Object.entries(porRazon).map(([razon, data]) => ({
          razon,
          ...data
        })),
        detalle: pedidos.map(p => ({
          id: p.id,
          mesa: p.mesa?.numero,
          local: p.local?.nombre,
          usuario: p.usuario?.nombre,
          subtotal: p.subtotal,
          monto_cortesia: p.monto_cortesia,
          razon: p.razon_cortesia,
          total_final: p.total_final,
          fecha: p.closed_at
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Dashboard resumen
  getDashboard: async (req, res) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      // Ventas de hoy
      const pedidosHoy = await Pedido.findAll({
        where: {
          estado: 'cerrado',
          closed_at: { [Op.between]: [hoy, manana] }
        }
      });

      const ventasHoy = pedidosHoy.reduce((sum, p) => sum + parseFloat(p.total_final || 0), 0);

      // Ventas del mes
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const pedidosMes = await Pedido.findAll({
        where: {
          estado: 'cerrado',
          closed_at: { [Op.gte]: inicioMes }
        }
      });

      const ventasMes = pedidosMes.reduce((sum, p) => sum + parseFloat(p.total_final || 0), 0);

      // Mesas activas
      const mesasOcupadas = await Mesa.count({ where: { estado: 'ocupada' } });
      const totalMesas = await Mesa.count();

      // Productos con stock bajo
      const productos = await Producto.findAll({ where: { activo: true } });
      const stockBajo = productos.filter(p => 
        (p.stock_local1 + p.stock_local2) <= p.alerta_stock
      ).length;

      res.json({
        ventasHoy,
        ventasMes,
        pedidosHoy: pedidosHoy.length,
        pedidosMes: pedidosMes.length,
        mesasOcupadas,
        totalMesas,
        stockBajo
      });
    } catch (error) {
      console.error('Error en getDashboard:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = reportesController;