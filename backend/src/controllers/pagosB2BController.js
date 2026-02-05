const { PagoB2B, VentaB2B, ClienteB2B, Usuario, Turno } = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Registrar pago
exports.registrarPago = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      venta_b2b_id,
      monto,
      metodo_pago,
      referencia_pago,
      banco,
      notas,
      turno_id,
    } = req.body;

    // Validar venta
    const venta = await VentaB2B.findByPk(venta_b2b_id, {
      include: [
        {
          model: ClienteB2B,
          as: "cliente",
        },
      ],
    });

    if (!venta) {
      await transaction.rollback();
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    if (venta.estado_pago === "Pagado") {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "La venta ya está completamente pagada" });
    }

    if (venta.estado_pago === "Anulado") {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "No se puede registrar pago a una venta anulada" });
    }

    const montoPago = parseFloat(monto);
    const saldoPendiente = parseFloat(venta.saldo_pendiente);

    if (montoPago <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: "El monto debe ser mayor a cero" });
    }

    if (montoPago > saldoPendiente) {
      await transaction.rollback();
      return res.status(400).json({
        error: `El monto no puede ser mayor al saldo pendiente ($${saldoPendiente.toFixed(2)})`,
      });
    }

    // Generar número de recibo
    const ultimoPago = await PagoB2B.findOne({
      order: [["fecha_creacion", "DESC"]],
    });

    let numeroRecibo;
    if (ultimoPago && ultimoPago.numero_recibo) {
      const ultimoNumero =
        parseInt(ultimoPago.numero_recibo.split("-")[1]) || 0;
      numeroRecibo = `RB2B-${String(ultimoNumero + 1).padStart(6, "0")}`;
    } else {
      numeroRecibo = "RB2B-000001";
    }

    // Crear pago
    const pago = await PagoB2B.create(
      {
        numero_recibo: numeroRecibo,
        venta_b2b_id,
        cliente_b2b_id: venta.cliente_b2b_id,
        monto: montoPago,
        metodo_pago,
        referencia_pago,
        banco,
        notas,
        recibido_por: req.usuario?.id || null, // ⭐ CORREGIDO
        turno_id,
      },
      { transaction },
    );

    // Calcular nuevos montos
    const nuevoMontoPagado = parseFloat(venta.monto_pagado || 0) + montoPago;
    const nuevoSaldoPendiente = parseFloat(venta.total) - nuevoMontoPagado;

    // Actualizar venta
    await venta.update(
      {
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: nuevoSaldoPendiente,
      },
      { transaction },
    );

    // Actualizar estado de pago DENTRO de la transacción
    const saldo = nuevoSaldoPendiente;
    const total = parseFloat(venta.total);

    let nuevoEstadoPago = venta.estado_pago;
    let fechaPagoCompleto = venta.fecha_pago_completo;

    if (saldo <= 0) {
      nuevoEstadoPago = "Pagado";
      fechaPagoCompleto = new Date();
    } else if (saldo < total) {
      nuevoEstadoPago = "Parcial";
    } else if (new Date() > new Date(venta.fecha_vencimiento)) {
      nuevoEstadoPago = "Vencido";
    } else {
      nuevoEstadoPago = "Pendiente";
    }

    await venta.update(
      {
        estado_pago: nuevoEstadoPago,
        fecha_pago_completo: fechaPagoCompleto,
      },
      { transaction },
    );

    // Obtener pago completo
    const pagoCompleto = await PagoB2B.findByPk(pago.id, {
      include: [
        {
          model: VentaB2B,
          as: "venta",
          include: [
            {
              model: ClienteB2B,
              as: "cliente",
            },
          ],
        },
        {
          model: Usuario,
          as: "receptor",
          attributes: ["id", "nombre"],
        },
      ],
    });

    res.status(201).json(pagoCompleto);
  } catch (error) {
    await transaction.rollback();
    console.error("Error al registrar pago:", error);
    res.status(500).json({ error: "Error al registrar pago" });
  }
};

// Obtener pagos con filtros
exports.obtenerPagos = async (req, res) => {
  try {
    const {
      cliente_id,
      venta_id,
      fecha_desde,
      fecha_hasta,
      metodo_pago,
      estado = "Aplicado",
      limite = 50,
      pagina = 1,
    } = req.query;

    const where = { estado };

    if (cliente_id) where.cliente_b2b_id = cliente_id;
    if (venta_id) where.venta_b2b_id = venta_id;
    if (metodo_pago) where.metodo_pago = metodo_pago;

    if (fecha_desde || fecha_hasta) {
      where.fecha_pago = {};
      if (fecha_desde) where.fecha_pago[Op.gte] = new Date(fecha_desde);
      if (fecha_hasta) where.fecha_pago[Op.lte] = new Date(fecha_hasta);
    }

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    const { count, rows: pagos } = await PagoB2B.findAndCountAll({
      where,
      include: [
        {
          model: VentaB2B,
          as: "venta",
          attributes: ["id", "numero_factura", "total", "saldo_pendiente"],
        },
        {
          model: ClienteB2B,
          as: "cliente",
          attributes: ["id", "razon_social", "numero_documento"],
        },
        {
          model: Usuario,
          as: "receptor",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["fecha_pago", "DESC"]],
      limit: parseInt(limite),
      offset,
    });

    res.json({
      pagos,
      total: count,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(count / parseInt(limite)),
    });
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ error: "Error al obtener pagos" });
  }
};

