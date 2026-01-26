const {
  Producto,
  MovimientoInventario,
  Proveedor,
  Local,
  Categoria,
  Usuario,
  Compra
} = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

const inventarioKardexController = {

  // ==========================================
  // COMPRAS Y ENTRADAS
  // ==========================================

  registrarCompra: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        proveedor_id,
        local_id,
        numero_factura,
        fecha_factura,
        productos,
        observaciones
      } = req.body;
      const usuario_id = req.usuario.id;

      if (!productos || productos.length === 0) {
        await t.rollback();
        return res.status(400).json({ error: "Debe incluir al menos un producto" });
      }

      const proveedor = await Proveedor.findByPk(proveedor_id, { transaction: t }); // FIX
      if (!proveedor) {
        await t.rollback();
        return res.status(404).json({ error: "Proveedor no encontrado" });
      }

      const anio = new Date().getFullYear();
      const ultimaCompra = await Compra.findOne({
        where: { numero_compra: { [Op.like]: `COM-${anio}-%` } },
        order: [['numero_compra', 'DESC']],
        transaction: t
      });

      let contador = 1;
      if (ultimaCompra) {
        contador = parseInt(ultimaCompra.numero_compra.split('-')[2]) + 1;
      }

      const numero_compra = `COM-${anio}-${String(contador).padStart(5, '0')}`;

      let subtotal = 0;
      const movimientos = [];

      for (const item of productos) {

        if (item.cantidad <= 0) { // FIX
          await t.rollback();
          return res.status(400).json({ error: "Cantidad inválida" });
        }

        const producto = await Producto.findByPk(item.producto_id, { transaction: t });
        if (!producto) {
          await t.rollback();
          return res.status(404).json({ error: `Producto ${item.producto_id} no encontrado` });
        }

        const stockField = local_id === '00000000-0000-0000-0000-000000000001'
          ? 'stock_local1'
          : 'stock_local2';

        const stockAnterior = producto[stockField];
        const stockNuevo = stockAnterior + item.cantidad;
        const costoTotal = item.cantidad * item.costo_unitario;

        subtotal += costoTotal;

        // FIX: recalcular costo promedio
        const stockTotalAnterior = (producto.stock_local1 || 0) + (producto.stock_local2 || 0);
        const nuevoCostoPromedio =
          stockTotalAnterior + item.cantidad > 0
            ? ((producto.costo_promedio * stockTotalAnterior) + costoTotal)
              / (stockTotalAnterior + item.cantidad)
            : item.costo_unitario;

        await producto.update({
          [stockField]: stockNuevo,
          ultimo_costo: item.costo_unitario,
          costo_promedio: nuevoCostoPromedio // FIX
        }, { transaction: t });

        if (item.precio_venta) {
          await producto.update(
            { precio_venta: item.precio_venta },
            { transaction: t }
          );
        }

        const movimiento = await MovimientoInventario.create({
          producto_id: item.producto_id,
          local_id,
          tipo: 'compra',
          cantidad: item.cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          costo_unitario: item.costo_unitario,
          costo_total: costoTotal,
          proveedor_id,
          numero_factura,
          fecha_factura,
          fecha_movimiento: new Date(), // FIX
          motivo: `Compra a ${proveedor.nombre}`,
          observaciones,
          usuario_id
        }, { transaction: t });

        movimientos.push(movimiento);
      }

      const compra = await Compra.create({
        numero_compra,
        proveedor_id,
        local_id,
        numero_factura,
        fecha_factura,
        subtotal,
        total: subtotal,
        estado: 'recibida',
        observaciones,
        usuario_id
      }, { transaction: t });

      await t.commit();

      res.json({
        mensaje: "Compra registrada exitosamente",
        compra,
        movimientos: movimientos.length
      });

    } catch (error) {
      await t.rollback();
      console.error("Error en registrarCompra:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Registrar devolución a proveedor (salida)
  registrarDevolucionProveedor: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        producto_id,
        local_id,
        proveedor_id,
        cantidad,
        costo_unitario,
        numero_factura,
        motivo,
        observaciones
      } = req.body;
      const usuario_id = req.usuario.id;

      const producto = await Producto.findByPk(producto_id, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockField = local_id === '00000000-0000-0000-0000-000000000001' ? 'stock_local1' : 'stock_local2';
      const stockAnterior = producto[stockField];

      if (stockAnterior < cantidad) {
        await t.rollback();
        return res.status(400).json({
          error: `Stock insuficiente. Disponible: ${stockAnterior}, Solicitado: ${cantidad}`
        });
      }

      const stockNuevo = stockAnterior - cantidad;

      await producto.update(
        { [stockField]: stockNuevo },
        { transaction: t }
      );

      const movimiento = await MovimientoInventario.create(
        {
          producto_id,
          local_id,
          tipo: 'devolucion_proveedor',
          cantidad: -cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          costo_unitario,
          costo_total: cantidad * costo_unitario,
          proveedor_id,
          numero_factura,
          motivo: motivo || "Devolución a proveedor",
          observaciones,
          usuario_id
        },
        { transaction: t }
      );

      await t.commit();

      res.json({
        mensaje: "Devolución registrada exitosamente",
        movimiento
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en registrarDevolucionProveedor:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // AJUSTES DE INVENTARIO
  // ==========================================

  // Ajuste de inventario (positivo o negativo)
  ajustarInventario: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        producto_id,
        local_id,
        cantidad_contada,
        motivo,
        observaciones,
        autorizado_por
      } = req.body;
      const usuario_id = req.usuario.id;

      const producto = await Producto.findByPk(producto_id, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockField = local_id === '00000000-0000-0000-0000-000000000001' ? 'stock_local1' : 'stock_local2';
      const stockAnterior = producto[stockField];
      const diferencia = cantidad_contada - stockAnterior;

      if (diferencia === 0) {
        await t.rollback();
        return res.status(400).json({
          error: "El stock contado es igual al stock actual. No se requiere ajuste."
        });
      }

      const tipo = diferencia > 0 ? 'ajuste_positivo' : 'ajuste_negativo';

      await producto.update(
        { [stockField]: cantidad_contada },
        { transaction: t }
      );

      const movimiento = await MovimientoInventario.create(
        {
          producto_id,
          local_id,
          tipo,
          cantidad: diferencia,
          stock_anterior: stockAnterior,
          stock_nuevo: cantidad_contada,
          motivo: motivo || "Ajuste por conteo físico",
          observaciones,
          usuario_id,
          autorizado_por
        },
        { transaction: t }
      );

      await t.commit();

      res.json({
        mensaje: `Ajuste de inventario registrado (${diferencia > 0 ? '+' : ''}${diferencia} unidades)`,
        movimiento
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en ajustarInventario:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Registrar merma
  registrarMerma: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        producto_id,
        local_id,
        cantidad,
        motivo,
        observaciones,
        autorizado_por
      } = req.body;
      const usuario_id = req.usuario.id;

      const producto = await Producto.findByPk(producto_id, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockField = local_id === '00000000-0000-0000-0000-000000000001' ? 'stock_local1' : 'stock_local2';
      const stockAnterior = producto[stockField];

      if (stockAnterior < cantidad) {
        await t.rollback();
        return res.status(400).json({
          error: `Stock insuficiente. Disponible: ${stockAnterior}, Solicitado: ${cantidad}`
        });
      }

      const stockNuevo = stockAnterior - cantidad;

      await producto.update(
        { [stockField]: stockNuevo },
        { transaction: t }
      );

      const movimiento = await MovimientoInventario.create(
        {
          producto_id,
          local_id,
          tipo: 'merma',
          cantidad: -cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          costo_unitario: producto.costo_promedio,
          costo_total: cantidad * producto.costo_promedio,
          motivo: motivo || "Merma de inventario",
          observaciones,
          usuario_id,
          autorizado_por
        },
        { transaction: t }
      );

      await t.commit();

      res.json({
        mensaje: "Merma registrada exitosamente",
        movimiento,
        costo_merma: cantidad * producto.costo_promedio
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en registrarMerma:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // TRANSFERENCIAS ENTRE LOCALES
  // ==========================================

  // Transferir entre locales (mejorado)
  transferirEntreLocales: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const {
        producto_id,
        local_origen_id,
        local_destino_id,
        cantidad,
        motivo,
        observaciones
      } = req.body;
      const usuario_id = req.usuario.id;

      if (local_origen_id === local_destino_id) {
        await t.rollback();
        return res.status(400).json({
          error: "El local de origen y destino deben ser diferentes"
        });
      }

      const producto = await Producto.findByPk(producto_id, { transaction: t });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockFieldOrigen = local_origen_id === '00000000-0000-0000-0000-000000000001' ? 'stock_local1' : 'stock_local2';
      const stockFieldDestino = local_destino_id === '00000000-0000-0000-0000-000000000001' ? 'stock_local1' : 'stock_local2';

      const stockOrigen = producto[stockFieldOrigen];
      const stockDestino = producto[stockFieldDestino];

      if (stockOrigen < cantidad) {
        await t.rollback();
        return res.status(400).json({
          error: `Stock insuficiente en local origen. Disponible: ${stockOrigen}, Solicitado: ${cantidad}`
        });
      }

      await producto.update(
        {
          [stockFieldOrigen]: stockOrigen - cantidad,
          [stockFieldDestino]: stockDestino + cantidad
        },
        { transaction: t }
      );

      // Movimiento de salida
      const movSalida = await MovimientoInventario.create(
        {
          producto_id,
          local_id: local_origen_id,
          tipo: 'salida_transferencia',
          cantidad: -cantidad,
          stock_anterior: stockOrigen,
          stock_nuevo: stockOrigen - cantidad,
          local_origen_id,
          local_destino_id,
          costo_unitario: producto.costo_promedio,
          costo_total: cantidad * producto.costo_promedio,
          motivo: motivo || "Transferencia entre locales",
          observaciones,
          usuario_id
        },
        { transaction: t }
      );

      // Movimiento de entrada
      const movEntrada = await MovimientoInventario.create(
        {
          producto_id,
          local_id: local_destino_id,
          tipo: 'entrada_transferencia',
          cantidad: cantidad,
          stock_anterior: stockDestino,
          stock_nuevo: stockDestino + cantidad,
          local_origen_id,
          local_destino_id,
          costo_unitario: producto.costo_promedio,
          costo_total: cantidad * producto.costo_promedio,
          motivo: motivo || "Transferencia entre locales",
          observaciones,
          usuario_id,
          movimiento_relacionado_id: movSalida.id
        },
        { transaction: t }
      );

      // Relacionar movimientos
      await movSalida.update(
        { movimiento_relacionado_id: movEntrada.id },
        { transaction: t }
      );

      await t.commit();

      res.json({
        mensaje: `Transferencia completada: ${cantidad} unidades`,
        movimiento_salida: movSalida,
        movimiento_entrada: movEntrada
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en transferirEntreLocales:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ==========================================
  // CONSULTAS Y REPORTES KARDEX
  // ==========================================

  // Obtener kardex de un producto
  getKardexProducto: async (req, res) => {
    try {
      const { producto_id } = req.params;
      const { fecha_inicio, fecha_fin, local_id, limit = 100 } = req.query;

      const where = { producto_id };

      if (local_id) where.local_id = local_id;

      if (fecha_inicio && fecha_fin) {
        where.fecha_movimiento = {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
        };
      }

      const movimientos = await MovimientoInventario.findAll({
        where,
        include: [
          { model: Producto, as: 'producto', attributes: ['id', 'nombre', 'codigo'] },
          { model: Local, as: 'local', attributes: ['id', 'nombre'] },
          { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] },
          { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
        ],
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit)
      });

      // Calcular totales
      const resumen = {
        total_entradas: 0,
        total_salidas: 0,
        valor_entradas: 0,
        valor_salidas: 0,
        stock_inicial: movimientos.length > 0 ? movimientos[movimientos.length - 1].stock_anterior : 0,
        stock_final: movimientos.length > 0 ? movimientos[0].stock_nuevo : 0
      };

      movimientos.forEach(mov => {
        if (mov.cantidad > 0) {
          resumen.total_entradas += mov.cantidad;
          resumen.valor_entradas += parseFloat(mov.costo_total || 0);
        } else {
          resumen.total_salidas += Math.abs(mov.cantidad);
          resumen.valor_salidas += parseFloat(mov.valor_venta || mov.costo_total || 0);
        }
      });

      res.json({
        producto_id,
        movimientos,
        resumen
      });
    } catch (error) {
      console.error("Error en getKardexProducto:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todos los movimientos con filtros
  getMovimientos: async (req, res) => {
    try {
      const {
        producto_id,
        local_id,
        tipo,
        proveedor_id,
        fecha_inicio,
        fecha_fin,
        limit = 50
      } = req.query;

      const where = {};
      if (producto_id) where.producto_id = producto_id;
      if (local_id) where.local_id = local_id;
      if (tipo) where.tipo = tipo;
      if (proveedor_id) where.proveedor_id = proveedor_id;

      if (fecha_inicio && fecha_fin) {
        where.fecha_movimiento = {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
        };
      }

      const movimientos = await MovimientoInventario.findAll({
        where,
        include: [
          { model: Producto, as: 'producto', attributes: ['id', 'nombre', 'codigo'], required: false },
          { model: Local, as: 'local', attributes: ['id', 'nombre'], required: false },
          { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'], required: false },
          { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'], required: false }
        ],
        order: [['fecha_movimiento', 'DESC']],
        limit: parseInt(limit)
      });

      res.json(movimientos);
    } catch (error) {
      console.error("Error en getMovimientos:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener inventario valorizado
  getInventarioValorizado: async (req, res) => {
    try {
      const { local_id } = req.query;

      const productos = await Producto.findAll({
        where: { activo: true },
        include: [{ model: Categoria, as: 'categoria' }],
        order: [['nombre', 'ASC']]
      });

      const inventarioValorizado = productos.map(p => {
        const stockLocal1 = p.stock_local1 || 0;
        const stockLocal2 = p.stock_local2 || 0;
        const stockTotal = stockLocal1 + stockLocal2;

        let stock = stockTotal;
        if (local_id === '00000000-0000-0000-0000-000000000001') stock = stockLocal1;
        if (local_id === '00000000-0000-0000-0000-000000000002') stock = stockLocal2;

        const valorCosto = stock * parseFloat(p.costo_promedio || 0);
        const valorVenta = stock * parseFloat(p.precio_venta || 0);
        const utilidadPotencial = valorVenta - valorCosto;
        const margen = p.costo_promedio > 0 
          ? ((parseFloat(p.precio_venta || 0) - parseFloat(p.costo_promedio || 0)) / parseFloat(p.costo_promedio || 0)) * 100
          : 0;

        return {
          producto_id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          categoria: p.categoria?.nombre,
          stock,
          costo_promedio: parseFloat(p.costo_promedio || 0),
          ultimo_costo: parseFloat(p.ultimo_costo || 0),
          precio_venta: parseFloat(p.precio_venta || 0),
          valor_inventario_costo: valorCosto,
          valor_inventario_venta: valorVenta,
          utilidad_potencial: utilidadPotencial,
          margen_porcentaje: margen.toFixed(2),
          stock_bajo: stockTotal <= p.alerta_stock
        };
      });

      const totales = {
        total_productos: inventarioValorizado.length,
        valor_total_costo: inventarioValorizado.reduce((sum, p) => sum + p.valor_inventario_costo, 0),
        valor_total_venta: inventarioValorizado.reduce((sum, p) => sum + p.valor_inventario_venta, 0),
        utilidad_potencial_total: inventarioValorizado.reduce((sum, p) => sum + p.utilidad_potencial, 0),
        productos_stock_bajo: inventarioValorizado.filter(p => p.stock_bajo).length
      };

      res.json({
        productos: inventarioValorizado,
        totales
      });
    } catch (error) {
      console.error("Error en getInventarioValorizado:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = inventarioKardexController;
