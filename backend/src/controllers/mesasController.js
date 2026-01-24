const { Mesa, Local } = require('../models');

const mesasController = {
  // Obtener todas las mesas
  getAll: async (req, res) => {
    try {
      const { local_id } = req.query;
      const where = { activo: true };
      
      if (local_id) where.local_id = local_id;

      const mesas = await Mesa.findAll({
        where,
        include: [{ model: Local, as: 'local' }],
        order: [['numero', 'ASC']]
      });
      res.json(mesas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener una mesa
  getOne: async (req, res) => {
    try {
      const mesa = await Mesa.findByPk(req.params.id, {
        include: [{ model: Local, as: 'local' }]
      });
      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }
      res.json(mesa);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Crear mesa
  create: async (req, res) => {
    try {
      const mesa = await Mesa.create(req.body);
      const mesaConLocal = await Mesa.findByPk(mesa.id, {
        include: [{ model: Local, as: 'local' }]
      });

      // 🔌 Emitir evento Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.emit('mesa_creada', {
          mesa: mesaConLocal
        });
        io.to(`local_${mesa.local_id}`).emit('mesas_actualizadas', {
          accion: 'creada',
          mesa: mesaConLocal
        });
      }

      res.status(201).json(mesaConLocal);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar mesa
  update: async (req, res) => {
    try {
      const mesa = await Mesa.findByPk(req.params.id);
      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }
      
      const estadoAnterior = mesa.estado;
      await mesa.update(req.body);
      
      const mesaActualizada = await Mesa.findByPk(mesa.id, {
        include: [{ model: Local, as: 'local' }]
      });

      // 🔌 Emitir evento Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.emit('mesa_actualizada', {
          mesa_id: mesa.id,
          estado: mesa.estado,
          estado_anterior: estadoAnterior,
          local_id: mesa.local_id,
          mesa: mesaActualizada
        });
      }

      res.json(mesaActualizada);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Cambiar estado de mesa
  cambiarEstado: async (req, res) => {
    try {
      const { estado } = req.body;
      const mesa = await Mesa.findByPk(req.params.id);
      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }
      
      const estadoAnterior = mesa.estado;
      await mesa.update({ estado });

      // 🔌 Emitir evento Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.emit('mesa_actualizada', {
          mesa_id: mesa.id,
          estado: estado,
          estado_anterior: estadoAnterior,
          local_id: mesa.local_id
        });
        
        io.to(`local_${mesa.local_id}`).emit('mesa_estado_cambiado', {
          mesa_id: mesa.id,
          estado: estado,
          numero: mesa.numero
        });
      }

      res.json(mesa);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar mesa (soft delete)
  delete: async (req, res) => {
    try {
      const mesa = await Mesa.findByPk(req.params.id);
      if (!mesa) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }
      await mesa.update({ activo: false });

      // 🔌 Emitir evento Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.emit('mesa_eliminada', {
          mesa_id: mesa.id,
          local_id: mesa.local_id
        });
      }

      res.json({ message: 'Mesa eliminada' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener locales
  getLocales: async (req, res) => {
    try {
      const locales = await Local.findAll({
        where: { activo: true },
        order: [['nombre', 'ASC']]
      });
      res.json(locales);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = mesasController;