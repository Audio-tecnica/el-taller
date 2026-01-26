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

// =======================================================
// HELPER: determina campo de stock según local
// =======================================================
const getStockField = (localId) => {
  return localId === "00000000-0000-0000-0000-000000000001"
    ? "stock_local1"
    : "stock_local2";
};

const inventarioKardexController = {

  // =====================================================
  // COMPRAS
  // =====================================================
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

      const proveedor = await Proveedor.findByPk(proveedor_id, { transaction: t });
      if (!proveedor) {
        await t.rollback();
        return res.status(404).json({ error: "Proveedor no encontrado" });
      }

      const anio = new Date().getFullYear();
      const ultimaCompra = await Compra.findOne({
        where: { numero_compra: { [Op.like]: `COM-${anio}-%` } },
        order: [["numero_compra", "DESC"]],
        transaction: t
      });

      let contador = 1;
      if (ultimaCompra) {
        contador = parseInt(ultimaCompra.numero_compra.split("-")[2]) + 1;
      }

      const numero_compra = `COM-${anio}-${String(contador).padStart(5, "0")}`;

      let subtotal = 0;
      const movimientos = [];
      const stockField = getStockField(local_id);

      for (const item of productos) {
        const producto = await Producto.findByPk(item.producto_id, { transaction: t });
        if (!producto) {
          await t.rollback();
          return res.status(404).json({ error: "Producto no encontrado" });
        }

        const stockAnterior = producto[stockField] || 0;
        const stockNuevo = stockAnterior + item.cantidad;
        const costoTotal = item.cantidad * item.costo_unitario;

        subtotal += costoTotal;

        await producto.update(
          {
            [stockField]: stockNuevo,
            ultimo_costo: item.costo_unitario
          },
          { transaction: t }
        );

        if (item.precio_venta) {
          await producto.update(
            { precio_venta: item.precio_venta },
            { transaction: t }
          );
        }

        const movimiento = await MovimientoInventario.create(
          {
            producto_id: producto.id,
            local_id,
            tipo: "compra",
            cantidad: item.cantidad,
            stock_anterior: stockAnterior,
            stock_nuevo: stockNuevo,
            costo_unitario: item.costo_unitario,
            costo_total: costoTotal,
            proveedor_id,
            numero_factura,
            fecha_factura,
            motivo: `Compra a ${proveedor.nombre}`,
            observaciones,
            usuario_id
          },
          { transaction: t }
        );

        movimientos.push(movimiento);
      }

      const compra = await Compra.create(
        {
          numero_compra,
          proveedor_id,
          local_id,
          numero_factura,
          fecha_factura,
          subtotal,
          total: subtotal,
          estado: "recibida",
          observaciones,
          usuario_id
        },
        { transaction: t }
      );

      await t.commit();

      res.json({
        mensaje: "Compra registrada exitosamente",
        compra,
        movimientos: movimientos.length
      });
    } catch (error) {
      await t.rollback();
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },

  // =====================================================
  // DEVOLUCIÓN A PROVEEDOR
  // =====================================================
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
      if (!producto) throw new Error("Producto no encontrado");

      const stockField = getStockField(local_id);
      const stockAnterior = producto[stockField];

      if (stockAnterior < cantidad) {
        throw new Error("Stock insuficiente");
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
          tipo: "devolucion_proveedor",
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
      res.json({ mensaje: "Devolución registrada", movimiento });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // =====================================================
  // AJUSTE DE INVENTARIO
  // =====================================================
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
      if (!producto) throw new Error("Producto no encontrado");

      const stockField = getStockField(local_id);
      const stockAnterior = producto[stockField];
      const diferencia = cantidad_contada - stockAnterior;

      if (diferencia === 0) {
        throw new Error("No hay diferencia de stock");
      }

      await producto.update(
        { [stockField]: cantidad_contada },
        { transaction: t }
      );

      const movimiento = await MovimientoInventario.create(
        {
          producto_id,
          local_id,
          tipo: diferencia > 0 ? "ajuste_positivo" : "ajuste_negativo",
          cantidad: diferencia,
          stock_anterior: stockAnterior,
          stock_nuevo: cantidad_contada,
          motivo,
          observaciones,
          usuario_id,
          autorizado_por
        },
        { transaction: t }
      );

      await t.commit();
      res.json({ mensaje: "Ajuste registrado", movimiento });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // =====================================================
  // MERMAS
  // =====================================================
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
      if (!producto) throw new Error("Producto no encontrado");

      const stockField = getStockField(local_id);
      const stockAnterior = producto[stockField];

      if (stockAnterior < cantidad) throw new Error("Stock insuficiente");

      const stockNuevo = stockAnterior - cantidad;

      await producto.update(
        { [stockField]: stockNuevo },
        { transaction: t }
      );

      const movimiento = await MovimientoInventario.create(
        {
          producto_id,
          local_id,
          tipo: "merma",
          cantidad: -cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          costo_unitario: producto.costo_promedio,
          costo_total: cantidad * producto.costo_promedio,
          motivo,
          observaciones,
          usuario_id,
          autorizado_por
        },
        { transaction: t }
      );

      await t.commit();
      res.json({ mensaje: "Merma registrada", movimiento });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // =====================================================
  // TRANSFERENCIAS ENTRE LOCALES
  // =====================================================
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
        throw new Error("Los locales deben ser diferentes");
      }

      const producto = await Producto.findByPk(producto_id, { transaction: t });
      if (!producto) throw new Error("Producto no encontrado");

      const stockOrigenField = getStockField(local_origen_id);
      const stockDestinoField = getStockField(local_destino_id);

      const stockOrigen = producto[stockOrigenField];
      const stockDestino = producto[stockDestinoField];

      if (stockOrigen < cantidad) throw new Error("Stock insuficiente en origen");

      await producto.update(
        {
          [stockOrigenField]: stockOrigen - cantidad,
          [stockDestinoField]: stockDestino + cantidad
        },
        { transaction: t }
      );

      const salida = await MovimientoInventario.create(
        {
          producto_id,
          local_id: local_origen_id,
          tipo: "salida_transferencia",
          cantidad: -cantidad,
          stock_anterior: stockOrigen,
          stock_nuevo: stockOrigen - cantidad,
          local_origen_id,
          local_destino_id,
          costo_unitario: producto.costo_promedio,
          costo_total: cantidad * producto.costo_promedio,
          motivo,
          observaciones,
          usuario_id
        },
        { transaction: t }
      );

      const entrada = await MovimientoInventario.create(
        {
          producto_id,
          local_id: local_destino_id,
          tipo: "entrada_transferencia",
          cantidad,
          stock_anterior: stockDestino,
          stock_nuevo: stockDestino + cantidad,
          local_origen_id,
          local_destino_id,
          movimiento_relacionado_id: salida.id,
          costo_unitario: producto.costo_promedio,
          costo_total: cantidad * producto.costo_promedio,
          motivo,
          observaciones,
          usuario_id
        },
        { transaction: t }
      );

      await salida.update(
        { movimiento_relacionado_id: entrada.id },
        { transaction: t }
      );

      await t.commit();
      res.json({ mensaje: "Transferencia completada", salida, entrada });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = inventarioKardexController;
