const { Cortesia, Pedido, ItemPedido, Usuario, Local } = require('../models');

const cortesiasController = {
  // Obtener historial de cortesías
  getAll: async (req, res) => {
    try {
      const { local_id, fecha_inicio, fecha_fin } = req.query;
      const where = {};
      
      if (local_id) where.local_id = local_id;

      const cortesias = await Cortesia.findAll({
        where,
        include: [
          { model: Pedido, as: 'pedido' },
          { model: Usuario, as: 'autorizador' },
          { model: Local, as: 'local' }
        ],
        order: [['created_at', 'DESC']],
        limit: 100
      });

      res.json(cortesias);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Resumen de cortesías por período
  getResumen: async (req, res) => {
    try {
      const { local_id } = req.query;
      
      // Cortesías de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const cortesias = await Cortesia.findAll({
        where: local_id ? { local_id } : {},
        include: [{ model: Local, as: 'local' }]
      });

      const cortesiasHoy = cortesias.filter(c => new Date(c.created_at) >= hoy);
      
      const resumen = {
        total_hoy: cortesiasHoy.reduce((sum, c) => sum + parseFloat(c.monto_cortesia), 0),
        cantidad_hoy: cortesiasHoy.length,
        total_general: cortesias.reduce((sum, c) => sum + parseFloat(c.monto_cortesia), 0),
        cantidad_general: cortesias.length,
        por_razon: {}
      };

      // Agrupar por razón
      cortesias.forEach(c => {
        const razon = c.razon || 'Sin razón';
        if (!resumen.por_razon[razon]) {
          resumen.por_razon[razon] = { cantidad: 0, monto: 0 };
        }
        resumen.por_razon[razon].cantidad++;
        resumen.por_razon[razon].monto += parseFloat(c.monto_cortesia);
      });

      res.json(resumen);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = cortesiasController;