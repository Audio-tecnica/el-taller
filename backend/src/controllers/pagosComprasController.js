const { PagoCompra, Compra, Proveedor, Usuario } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const pagosComprasController = {
  // Registrar pago de una compra
  registrarPago: async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
      const { compra_id } = req.params;
      const {
        fecha_pago,
        monto_pago,
        forma_pago,
        numero_referencia,
        banco,
        observaciones
      } = req.body;
      const usuario_id = req.usuario.id;

      // Validar monto
      const montoPagoNum = parseFloat(monto_pago);
      if (!montoPagoNum || montoPagoNum <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'El monto del pago debe ser mayor a cero' });
      }

      // Buscar la compra
      const compra = await Compra.findByPk(compra_id, { transaction: t });
      if (!compra) {
        await t.rollback();
        return res.status(404).json({ error: 'Compra no encontrada' });
      }

      // Validar que la compra no esté cancelada
      if (compra.estado === 'cancelada') {
        await t.rollback();
        return res.status(400).json({ error: 'No se puede pagar una compra cancelada' });
      }

      // Validar que no se exceda el saldo pendiente
      const saldoPendiente = parseFloat(compra.saldo_pendiente);
      if (montoPagoNum > saldoPendiente) {
        await t.rollback();
        return res.status(400).json({ 
          error: `El monto del pago ($${montoPagoNum.toLocaleString('es-CO')}) excede el saldo pendiente ($${saldoPendiente.toLocaleString('es-CO')})`,
          saldo_pendiente: saldoPendiente
        });
      }

      // Generar número de pago consecutivo
      const anio = new Date().getFullYear();
      const ultimoPago = await PagoCompra.findOne({
        where: { numero_pago: { [Op.like]: `PAG-${anio}-%` } },
        order: [['numero_pago', 'DESC']],
        transaction: t
      });

      let contador = 1;
      if (ultimoPago) {
        contador = parseInt(ultimoPago.numero_pago.split('-')[2]) + 1;
      }

      const numero_pago = `PAG-${anio}-${String(contador).padStart(5, '0')}`;

      // Crear el pago
      const pago = await PagoCompra.create({
        compra_id,
        numero_pago,
        fecha_pago: fecha_pago || new Date(),
        monto_pago: montoPagoNum,
        forma_pago,
        numero_referencia,
        banco,
        observaciones,
        usuario_id
      }, { transaction: t });

      // Actualizar la compra
      const nuevoMontoPagado = parseFloat(compra.monto_pagado) + montoPagoNum;
      const nuevoSaldoPendiente = parseFloat(compra.total) - nuevoMontoPagado;

      await compra.update({
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: nuevoSaldoPendiente
      }, { transaction: t });

      // Actualizar estado de pago
      compra.actualizarEstadoPago();
      await compra.save({ transaction: t });

      await t.commit();

      // Obtener el pago completo con relaciones
      const pagoCompleto = await PagoCompra.findByPk(pago.id, {
        include: [
          { 
            model: Compra, 
            as: 'compra',
            include: [{ model: Proveedor, as: 'proveedor' }]
          },
          { model: Usuario, as: 'usuario' }
        ]
      });

      res.json({
        mensaje: 'Pago registrado exitosamente',
        pago: pagoCompleto,
        compra_actualizada: {
          monto_pagado: nuevoMontoPagado,
          saldo_pendiente: nuevoSaldoPendiente,
          estado_pago: compra.estado_pago
        }
      });

    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error('Error en registrarPago:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Listar pagos de una compra
  listarPagosCompra: async (req, res) => {
    try {
      const { compra_id } = req.params;

      const pagos = await PagoCompra.findAll({
        where: { 
          compra_id,
          anulado: false
        },
        include: [
          { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
        ],
        order: [['fecha_pago', 'DESC']]
      });

      res.json(pagos);
    } catch (error) {
      console.error('Error en listarPagosCompra:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Listar todos los pagos con filtros
  listarPagos: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, proveedor_id, forma_pago } = req.query;

      const where = { anulado: false };

      if (fecha_inicio && fecha_fin) {
        const inicio = new Date(fecha_inicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fecha_fin);
        fin.setHours(23, 59, 59, 999);
        where.fecha_pago = { [Op.between]: [inicio, fin] };
      }

      if (forma_pago) {
        where.forma_pago = forma_pago;
      }

      const include = [
        {
          model: Compra,
          as: 'compra',
          include: [{ model: Proveedor, as: 'proveedor' }]
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre']
        }
      ];

      // Si hay filtro de proveedor, agregarlo a la compra
      if (proveedor_id) {
        include[0].where = { proveedor_id };
      }

      const pagos = await PagoCompra.findAll({
        where,
        include,
        order: [['fecha_pago', 'DESC']]
      });

      res.json(pagos);
    } catch (error) {
      console.error('Error en listarPagos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Anular pago
  anularPago: async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const { pago_id } = req.params;
      const { motivo_anulacion } = req.body;

      if (!motivo_anulacion) {
        await t.rollback();
        return res.status(400).json({ error: 'Debe especificar el motivo de anulación' });
      }

      const pago = await PagoCompra.findByPk(pago_id, { transaction: t });
      if (!pago) {
        await t.rollback();
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      if (pago.anulado) {
        await t.rollback();
        return res.status(400).json({ error: 'El pago ya está anulado' });
      }

      // Anular el pago
      await pago.update({
        anulado: true,
        fecha_anulacion: new Date(),
        motivo_anulacion
      }, { transaction: t });

      // Actualizar la compra
      const compra = await Compra.findByPk(pago.compra_id, { transaction: t });
      const nuevoMontoPagado = parseFloat(compra.monto_pagado) - parseFloat(pago.monto_pago);
      const nuevoSaldoPendiente = parseFloat(compra.total) - nuevoMontoPagado;

      await compra.update({
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: nuevoSaldoPendiente
      }, { transaction: t });

      compra.actualizarEstadoPago();
      await compra.save({ transaction: t });

      await t.commit();

      res.json({
        mensaje: 'Pago anulado exitosamente',
        pago,
        compra_actualizada: {
          monto_pagado: nuevoMontoPagado,
          saldo_pendiente: nuevoSaldoPendiente,
          estado_pago: compra.estado_pago
        }
      });

    } catch (error) {
      if (!t.finished) await t.rollback();
      console.error('Error en anularPago:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener resumen de pagos
  obtenerResumen: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      const where = { anulado: false };

      if (fecha_inicio && fecha_fin) {
        const inicio = new Date(fecha_inicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fecha_fin);
        fin.setHours(23, 59, 59, 999);
        where.fecha_pago = { [Op.between]: [inicio, fin] };
      }

      const pagos = await PagoCompra.findAll({ where });

      const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.monto_pago), 0);
      const cantidadPagos = pagos.length;

      // Agrupar por forma de pago
      const porFormaPago = {};
      pagos.forEach(p => {
        const forma = p.forma_pago;
        if (!porFormaPago[forma]) {
          porFormaPago[forma] = { cantidad: 0, total: 0 };
        }
        porFormaPago[forma].cantidad += 1;
        porFormaPago[forma].total += parseFloat(p.monto_pago);
      });

      res.json({
        total_pagado: totalPagado,
        cantidad_pagos: cantidadPagos,
        por_forma_pago: Object.entries(porFormaPago).map(([forma, data]) => ({
          forma_pago: forma,
          ...data
        }))
      });

    } catch (error) {
      console.error('Error en obtenerResumen:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = pagosComprasController;