const { Producto } = require('../models');
const sequelize = require('../config/database');

const barrilesController = {
  // Obtener barriles disponibles para activar en un local
  getBarrilesDisponibles: async (req, res) => {
    try {
      const { local } = req.params;
      const stockKey = `stock_local${local}`;
      const barrilActivoKey = `barril_activo_local${local}`;
      
      const barriles = await Producto.findAll({
        where: {
          unidad_medida: 'barriles',
          activo: true
        },
        include: ['categoria']
      });
      
      // Filtrar los que tienen stock y no están activos
      const disponibles = barriles.filter(b => 
        b[stockKey] > 0 && !b[barrilActivoKey]
      );
      
      res.json(disponibles);
    } catch (error) {
      console.error('Error en getBarrilesDisponibles:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener barriles activos en un local
  getBarrilesActivos: async (req, res) => {
    try {
      const { local } = req.params;
      const barrilActivoKey = `barril_activo_local${local}`;
      
      const barriles = await Producto.findAll({
        where: {
          unidad_medida: 'barriles',
          [barrilActivoKey]: true,
          activo: true
        },
        include: ['categoria']
      });
      
      res.json(barriles);
    } catch (error) {
      console.error('Error en getBarrilesActivos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Activar barril en máquina
  activarBarril: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { producto_id, local } = req.body;
      const io = req.app.get('io');

      const producto = await Producto.findByPk(producto_id, {
        include: ['categoria']
      });
      
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      if (producto.unidad_medida !== 'barriles') {
        await t.rollback();
        return res.status(400).json({ error: 'Este producto no es un barril' });
      }

      // Verificar stock
      const stockKey = `stock_local${local}`;
      if (producto[stockKey] <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'No hay barriles en stock' });
      }

      // Verificar si ya hay barril activo de ESTE producto
      const barrilActivoKey = `barril_activo_local${local}`;
      if (producto[barrilActivoKey]) {
        await t.rollback();
        return res.status(400).json({ error: 'Este producto ya tiene un barril activo en este local' });
      }

      // Activar barril
      const vasosKey = `vasos_disponibles_local${local}`;
      await producto.update({
        [barrilActivoKey]: true,
        [vasosKey]: producto.capacidad_barril,
        [stockKey]: producto[stockKey] - 1
      }, { transaction: t });

      await t.commit();

      const productoActualizado = await Producto.findByPk(producto_id, {
        include: ['categoria']
      });

      // Emitir evento en tiempo real
      if (io) {
        io.emit('barril_actualizado', {
          tipo: 'activado',
          local,
          producto: productoActualizado
        });
        
        io.to(`local_${local}`).emit('barril_activado', {
          producto: productoActualizado,
          mensaje: `Barril de ${producto.nombre} activado`
        });
      }

      res.json({
        message: 'Barril activado exitosamente',
        producto: productoActualizado
      });
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error('Error en activarBarril:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Desactivar barril (cuando se acaba)
  desactivarBarril: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { producto_id, local } = req.body;
      const io = req.app.get('io');

      const producto = await Producto.findByPk(producto_id, {
        include: ['categoria']
      });
      
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const barrilActivoKey = `barril_activo_local${local}`;
      const vasosKey = `vasos_disponibles_local${local}`;

      await producto.update({
        [barrilActivoKey]: false,
        [vasosKey]: 0
      }, { transaction: t });

      await t.commit();

      const productoActualizado = await Producto.findByPk(producto_id, {
        include: ['categoria']
      });

      // Emitir evento en tiempo real
      if (io) {
        io.emit('barril_actualizado', {
          tipo: 'desactivado',
          local,
          producto: productoActualizado
        });
        
        io.to(`local_${local}`).emit('barril_desactivado', {
          producto: productoActualizado
        });
      }

      res.json({
        message: 'Barril desactivado',
        producto: productoActualizado
      });
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error('Error en desactivarBarril:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Vender vaso (restar del barril activo)
  venderVaso: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { producto_id, local, cantidad = 1 } = req.body;
      const io = req.app.get('io');

      const producto = await Producto.findByPk(producto_id, {
        include: ['categoria']
      });
      
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const barrilActivoKey = `barril_activo_local${local}`;
      const vasosKey = `vasos_disponibles_local${local}`;

      if (!producto[barrilActivoKey]) {
        await t.rollback();
        return res.status(400).json({ error: 'No hay barril activo en este local' });
      }

      const vasosDisponibles = producto[vasosKey];
      
      if (vasosDisponibles < cantidad) {
        await t.rollback();
        return res.status(400).json({ 
          error: 'No hay suficientes vasos disponibles',
          vasos_disponibles: vasosDisponibles
        });
      }

      const nuevosVasos = vasosDisponibles - cantidad;

      await producto.update({
        [vasosKey]: nuevosVasos
      }, { transaction: t });

      await t.commit();

      const productoActualizado = await Producto.findByPk(producto_id, {
        include: ['categoria']
      });

      // Verificar si el barril está casi vacío
      const alerta = nuevosVasos <= 15 ? {
        tipo: 'barril_bajo',
        mensaje: `⚠️ Quedan solo ${nuevosVasos} vasos en el barril de ${producto.nombre}`
      } : null;

      // Emitir evento en tiempo real
      if (io) {
        io.emit('barril_actualizado', {
          tipo: 'venta',
          local,
          producto: productoActualizado,
          vasos_restantes: nuevosVasos
        });

        // Si está bajo, emitir alerta
        if (alerta) {
          io.to(`local_${local}`).emit('alerta_barril', alerta);
        }
      }

      res.json({
        message: 'Vaso vendido',
        vasos_restantes: nuevosVasos,
        alerta,
        producto: productoActualizado
      });
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error('Error en venderVaso:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Ajustar vasos manualmente (corrección de inventario)
  ajustarVasos: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { producto_id, local, vasos_nuevos, motivo } = req.body;
      const io = req.app.get('io');

      const producto = await Producto.findByPk(producto_id);
      
      if (!producto) {
        await t.rollback();
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const barrilActivoKey = `barril_activo_local${local}`;
      const vasosKey = `vasos_disponibles_local${local}`;

      if (!producto[barrilActivoKey]) {
        await t.rollback();
        return res.status(400).json({ error: 'No hay barril activo en este local' });
      }

      const vasosAnteriores = producto[vasosKey];

      await producto.update({
        [vasosKey]: vasos_nuevos
      }, { transaction: t });

      await t.commit();

      // Emitir evento
      if (io) {
        io.emit('barril_actualizado', {
          tipo: 'ajuste',
          local,
          producto: await Producto.findByPk(producto_id),
          vasos_anteriores: vasosAnteriores,
          vasos_nuevos,
          motivo
        });
      }

      res.json({
        message: 'Vasos ajustados',
        vasos_anteriores: vasosAnteriores,
        vasos_nuevos,
        producto: await Producto.findByPk(producto_id, { include: ['categoria'] })
      });
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error('Error en ajustarVasos:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = barrilesController;