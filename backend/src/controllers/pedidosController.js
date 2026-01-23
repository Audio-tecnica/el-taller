const {
  Pedido,
  ItemPedido,
  Mesa,
  Producto,
  Local,
  Usuario,
  Categoria,
} = require("../models");
const sequelize = require("../config/database");

const pedidosController = {
  // Abrir pedido en una mesa
  abrirPedido: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { mesa_id } = req.body;
      const usuario_id = req.usuario.id;

      const mesa = await Mesa.findByPk(mesa_id);
      if (!mesa) {
        await t.rollback();
        return res.status(404).json({ error: "Mesa no encontrada" });
      }

      const pedidoExistente = await Pedido.findOne({
        where: { mesa_id, estado: "abierto" },
      });

      if (pedidoExistente) {
        await t.rollback();
        return res.status(400).json({
          error: "La mesa ya tiene un pedido abierto",
          pedido_id: pedidoExistente.id,
        });
      }

      const pedido = await Pedido.create(
        {
          mesa_id,
          local_id: mesa.local_id,
          usuario_id,
          estado: "abierto",
          subtotal: 0,
        },
        { transaction: t }
      );

      await mesa.update({ estado: "ocupada" }, { transaction: t });
      await t.commit();

      const pedidoCompleto = await Pedido.findByPk(pedido.id, {
        include: [
          { model: Mesa, as: "mesa" },
          { model: Local, as: "local" },
          {
            model: ItemPedido,
            as: "items",
            include: [{ model: Producto, as: "producto" }],
          },
        ],
      });

      res.status(201).json(pedidoCompleto);
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener pedido activo de una mesa
  getPedidoMesa: async (req, res) => {
    try {
      const { mesa_id } = req.params;

      const pedido = await Pedido.findOne({
        where: { mesa_id, estado: "abierto" },
        include: [
          { model: Mesa, as: "mesa", include: [{ model: Local, as: "local" }] },
          {
            model: ItemPedido,
            as: "items",
            include: [
              {
                model: Producto,
                as: "producto",
                include: [{ model: Categoria, as: "categoria" }],
              },
            ],
          },
        ],
      });

      if (!pedido) {
        return res.status(404).json({ error: "No hay pedido abierto en esta mesa" });
      }

      res.json(pedido);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Agregar item al pedido
  agregarItem: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { pedido_id } = req.params;
      const { producto_id, cantidad, notas } = req.body;

      const pedido = await Pedido.findByPk(pedido_id);
      if (!pedido || pedido.estado !== "abierto") {
        await t.rollback();
        return res.status(400).json({ error: "Pedido no válido o cerrado" });
      }

      const producto = await Producto.findByPk(producto_id);
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      let item = await ItemPedido.findOne({
        where: { pedido_id, producto_id },
      });

      if (item) {
        const nuevaCantidad = item.cantidad + cantidad;
        const nuevoSubtotal = nuevaCantidad * parseFloat(producto.precio_venta);
        await item.update(
          { cantidad: nuevaCantidad, subtotal: nuevoSubtotal },
          { transaction: t }
        );
      } else {
        const subtotalItem = cantidad * parseFloat(producto.precio_venta);
        item = await ItemPedido.create(
          {
            pedido_id,
            producto_id,
            cantidad,
            precio_unitario: producto.precio_venta,
            subtotal: subtotalItem,
            notas,
          },
          { transaction: t }
        );
      }

      const items = await ItemPedido.findAll({
        where: { pedido_id },
        transaction: t,
      });
      const nuevoSubtotal = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
      await pedido.update({ subtotal: nuevoSubtotal }, { transaction: t });

      await t.commit();

      const pedidoActualizado = await Pedido.findByPk(pedido_id, {
        include: [
          { model: Mesa, as: "mesa" },
          {
            model: ItemPedido,
            as: "items",
            include: [
              {
                model: Producto,
                as: "producto",
                include: [{ model: Categoria, as: "categoria" }],
              },
            ],
          },
        ],
      });

      res.json(pedidoActualizado);
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Quitar item del pedido
  quitarItem: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { pedido_id, item_id } = req.params;
      const { cantidad } = req.body;

      const pedido = await Pedido.findByPk(pedido_id);
      if (!pedido || pedido.estado !== "abierto") {
        await t.rollback();
        return res.status(400).json({ error: "Pedido no válido o cerrado" });
      }

      const item = await ItemPedido.findByPk(item_id);
      if (!item || item.pedido_id !== pedido_id) {
        await t.rollback();
        return res.status(404).json({ error: "Item no encontrado" });
      }

      const cantidadQuitar = cantidad || item.cantidad;

      if (cantidadQuitar >= item.cantidad) {
        await item.destroy({ transaction: t });
      } else {
        const nuevaCantidad = item.cantidad - cantidadQuitar;
        const nuevoSubtotal = nuevaCantidad * parseFloat(item.precio_unitario);
        await item.update(
          { cantidad: nuevaCantidad, subtotal: nuevoSubtotal },
          { transaction: t }
        );
      }

      const items = await ItemPedido.findAll({
        where: { pedido_id },
        transaction: t,
      });
      const nuevoSubtotal = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
      await pedido.update({ subtotal: nuevoSubtotal }, { transaction: t });

      await t.commit();

      const pedidoActualizado = await Pedido.findByPk(pedido_id, {
        include: [
          { model: Mesa, as: "mesa" },
          {
            model: ItemPedido,
            as: "items",
            include: [
              {
                model: Producto,
                as: "producto",
                include: [{ model: Categoria, as: "categoria" }],
              },
            ],
          },
        ],
      });

      res.json(pedidoActualizado);
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Cerrar pedido (cobrar)
  cerrarPedido: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { pedido_id } = req.params;
      const { metodo_pago, monto_cortesia, razon_cortesia, descripcion_cortesia } = req.body;
      const usuario_id = req.usuario.id;

      const pedido = await Pedido.findByPk(pedido_id, {
        include: [{ model: Mesa, as: "mesa" }],
      });

      if (!pedido || pedido.estado !== "abierto") {
        await t.rollback();
        return res.status(400).json({ error: "Pedido no válido o ya cerrado" });
      }

      const subtotal = parseFloat(pedido.subtotal);
      const cortesia = parseFloat(monto_cortesia) || 0;
      const totalFinal = Math.max(0, subtotal - cortesia);

      await pedido.update(
        {
          estado: "cerrado",
          metodo_pago,
          tiene_cortesia: cortesia > 0,
          monto_cortesia: cortesia,
          razon_cortesia: razon_cortesia || null,
          total_final: totalFinal,
          closed_at: new Date(),
        },
        { transaction: t }
      );

      if (cortesia > 0) {
        const { Cortesia } = require("../models");
        await Cortesia.create(
          {
            tipo: cortesia >= subtotal ? "total" : "parcial",
            pedido_id: pedido.id,
            monto_cortesia: cortesia,
            razon: razon_cortesia || "Sin especificar",
            descripcion: descripcion_cortesia || null,
            autorizado_por_usuario_id: usuario_id,
            local_id: pedido.local_id,
          },
          { transaction: t }
        );
      }

      if (pedido.mesa_id) {
        await Mesa.update(
          { estado: "disponible" },
          { where: { id: pedido.mesa_id }, transaction: t }
        );
      }

      await t.commit();

      res.json({
        message: "Pedido cerrado exitosamente",
        subtotal,
        cortesia,
        total_final: totalFinal,
        metodo_pago,
      });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Cancelar pedido
  cancelarPedido: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { pedido_id } = req.params;

      const pedido = await Pedido.findByPk(pedido_id, {
        include: [{ model: Mesa, as: "mesa" }],
      });

      if (!pedido || pedido.estado !== "abierto") {
        await t.rollback();
        return res.status(400).json({ error: "Pedido no válido o ya cerrado" });
      }

      await pedido.update(
        {
          estado: "cancelado",
          closed_at: new Date(),
        },
        { transaction: t }
      );

      if (pedido.mesa_id) {
        await Mesa.update(
          { estado: "disponible" },
          { where: { id: pedido.mesa_id }, transaction: t }
        );
      }

      await t.commit();

      res.json({ message: "Pedido cancelado" });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todos los pedidos abiertos
  getPedidosAbiertos: async (req, res) => {
    try {
      const { local_id } = req.query;
      const where = { estado: "abierto" };
      if (local_id) where.local_id = local_id;

      const pedidos = await Pedido.findAll({
        where,
        include: [
          { model: Mesa, as: "mesa" },
          { model: Local, as: "local" },
          {
            model: ItemPedido,
            as: "items",
            include: [{ model: Producto, as: "producto" }],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      res.json(pedidos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = pedidosController;