// Obtener pago por ID
exports.obtenerPagoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const pago = await PagoB2B.findByPk(id, {
      include: [
        {
          model: VentaB2B,
          as: "venta",
          include: [
            {
              model: ClienteB2B,
              as: "cliente",
            },
          ],
        },
        {
          model: Usuario,
          as: "receptor",
          attributes: ["id", "nombre", "email"],
        },
        {
          model: Usuario,
          as: "anulador",
          attributes: ["id", "nombre", "email"],
        },
        {
          model: Turno,
          as: "turno",
        },
      ],
    });

    if (!pago) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    res.json(pago);
  } catch (error) {
    console.error("Error al obtener pago:", error);
    res.status(500).json({ error: "Error al obtener pago" });
  }
};

// Anular pago
exports.anularPago = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar un motivo de anulación" });
    }

    const pago = await PagoB2B.findByPk(id, {
      include: [
        {
          model: VentaB2B,
          as: "venta",
          include: [
            {
              model: ClienteB2B,
              as: "cliente",
            },
          ],
        },
      ],
    });

    if (!pago) {
      await transaction.rollback();
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    if (pago.estado === "Anulado") {
      await transaction.rollback();
      return res.status(400).json({ error: "El pago ya está anulado" });
    }

    // Actualizar pago
    await pago.update(
      {
        estado: "Anulado",
        anulado_por: req.usuario?.id || null, // ⭐ CORREGIDO
        fecha_anulacion: new Date(),
        motivo_anulacion: motivo,
      },
      { transaction },
    );

    // Reversar el pago en la venta
    const venta = pago.venta;
    const nuevoMontoPagado =
      parseFloat(venta.monto_pagado) - parseFloat(pago.monto);
    const nuevoSaldoPendiente = parseFloat(venta.total) - nuevoMontoPagado;

    await venta.update(
      {
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: nuevoSaldoPendiente,
      },
      { transaction },
    );

    await venta.actualizarEstadoPago();

    // Reversar crédito del cliente (sumar porque se anula el pago)
    const cliente = venta.cliente;
    const nuevoCreditoUtilizado =
      parseFloat(cliente.credito_utilizado) + parseFloat(pago.monto);

    await cliente.update(
      {
        credito_utilizado: nuevoCreditoUtilizado,
      },
      { transaction },
    );

    await transaction.commit();

    res.json({ mensaje: "Pago anulado exitosamente", pago });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al anular pago:", error);
    res.status(500).json({ error: "Error al anular pago" });
  }
};

// Obtener resumen de pagos
exports.obtenerResumenPagos = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    const where = { estado: "Aplicado" };

    if (fecha_desde || fecha_hasta) {
      where.fecha_pago = {};
      if (fecha_desde) where.fecha_pago[Op.gte] = new Date(fecha_desde);
      if (fecha_hasta) where.fecha_pago[Op.lte] = new Date(fecha_hasta);
    }

    const totalPagos = (await PagoB2B.sum("monto", { where })) || 0;
    const cantidadPagos = await PagoB2B.count({ where });

    // Por método de pago
    const porMetodo = await PagoB2B.findAll({
      where,
      attributes: [
        "metodo_pago",
        [sequelize.fn("SUM", sequelize.col("monto")), "total"],
        [sequelize.fn("COUNT", sequelize.col("id")), "cantidad"],
      ],
      group: ["metodo_pago"],
    });

    res.json({
      totalPagos: parseFloat(totalPagos),
      cantidadPagos,
      porMetodo: porMetodo.map((m) => ({
        metodo: m.metodo_pago,
        total: parseFloat(m.dataValues.total),
        cantidad: parseInt(m.dataValues.cantidad),
      })),
    });
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    res.status(500).json({ error: "Error al obtener resumen de pagos" });
  }
};

// Obtener pagos de un turno
exports.obtenerPagosPorTurno = async (req, res) => {
  try {
    const { turno_id } = req.params;

    const pagos = await PagoB2B.findAll({
      where: {
        turno_id,
        estado: "Aplicado",
      },
      include: [
        {
          model: VentaB2B,
          as: "venta",
          attributes: ["numero_factura"],
        },
        {
          model: ClienteB2B,
          as: "cliente",
          attributes: ["razon_social"],
        },
      ],
      order: [["fecha_pago", "ASC"]],
    });

    const totalPagos = pagos.reduce(
      (sum, pago) => sum + parseFloat(pago.monto),
      0,
    );

    res.json({
      pagos,
      total: totalPagos,
      cantidad: pagos.length,
    });
  } catch (error) {
    console.error("Error al obtener pagos del turno:", error);
    res.status(500).json({ error: "Error al obtener pagos del turno" });
  }
};
