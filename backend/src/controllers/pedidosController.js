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
const { MovimientoInventario } = require("../models");

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
        { transaction: t },
      );

      await mesa.update({ estado: "ocupada" }, { transaction: t });
      await t.commit();

      const pedidoCompleto = await Pedido.findByPk(pedido.id, {
        include: [
          { model: Mesa, as: "mesa" },
          { model: Local, as: "local" },
          { model: ItemPedido, as: "items", include: [{ model: Producto, as: "producto" }] },
        ],
      });

      // 📌 SOCKET: Emitir mesa actualizada
      const io = req.app.get('io');
      if (io) {
        const mesaActualizada = await Mesa.findByPk(mesa_id, { include: [{ model: Local, as: 'local' }] });
        io.emit('mesa_actualizada', { mesa: mesaActualizada, accion: 'pedido_abierto' });
      }

      res.status(201).json(pedidoCompleto);
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error("Error en abrirPedido:", error);
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
          { model: ItemPedido, as: "items", include: [{ model: Producto, as: "producto", include: [{ model: Categoria, as: "categoria" }] }] },
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

      const pedido = await Pedido.findByPk(pedido_id, { include: [{ model: Mesa, as: 'mesa' }] });
      if (!pedido || pedido.estado !== "abierto") {
        await t.rollback();
        return res.status(400).json({ error: "Pedido no válido o cerrado" });
      }

      const producto = await Producto.findByPk(producto_id, { include: [{ model: Categoria, as: 'categoria' }] });
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      // Obtener información del local
      const local = await Local.findByPk(pedido.local_id);
      const localNum = local?.numero || 1;
      const stockKey = `stock_local${localNum}`;

      // ⭐ GESTIÓN DE INVENTARIO SEGÚN TIPO DE PRODUCTO
      if (producto.unidad_medida === 'barriles') {
        // LÓGICA PARA BARRILES
        const vasosKey = `vasos_disponibles_local${localNum}`;
        const barrilActivoKey = `barril_activo_local${localNum}`;
        
        if (!producto[barrilActivoKey]) {
          await t.rollback();
          return res.status(400).json({ error: `No hay barril activo de ${producto.nombre}` });
        }
        if (producto[vasosKey] < cantidad) {
          await t.rollback();
          return res.status(400).json({ 
            error: `Solo quedan ${producto[vasosKey]} vasos`, 
            vasos_disponibles: producto[vasosKey] 
          });
        }
        
        // Descontar vasos del barril activo
        await producto.update({ 
          [vasosKey]: producto[vasosKey] - cantidad 
        }, { transaction: t });
        
      } else {
        // ⭐ LÓGICA PARA PRODUCTOS NORMALES (BOTELLAS, LATAS, ETC)
        
        // Verificar si hay stock disponible
        const stockDisponible = producto[stockKey] || 0;
        
        if (stockDisponible < cantidad) {
          await t.rollback();
          return res.status(400).json({ 
            error: `Stock insuficiente. Solo quedan ${stockDisponible} unidades de ${producto.nombre}`,
            stock_disponible: stockDisponible
          });
        }
        
        // Descontar del inventario
        const nuevoStock = stockDisponible - cantidad;
        await producto.update({ 
          [stockKey]: nuevoStock 
        }, { transaction: t });
        
        // ⭐ Registrar movimiento de inventario (si existe el modelo)
        try {
          await MovimientoInventario.create({
            producto_id: producto.id,
            local_id: pedido.local_id,
            tipo: 'venta',
            cantidad: -cantidad, // Negativo porque es una salida
            stock_anterior: stockDisponible,
            stock_nuevo: nuevoStock,
            motivo: `Venta en pedido ${pedido_id}`,
            pedido_id: pedido_id,
            usuario_id: pedido.usuario_id
          }, { transaction: t });
        } catch (err) {
          // Si el modelo MovimientoInventario no existe, continuar sin error
          console.log('⚠️ Modelo MovimientoInventario no disponible:', err.message);
        }
      }

      // Buscar o crear el item en el pedido
      let item = await ItemPedido.findOne({ where: { pedido_id, producto_id } });

      if (item) {
        const nuevaCantidad = item.cantidad + cantidad;
        await item.update({ 
          cantidad: nuevaCantidad, 
          subtotal: nuevaCantidad * parseFloat(producto.precio_venta) 
        }, { transaction: t });
      } else {
        item = await ItemPedido.create({
          pedido_id, 
          producto_id, 
          cantidad,
          precio_unitario: producto.precio_venta,
          subtotal: cantidad * parseFloat(producto.precio_venta),
          notas,
        }, { transaction: t });
      }

      // Actualizar subtotal del pedido
      const items = await ItemPedido.findAll({ where: { pedido_id }, transaction: t });
      const nuevoSubtotal = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
      await pedido.update({ subtotal: nuevoSubtotal }, { transaction: t });

      await t.commit();

      // Obtener pedido actualizado
      const pedidoActualizado = await Pedido.findByPk(pedido_id, {
        include: [
          { model: Mesa, as: "mesa" },
          { model: ItemPedido, as: "items", include: [{ model: Producto, as: "producto", include: [{ model: Categoria, as: "categoria" }] }] },
        ],
      });

      // 📌 SOCKET: Emitir actualizaciones
      const io = req.app.get('io');
      if (io) {
        io.emit('pedido_actualizado', { pedido: pedidoActualizado, accion: 'item_agregado' });
        
        // Emitir actualización de producto (para reflejar cambio de stock)
        const prodActualizado = await Producto.findByPk(producto_id, { 
          include: [{ model: Categoria, as: 'categoria' }] 
        });
        
        if (producto.unidad_medida === 'barriles') {
          io.emit('barril_actualizado', { tipo: 'venta', producto: prodActualizado });
        } else {
          io.emit('producto_actualizado', { tipo: 'venta', producto: prodActualizado });
        }
      }

      res.json(pedidoActualizado);
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error('Error en agregarItem:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Quitar item del pedido
  quitarItem: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { pedido_id, item_id } = req.params;
      const { cantidad } = req.body;

      const pedido = await Pedido.findByPk(pedido_id, { include: [{ model: Mesa, as: 'mesa' }] });
      if (!pedido || pedido.estado !== "abierto") {
        await t.rollback();
        return res.status(400).json({ error: "Pedido no válido o cerrado" });
      }

      const item = await ItemPedido.findByPk(item_id, {
        include: [{ model: Producto, as: 'producto' }]
      });
      
      if (!item || item.pedido_id !== pedido_id) {
        await t.rollback();
        return res.status(404).json({ error: "Item no encontrado" });
      }

      const producto = item.producto;
      const cantidadQuitar = cantidad || item.cantidad;
      
      // ⭐ DEVOLVER INVENTARIO AL QUITAR ITEMS
      const local = await Local.findByPk(pedido.local_id);
      const localNum = local?.numero || 1;
      const stockKey = `stock_local${localNum}`;
      
      if (producto.unidad_medida === 'barriles') {
        // DEVOLVER VASOS AL BARRIL
        const vasosKey = `vasos_disponibles_local${localNum}`;
        const vasosActuales = producto[vasosKey] || 0;
        
        await producto.update({ 
          [vasosKey]: vasosActuales + cantidadQuitar 
        }, { transaction: t });
        
      } else {
        // ⭐ DEVOLVER STOCK DE PRODUCTOS NORMALES
        const stockActual = producto[stockKey] || 0;
        const nuevoStock = stockActual + cantidadQuitar;
        
        await producto.update({ 
          [stockKey]: nuevoStock 
        }, { transaction: t });
        
        // Registrar movimiento de devolución
        try {
          await MovimientoInventario.create({
            producto_id: producto.id,
            local_id: pedido.local_id,
            tipo: 'devolucion',
            cantidad: cantidadQuitar, // Positivo porque es una entrada
            stock_anterior: stockActual,
            stock_nuevo: nuevoStock,
            motivo: `Devolución de pedido ${pedido_id} (item quitado)`,
            pedido_id: pedido_id,
            usuario_id: pedido.usuario_id
          }, { transaction: t });
        } catch (err) {
          console.log('⚠️ Modelo MovimientoInventario no disponible:', err.message);
        }
      }

      // Actualizar o eliminar el item
      if (cantidadQuitar >= item.cantidad) {
        await item.destroy({ transaction: t });
      } else {
        const nuevaCantidad = item.cantidad - cantidadQuitar;
        await item.update({ 
          cantidad: nuevaCantidad, 
          subtotal: nuevaCantidad * parseFloat(item.precio_unitario) 
        }, { transaction: t });
      }

      // Actualizar subtotal del pedido
      const items = await ItemPedido.findAll({ where: { pedido_id }, transaction: t });
      const nuevoSubtotal = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
      await pedido.update({ subtotal: nuevoSubtotal }, { transaction: t });

      await t.commit();

      const pedidoActualizado = await Pedido.findByPk(pedido_id, {
        include: [
          { model: Mesa, as: "mesa" },
          { model: ItemPedido, as: "items", include: [{ model: Producto, as: "producto", include: [{ model: Categoria, as: "categoria" }] }] },
        ],
      });

      // 📌 SOCKET: Emitir actualizaciones
      const io = req.app.get('io');
      if (io) {
        io.emit('pedido_actualizado', { pedido: pedidoActualizado, accion: 'item_quitado' });
        
        const prodActualizado = await Producto.findByPk(producto.id, { 
          include: [{ model: Categoria, as: 'categoria' }] 
        });
        
        if (producto.unidad_medida === 'barriles') {
          io.emit('barril_actualizado', { tipo: 'devolucion', producto: prodActualizado });
        } else {
          io.emit('producto_actualizado', { tipo: 'devolucion', producto: prodActualizado });
        }
      }

      res.json(pedidoActualizado);
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error('Error en quitarItem:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ⭐ NUEVO: Cambiar mesa de un pedido
  cambiarMesa: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { pedido_id } = req.params;
      const { nueva_mesa_id } = req.body;

      // 1. Validar que el pedido exista y esté abierto
      const pedido = await Pedido.findByPk(pedido_id, {
        include: [{ model: Mesa, as: "mesa" }],
      });

      if (!pedido || pedido.estado !== "abierto") {
        await t.rollback();
        return res.status(400).json({ 
          error: "Pedido no válido o ya cerrado" 
        });
      }

      const mesaOrigenId = pedido.mesa_id;
      const mesaOrigen = pedido.mesa;

      // 2. Validar que la nueva mesa exista y esté disponible
      const mesaDestino = await Mesa.findByPk(nueva_mesa_id);

      if (!mesaDestino) {
        await t.rollback();
        return res.status(404).json({ 
          error: "Mesa de destino no encontrada" 
        });
      }

      if (mesaDestino.estado !== "disponible") {
        await t.rollback();
        return res.status(400).json({ 
          error: "La mesa de destino no está disponible" 
        });
      }

      // 3. Validar que estén en el mismo local
      if (mesaOrigen.local_id !== mesaDestino.local_id) {
        await t.rollback();
        return res.status(400).json({ 
          error: "No se puede cambiar a una mesa de otro local" 
        });
      }

      // 4. Realizar el cambio
      // Actualizar pedido con nueva mesa
      await pedido.update({ mesa_id: nueva_mesa_id }, { transaction: t });

      // Liberar mesa origen
      await Mesa.update(
        { estado: "disponible" },
        { where: { id: mesaOrigenId }, transaction: t }
      );

      // Ocupar mesa destino
      await Mesa.update(
        { estado: "ocupada" },
        { where: { id: nueva_mesa_id }, transaction: t }
      );

      await t.commit();

      // 📌 SOCKET: Emitir cambios en ambas mesas
      const io = req.app.get('io');
      if (io) {
        const mesaOrigenActualizada = await Mesa.findByPk(mesaOrigenId, { 
          include: [{ model: Local, as: 'local' }] 
        });
        const mesaDestinoActualizada = await Mesa.findByPk(nueva_mesa_id, { 
          include: [{ model: Local, as: 'local' }] 
        });
        
        io.emit('mesa_actualizada', { 
          mesa: mesaOrigenActualizada, 
          accion: 'pedido_movido' 
        });
        io.emit('mesa_actualizada', { 
          mesa: mesaDestinoActualizada, 
          accion: 'pedido_recibido' 
        });
      }

      res.json({
        mensaje: "Mesa cambiada exitosamente",
        pedido_id: pedido.id,
        mesa_origen: mesaOrigen.numero,
        mesa_destino: mesaDestino.numero,
      });

    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error("Error cambiando mesa:", error);
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

      const pedido = await Pedido.findByPk(pedido_id, { include: [{ model: Mesa, as: "mesa" }] });
      if (!pedido || pedido.estado !== "abierto") {
        await t.rollback();
        return res.status(400).json({ error: "Pedido no válido o ya cerrado" });
      }

      const subtotal = parseFloat(pedido.subtotal);
      const cortesia = parseFloat(monto_cortesia) || 0;
      const totalFinal = Math.max(0, subtotal - cortesia);

      await pedido.update({
        estado: "cerrado", metodo_pago,
        tiene_cortesia: cortesia > 0, monto_cortesia: cortesia,
        razon_cortesia: razon_cortesia || null,
        total_final: totalFinal, closed_at: new Date(),
      }, { transaction: t });

      if (cortesia > 0) {
        const { Cortesia } = require("../models");
        await Cortesia.create({
          tipo: cortesia >= subtotal ? "total" : "parcial",
          pedido_id: pedido.id, monto_cortesia: cortesia,
          razon: razon_cortesia || "Sin especificar",
          descripcion: descripcion_cortesia || null,
          autorizado_por_usuario_id: usuario_id, local_id: pedido.local_id,
        }, { transaction: t });
      }

      if (pedido.mesa_id) {
        await Mesa.update({ estado: "disponible" }, { where: { id: pedido.mesa_id }, transaction: t });
      }

      await t.commit();

      // 📌 SOCKET: Emitir mesa disponible
      const io = req.app.get('io');
      if (io && pedido.mesa_id) {
        const mesaActualizada = await Mesa.findByPk(pedido.mesa_id, { include: [{ model: Local, as: 'local' }] });
        io.emit('mesa_actualizada', { mesa: mesaActualizada, accion: 'pedido_cerrado' });
        io.emit('pedido_cerrado', { pedido_id, mesa_id: pedido.mesa_id, total_final: totalFinal });
      }

      res.json({ message: "Pedido cerrado exitosamente", subtotal, cortesia, total_final: totalFinal, metodo_pago });
    } catch (error) {
      if (!t.finished) await t.rollback();
      res.status(500).json({ error: error.message });
    }
  },

  // Cancelar pedido
  cancelarPedido: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { pedido_id } = req.params;
      const pedido = await Pedido.findByPk(pedido_id, { 
        include: [
          { model: Mesa, as: "mesa" },
          { model: ItemPedido, as: "items", include: [{ model: Producto, as: "producto" }] }
        ] 
      });

      if (!pedido || pedido.estado !== "abierto") {
        await t.rollback();
        return res.status(400).json({ error: "Pedido no válido o ya cerrado" });
      }

      // ⭐ DEVOLVER INVENTARIO AL CANCELAR PEDIDO
      const local = await Local.findByPk(pedido.local_id);
      const localNum = local?.numero || 1;
      const stockKey = `stock_local${localNum}`;
      
      for (const item of pedido.items) {
        const producto = item.producto;
        
        if (producto.unidad_medida === 'barriles') {
          // Devolver vasos al barril
          const vasosKey = `vasos_disponibles_local${localNum}`;
          const vasosActuales = producto[vasosKey] || 0;
          
          await producto.update({ 
            [vasosKey]: vasosActuales + item.cantidad 
          }, { transaction: t });
          
        } else {
          // Devolver stock de productos normales
          const stockActual = producto[stockKey] || 0;
          const nuevoStock = stockActual + item.cantidad;
          
          await producto.update({ 
            [stockKey]: nuevoStock 
          }, { transaction: t });
          
          // Registrar movimiento
          try {
            await MovimientoInventario.create({
              producto_id: producto.id,
              local_id: pedido.local_id,
              tipo: 'devolucion',
              cantidad: item.cantidad,
              stock_anterior: stockActual,
              stock_nuevo: nuevoStock,
              motivo: `Pedido cancelado ${pedido_id}`,
              pedido_id: pedido_id,
              usuario_id: pedido.usuario_id
            }, { transaction: t });
          } catch (err) {
            console.log('⚠️ Modelo MovimientoInventario no disponible:', err.message);
          }
        }
      }

      await pedido.update({ estado: "cancelado", closed_at: new Date() }, { transaction: t });

      if (pedido.mesa_id) {
        await Mesa.update({ estado: "disponible" }, { where: { id: pedido.mesa_id }, transaction: t });
      }

      await t.commit();

      // 📌 SOCKET: Emitir mesa disponible
      const io = req.app.get('io');
      if (io && pedido.mesa_id) {
        const mesaActualizada = await Mesa.findByPk(pedido.mesa_id, { include: [{ model: Local, as: 'local' }] });
        io.emit('mesa_actualizada', { mesa: mesaActualizada, accion: 'pedido_cancelado' });
      }

      res.json({ message: "Pedido cancelado e inventario devuelto" });
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error('Error en cancelarPedido:', error);
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
          { model: ItemPedido, as: "items", include: [{ model: Producto, as: "producto" }] },
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