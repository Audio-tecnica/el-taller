const { Producto } = require('../models');
const sequelize = require('../config/database');

const barrilesController = {
  // Activar barril en máquina
  activarBarril: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { producto_id, local } = req.body; // local: 1 o 2

      const producto = await Producto.findByPk(producto_id);
      
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

      // Verificar si ya hay barril activo
      const barrilActivoKey = `barril_activo_local${local}`;
      if (producto[barrilActivoKey]) {
        await t.rollback();
        return res.status(400).json({ error: 'Ya hay un barril activo en este local' });
      }

      // Activar barril
      const vasosKey = `vasos_disponibles_local${local}`;
      await producto.update({
        [barrilActivoKey]: true,
        [vasosKey]: producto.capacidad_barril,
        [stockKey]: producto[stockKey] - 1 // Restar 1 barril del stock
      }, { transaction: t });

      await t.commit();

      res.json({
        message: 'Barril activado exitosamente',
        producto: await Producto.findByPk(producto_id)
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

      const producto = await Producto.findByPk(producto_id);
      
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

      res.json({
        message: 'Barril desactivado',
        producto: await Producto.findByPk(producto_id)
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

      // Verificar si el barril está casi vacío
      const alerta = nuevosVasos <= 15 ? {
        tipo: 'barril_bajo',
        mensaje: `⚠️ Quedan solo ${nuevosVasos} vasos en el barril de ${producto.nombre}`
      } : null;

      res.json({
        message: 'Vaso vendido',
        vasos_restantes: nuevosVasos,
        alerta,
        producto: await Producto.findByPk(producto_id)
      });
    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error('Error en venderVaso:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = barrilesController;