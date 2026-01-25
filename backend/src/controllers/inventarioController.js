const {
  Producto,
  MovimientoInventario,
  Local,
  Categoria,
} = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

const inventarioController = {
  // Obtener inventario consolidado (ambos locales)
  getInventarioConsolidado: async (req, res) => {
    try {
      const productos = await Producto.findAll({
        where: { activo: true },
        include: [{ model: Categoria, as: "categoria" }],
        order: [["nombre", "ASC"]],
      });

      // Calcular totales
      const resumen = {
        total_productos: productos.length,
        total_stock_local1: productos.reduce(
          (sum, p) => sum + (p.stock_local1 || 0),
          0,
        ),
        total_stock_local2: productos.reduce(
          (sum, p) => sum + (p.stock_local2 || 0),
          0,
        ),
        productos_stock_bajo: productos.filter(
          (p) => p.stock_local1 + p.stock_local2 <= p.alerta_stock,
        ).length,
        valor_inventario_local1: productos.reduce(
          (sum, p) =>
            sum + (p.stock_local1 || 0) * parseFloat(p.precio_venta || 0),
          0,
        ),
        valor_inventario_local2: productos.reduce(
          (sum, p) =>
            sum + (p.stock_local2 || 0) * parseFloat(p.precio_venta || 0),
          0,
        ),
      };

      res.json({ productos, resumen });
    } catch (error) {
      console.error("Error en getInventarioConsolidado:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener inventario por local
  getInventarioPorLocal: async (req, res) => {
    try {
      const { local_id } = req.params;
      const stockField = local_id === "1" ? "stock_local1" : "stock_local2";

      const productos = await Producto.findAll({
        where: { activo: true },
        include: [{ model: Categoria, as: "categoria" }],
        order: [["nombre", "ASC"]],
      });

      const productosConStock = productos.map((p) => ({
        ...p.toJSON(),
        stock_actual: local_id === "1" ? p.stock_local1 : p.stock_local2,
        stock_bajo:
          (local_id === "1" ? p.stock_local1 : p.stock_local2) <=
          p.alerta_stock,
      }));

      res.json(productosConStock);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener productos con stock bajo
  getStockBajo: async (req, res) => {
    try {
      const productos = await Producto.findAll({
        where: { activo: true },
        include: [{ model: Categoria, as: "categoria" }],
        order: [["nombre", "ASC"]],
      });

      const productosBajos = productos
        .filter((p) => {
          const stockTotal = (p.stock_local1 || 0) + (p.stock_local2 || 0);
          return stockTotal <= p.alerta_stock;
        })
        .map((p) => ({
          ...p.toJSON(),
          stock_total: (p.stock_local1 || 0) + (p.stock_local2 || 0),
          diferencia:
            p.alerta_stock - ((p.stock_local1 || 0) + (p.stock_local2 || 0)),
        }));

      res.json(productosBajos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Ajustar inventario manualmente
  ajustarInventario: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { producto_id, local, cantidad_nueva, motivo } = req.body;
      const usuario_id = req.usuario.id;

      const producto = await Producto.findByPk(producto_id);
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockField = local === 1 ? "stock_local1" : "stock_local2";
      const stockAnterior = producto[stockField];
      const diferencia = cantidad_nueva - stockAnterior;

      // Actualizar stock
      await producto.update(
        {
          [stockField]: cantidad_nueva,
        },
        { transaction: t },
      );

      // Registrar movimiento
      await MovimientoInventario.create(
        {
          producto_id,
          local_id:
            local === 1
              ? "00000000-0000-0000-0000-000000000001"
              : "00000000-0000-0000-0000-000000000002",
          tipo: "ajuste",
          cantidad: diferencia,
          stock_anterior: stockAnterior,
          stock_nuevo: cantidad_nueva,
          motivo: motivo || "Ajuste manual de inventario",
          usuario_id,
        },
        { transaction: t },
      );

      await t.commit();

      res.json({
        mensaje: "Inventario ajustado correctamente",
        producto: await Producto.findByPk(producto_id, {
          include: [{ model: Categoria, as: "categoria" }],
        }),
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en ajustarInventario:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Registrar entrada de inventario (compra)
  registrarEntrada: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { producto_id, local, cantidad, motivo } = req.body;
      const usuario_id = req.usuario.id;

      const producto = await Producto.findByPk(producto_id);
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockField = local === 1 ? "stock_local1" : "stock_local2";
      const stockAnterior = producto[stockField];
      const stockNuevo = stockAnterior + cantidad;

      await producto.update(
        {
          [stockField]: stockNuevo,
        },
        { transaction: t },
      );

      await MovimientoInventario.create(
        {
          producto_id,
          local_id:
            local === 1
              ? "00000000-0000-0000-0000-000000000001"
              : "00000000-0000-0000-0000-000000000002",
          tipo: "entrada",
          cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          motivo: motivo || "Entrada de inventario",
          usuario_id,
        },
        { transaction: t },
      );

      await t.commit();

      res.json({
        mensaje: "Entrada registrada correctamente",
        producto: await Producto.findByPk(producto_id, {
          include: [{ model: Categoria, as: "categoria" }],
        }),
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // ⭐ Transferir entre locales
  transferirEntreLocales: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { producto_id, local_origen, local_destino, cantidad, motivo } =
        req.body;
      const usuario_id = req.usuario.id;

      // Validaciones
      if (local_origen === local_destino) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "El local de origen y destino deben ser diferentes" });
      }

      if (cantidad <= 0) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "La cantidad debe ser mayor a 0" });
      }

      const producto = await Producto.findByPk(producto_id);
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const stockFieldOrigen =
        local_origen === 1 ? "stock_local1" : "stock_local2";
      const stockFieldDestino =
        local_destino === 1 ? "stock_local1" : "stock_local2";

      const stockOrigen = producto[stockFieldOrigen];
      const stockDestino = producto[stockFieldDestino];

      // Verificar que hay stock suficiente en origen
      if (stockOrigen < cantidad) {
        await t.rollback();
        return res.status(400).json({
          error: `Stock insuficiente en Local ${local_origen}. Disponible: ${stockOrigen}, Solicitado: ${cantidad}`,
        });
      }

      // Actualizar stocks
      await producto.update(
        {
          [stockFieldOrigen]: stockOrigen - cantidad,
          [stockFieldDestino]: stockDestino + cantidad,
        },
        { transaction: t },
      );

      const localIdOrigen =
        local_origen === 1
          ? "00000000-0000-0000-0000-000000000001"
          : "00000000-0000-0000-0000-000000000002";
      const localIdDestino =
        local_destino === 1
          ? "00000000-0000-0000-0000-000000000001"
          : "00000000-0000-0000-0000-000000000002";

      // Registrar salida del local origen
      await MovimientoInventario.create(
        {
          producto_id,
          local_id: localIdOrigen,
          tipo: "transferencia_salida",
          cantidad: -cantidad,
          stock_anterior: stockOrigen,
          stock_nuevo: stockOrigen - cantidad,
          motivo: motivo || `Transferencia a Local ${local_destino}`,
          usuario_id,
        },
        { transaction: t },
      );

      // Registrar entrada al local destino
      await MovimientoInventario.create(
        {
          producto_id,
          local_id: localIdDestino,
          tipo: "transferencia_entrada",
          cantidad: cantidad,
          stock_anterior: stockDestino,
          stock_nuevo: stockDestino + cantidad,
          motivo: motivo || `Transferencia desde Local ${local_origen}`,
          usuario_id,
        },
        { transaction: t },
      );

      await t.commit();

      res.json({
        mensaje: `Transferencia completada: ${cantidad} unidades de Local ${local_origen} a Local ${local_destino}`,
        producto: await Producto.findByPk(producto_id, {
          include: [{ model: Categoria, as: "categoria" }],
        }),
      });
    } catch (error) {
      await t.rollback();
      console.error("Error en transferirEntreLocales:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener historial de movimientos
  getMovimientos: async (req, res) => {
    try {
      const {
        producto_id,
        local_id,
        tipo,
        fecha_inicio,
        fecha_fin,
        limit = 50,
      } = req.query;

      const where = {};
      if (producto_id) where.producto_id = producto_id;
      if (local_id) where.local_id = local_id;
      if (tipo) where.tipo = tipo;
      if (fecha_inicio && fecha_fin) {
        where.created_at = {
          [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
        };
      }

      const movimientos = await MovimientoInventario.findAll({
        where,
        include: [
          { model: Producto, as: "producto", attributes: ["id", "nombre"] },
          { model: Local, as: "local", attributes: ["id", "nombre"] },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
      });

      res.json(movimientos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener movimientos de un producto específico
  getMovimientosProducto: async (req, res) => {
    try {
      const { producto_id } = req.params;

      const movimientos = await MovimientoInventario.findAll({
        where: { producto_id },
        include: [{ model: Local, as: "local", attributes: ["id", "nombre"] }],
        order: [["created_at", "DESC"]],
        limit: 100,
      });

      res.json(movimientos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = inventarioController;