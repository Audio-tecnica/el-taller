const { Turno, Local, Usuario, Pedido, Cortesia } = require("../models");
const { Op } = require("sequelize");

const turnosController = {
  // ⭐ NUEVO: Obtener turno activo del cajero actual
  getMiTurnoActivo: async (req, res) => {
    try {
      const usuario_id = req.usuario.id;

      // Buscar turno donde este usuario sea el cajero
      const turno = await Turno.findOne({
        where: { 
          cajero_id: usuario_id, 
          estado: "abierto" 
        },
        include: [
          { model: Local, as: "local" },
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "nombre", "email", "rol"],
          },
          {
            model: Usuario,
            as: "cajero",
            attributes: ["id", "nombre", "email", "rol"],
          },
        ],
      });

      if (!turno) {
        return res.status(404).json({ error: "No tienes un turno abierto" });
      }

      // Calcular ventas del turno
      const pedidos = await Pedido.findAll({
        where: {
          local_id: turno.local_id,
          estado: "cerrado",
          closed_at: { [Op.gte]: turno.fecha_apertura },
        },
      });

      const resumen = {
        total_ventas: 0,
        total_efectivo: 0,
        total_transferencias: 0,
        total_nequi: 0,
        total_cortesias: 0,
        cantidad_pedidos: pedidos.length,
      };

      pedidos.forEach((p) => {
        const total = parseFloat(p.total_final) || 0;
        resumen.total_ventas += total;
        resumen.total_cortesias += parseFloat(p.monto_cortesia) || 0;

        if (p.metodo_pago === "efectivo") resumen.total_efectivo += total;
        if (p.metodo_pago === "transferencia") resumen.total_transferencias += total;
        if (p.metodo_pago === "nequi") resumen.total_nequi += total;
      });

      resumen.efectivo_esperado = parseFloat(turno.efectivo_inicial) + resumen.total_efectivo;

      res.json({ ...turno.toJSON(), resumen });
    } catch (error) {
      console.error("Error en getMiTurnoActivo:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Abrir turno
  abrirTurno: async (req, res) => {
    try {
      const { local_id, efectivo_inicial, cajero_id } = req.body; // ⭐ Agregar cajero_id
      const usuario_id = req.usuario.id;

      // Verificar si ya hay turno abierto en este local
      const turnoExistente = await Turno.findOne({
        where: { local_id, estado: "abierto" },
      });

      if (turnoExistente) {
        return res.status(400).json({
          error: "Ya hay un turno abierto en este local",
          turno_id: turnoExistente.id,
        });
      }

      // ⭐ Validar que cajero_id sea de un cajero real
      if (cajero_id) {
        const cajero = await Usuario.findByPk(cajero_id);
        if (!cajero || cajero.rol !== "cajero") {
          return res.status(400).json({
            error: "El usuario seleccionado no es un cajero válido",
          });
        }
      }

      const turno = await Turno.create({
        local_id,
        usuario_id, // Quien abre (puede ser admin)
        cajero_id: cajero_id || usuario_id, // ⭐ Cajero asignado
        efectivo_inicial: efectivo_inicial || 0,
        efectivo_esperado: efectivo_inicial || 0,
        estado: "abierto",
        fecha_apertura: new Date(),
      });

      const turnoCompleto = await Turno.findByPk(turno.id, {
        include: [
          { model: Local, as: "local" },
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "nombre", "email", "rol"],
          },
          {
            model: Usuario,
            as: "cajero",
            attributes: ["id", "nombre", "email", "rol"],
          }, // ⭐ Incluir cajero
        ],
      });

      res.status(201).json(turnoCompleto);
    } catch (error) {
      console.error("Error en abrirTurno:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener turno activo de un local
  getTurnoActivo: async (req, res) => {
    try {
      const { local_id } = req.params;

      const turno = await Turno.findOne({
        where: { local_id, estado: "abierto" },
        include: [
          { model: Local, as: "local" },
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "nombre", "email", "rol"],
          },
          {
            model: Usuario,
            as: "cajero",
            attributes: ["id", "nombre", "email", "rol"],
          }, // ⭐ AGREGAR
        ],
      });

      if (!turno) {
        return res.status(404).json({ error: "No hay turno abierto" });
      }

      // Calcular ventas del turno
      const pedidos = await Pedido.findAll({
        where: {
          local_id,
          estado: "cerrado",
          closed_at: { [Op.gte]: turno.fecha_apertura },
        },
      });

      const resumen = {
        total_ventas: 0,
        total_efectivo: 0,
        total_transferencias: 0,
        total_nequi: 0,
        total_cortesias: 0,
        cantidad_pedidos: pedidos.length,
      };

      pedidos.forEach((p) => {
        const total = parseFloat(p.total_final) || 0;
        resumen.total_ventas += total;
        resumen.total_cortesias += parseFloat(p.monto_cortesia) || 0;

        if (p.metodo_pago === "efectivo") resumen.total_efectivo += total;
        if (p.metodo_pago === "transferencia")
          resumen.total_transferencias += total;
        if (p.metodo_pago === "nequi") resumen.total_nequi += total;
      });

      resumen.efectivo_esperado =
        parseFloat(turno.efectivo_inicial) + resumen.total_efectivo;

      res.json({ ...turno.toJSON(), resumen });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

// Cerrar turno - VERSIÓN MEJORADA
  cerrarTurno: async (req, res) => {
    try {
      const { turno_id } = req.params;
      const { efectivo_real, notas_cierre } = req.body;

      const turno = await Turno.findByPk(turno_id, {
        include: [
          { model: Usuario, as: 'usuario' },
          { model: Usuario, as: 'cajero' }
        ]
      });

      if (!turno || turno.estado !== 'abierto') {
        return res.status(400).json({ error: 'Turno no válido o ya cerrado' });
      }

      // Calcular ventas del turno
      const pedidos = await Pedido.findAll({
        where: {
          local_id: turno.local_id,
          estado: "cerrado",
          closed_at: { [Op.gte]: turno.fecha_apertura },
        },
      });

      let total_ventas = 0;
      let total_efectivo = 0;
      let total_transferencias = 0;
      let total_nequi = 0;
      let total_cortesias = 0;

      pedidos.forEach((p) => {
        const total = parseFloat(p.total_final) || 0;
        total_ventas += total;
        total_cortesias += parseFloat(p.monto_cortesia) || 0;

        if (p.metodo_pago === "efectivo") total_efectivo += total;
        if (p.metodo_pago === "transferencia") total_transferencias += total;
        if (p.metodo_pago === "nequi") total_nequi += total;
      });

      const efectivo_esperado =
        parseFloat(turno.efectivo_inicial) + total_efectivo;
      const diferencia = parseFloat(efectivo_real) - efectivo_esperado;

      await turno.update({
        estado: 'cerrado',
        efectivo_esperado,
        efectivo_real,
        diferencia,
        total_efectivo,
        total_transferencias,
        total_nequi,
        total_ventas,
        total_cortesias,
        cantidad_pedidos: pedidos.length,
        fecha_cierre: new Date(),
        notas_cierre
      });

      // ⭐ EMITIR EVENTO DE CIERRE - MEJORADO
      const io = req.app.get('io');
      if (io) {
        const cajero_id = turno.cajero_id || turno.usuario_id;
        const eventoData = {
          turno_id: turno.id,
          usuario_id: cajero_id,
          cajero_id: cajero_id, // ⭐ AGREGAR TAMBIÉN cajero_id
          usuario_email: turno.cajero?.email || turno.usuario?.email,
          usuario_nombre: turno.cajero?.nombre || turno.usuario?.nombre,
          local_id: turno.local_id,
          fecha_cierre: new Date().toISOString()
        };
        
        // Emitir el evento globalmente
        io.emit('turno_cerrado', eventoData);
        
        console.log('🔒 ===== EVENTO TURNO_CERRADO EMITIDO =====');
        console.log('📡 Datos del evento:', JSON.stringify(eventoData, null, 2));
        console.log('👤 Cajero afectado:', cajero_id, '-', eventoData.usuario_nombre);
        console.log('🌐 Sockets conectados:', io.engine.clientsCount);
        console.log('==========================================');
      } else {
        console.error('⚠️ Socket.IO no está disponible - Evento no emitido');
      }

      res.json({
        message: "Turno cerrado exitosamente",
        resumen: {
          efectivo_inicial: turno.efectivo_inicial,
          total_ventas,
          total_efectivo,
          total_transferencias,
          total_nequi,
          total_cortesias,
          efectivo_esperado,
          efectivo_real,
          diferencia,
          cantidad_pedidos: pedidos.length,
        },
      });
    } catch (error) {
      console.error('❌ Error al cerrar turno:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Historial de turnos
  getHistorial: async (req, res) => {
    try {
      const { local_id } = req.query;
      const where = {};
      if (local_id) where.local_id = local_id;

      const turnos = await Turno.findAll({
        where,
        include: [
          { model: Local, as: "local" },
          { model: Usuario, as: "usuario", attributes: ["id", "nombre"] },
        ],
        order: [["fecha_apertura", "DESC"]],
        limit: 50,
      });

      res.json(turnos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = turnosController;