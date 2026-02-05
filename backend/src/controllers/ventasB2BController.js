const {
  VentaB2B,
  ItemVentaB2B,
  ClienteB2B,
  Producto,
  Usuario,
  Local,
  Pedido,
  MovimientoInventario,
} = require("../models");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Crear venta B2B
exports.crearVenta = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      cliente_b2b_id,
      local_id,
      pedido_id,
      items,
      metodo_pago,
      notas,
      aplicar_descuento_cliente = true,
    } = req.body;

    // Validar cliente
    const cliente = await ClienteB2B.findByPk(cliente_b2b_id);
    if (!cliente) {
      await transaction.rollback();
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    if (cliente.estado !== "Activo") {
      await transaction.rollback();
      return res.status(400).json({ error: "Cliente no activo" });
    }

    // Calcular totales con impuestos
    let subtotal = 0;
    let descuentoTotal = 0;
    const itemsVenta = [];
    const IVA_PORCENTAJE = 19; // IVA del 19% en Colombia

    for (const item of items) {
      const producto = await Producto.findByPk(item.producto_id);

      if (!producto) {
        await transaction.rollback();
        return res
          .status(404)
          .json({ error: `Producto ${item.producto_id} no encontrado` });
      }

      const cantidad = parseInt(item.cantidad);

      // Para barriles, usar precio de barril completo
      let precioUnitario;
      if (producto.presentacion === "Barril") {
        precioUnitario = parseFloat(
          item.precio_unitario ||
            producto.precio_barril ||
            producto.precio_mayorista ||
            450000,
        );
      } else {
        precioUnitario = parseFloat(
          item.precio_unitario ||
            producto.precio_mayorista ||
            producto.precio_venta,
        );
      }

      const itemSubtotal = cantidad * precioUnitario;

      // Aplicar descuento del producto o descuento general del cliente
      let descuentoPorcentaje = parseFloat(item.descuento_porcentaje || 0);
      if (
        aplicar_descuento_cliente &&
        !descuentoPorcentaje &&
        cliente.descuento_porcentaje
      ) {
        descuentoPorcentaje = parseFloat(cliente.descuento_porcentaje);
      }

      const descuentoMonto = itemSubtotal * (descuentoPorcentaje / 100);
      const itemTotal = itemSubtotal - descuentoMonto;

      subtotal += itemSubtotal;
      descuentoTotal += descuentoMonto;

      itemsVenta.push({
        producto_id: producto.id,
        nombre_producto: producto.nombre,
        cantidad,
        precio_unitario: precioUnitario,
        descuento_porcentaje: descuentoPorcentaje,
        descuento_monto: descuentoMonto,
        subtotal: itemSubtotal,
        total: itemTotal,
      });
    }

    // Calcular impuestos
    const baseImponible = subtotal - descuentoTotal;
    const ivaMonto = baseImponible * (IVA_PORCENTAJE / 100);
    const total = baseImponible + ivaMonto;

    // Verificar crédito disponible si es a crédito
    if (metodo_pago === "Credito") {
      const validacion = cliente.puedeComprar(total);
      if (!validacion.puede) {
        await transaction.rollback();
        return res.status(400).json({ error: validacion.razon });
      }
    }

    // Generar número de factura
    const ultimaVenta = await VentaB2B.findOne({
      where: { local_id },
      order: [["fecha_creacion", "DESC"]],
    });

    let numeroFactura;
    if (ultimaVenta && ultimaVenta.numero_factura) {
      const ultimoNumero =
        parseInt(ultimaVenta.numero_factura.split("-")[1]) || 0;
      numeroFactura = `FB2B-${String(ultimoNumero + 1).padStart(6, "0")}`;
    } else {
      numeroFactura = "FB2B-000001";
    }

    // Calcular fecha de vencimiento
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + cliente.dias_credito);

    // ⭐ CREAR VENTA CON CAMPO "iva" AGREGADO
    const venta = await VentaB2B.create(
      {
        numero_factura: numeroFactura,
        cliente_b2b_id,
        local_id,
        pedido_id,
        subtotal,
        descuento: descuentoTotal,
        iva: ivaMonto, // ⭐⭐⭐ ESTE ES EL CAMPO QUE FALTABA
        base_imponible: baseImponible,
        iva_porcentaje: IVA_PORCENTAJE,
        iva_monto: ivaMonto,
        otros_impuestos: 0,
        retefuente: 0,
        reteiva: 0,
        total,
        saldo_pendiente: metodo_pago === "Credito" ? total : 0,
        monto_pagado: metodo_pago === "Credito" ? 0 : total,
        estado_pago: metodo_pago === "Credito" ? "Pendiente" : "Pagado",
        fecha_vencimiento: fechaVencimiento,
        fecha_pago_completo: metodo_pago === "Credito" ? null : new Date(),
        metodo_pago,
        notas,
        vendedor_id: req.usuario?.id || null,
        estado_dian: "Pendiente",
      },
      { transaction },
    );

// Crear items de venta y actualizar inventario
    for (const item of itemsVenta) {
      // Crear el item de la venta
      await ItemVentaB2B.create(
        {
          venta_b2b_id: venta.id,
          ...item,
        },
        { transaction },
      );

      // Obtener producto y local para actualizar stock
      const producto = await Producto.findByPk(item.producto_id);
      const local = await Local.findByPk(local_id);
      
      // Determinar si es local 1 o local 2
      const esLocal1 = local.nombre.toLowerCase().includes("castellana");
      const stockAnterior = esLocal1 ? producto.stock_local1 : producto.stock_local2;
      const stockNuevo = stockAnterior - item.cantidad;

      // Actualizar stock del producto
      await producto.update(
        {
          [esLocal1 ? "stock_local1" : "stock_local2"]: stockNuevo,
        },
        { transaction },
      );

      // Registrar movimiento de inventario
      await MovimientoInventario.create(
        {
          producto_id: item.producto_id,
          local_id,
          tipo: "salida",
          tipo_movimiento: "Venta B2B",
          cantidad: -item.cantidad, // Negativo porque es salida
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          costo_unitario: producto.precio_mayorista || 0,
          precio_venta: item.precio_unitario,
          usuario_id: req.usuario?.id || null,
          numero_documento: numeroFactura,
          observaciones: `Venta B2B a ${cliente.razon_social}`,
        },
        { transaction },
      );
    }

    // Actualizar estadísticas del cliente
    await cliente.update(
      {
        total_ventas: parseFloat(cliente.total_ventas) + total,
        total_facturas: cliente.total_facturas + 1,
        ultima_compra: new Date(),
        credito_utilizado:
          metodo_pago === "Credito"
            ? parseFloat(cliente.credito_utilizado || 0) + total
            : cliente.credito_utilizado,
      },
      { transaction },
    );

    // Si viene de un pedido, marcarlo como facturado
    if (pedido_id) {
      await Pedido.update(
        { estado: "Facturado B2B" },
        { where: { id: pedido_id }, transaction },
      );
    }

    await transaction.commit();

    // Obtener venta completa
    const ventaCompleta = await VentaB2B.findByPk(venta.id, {
      include: [
        {
          model: ClienteB2B,
          as: "cliente",
        },
        {
          model: ItemVentaB2B,
          as: "items",
          include: [
            {
              model: Producto,
              as: "producto",
            },
          ],
        },
        {
          model: Usuario,
          as: "vendedor",
          attributes: ["id", "nombre"],
        },
      ],
    });

    res.status(201).json(ventaCompleta);
  } catch (error) {
    await transaction.rollback();
    console.error("Error al crear venta B2B:", error);
    res.status(500).json({ error: "Error al crear venta B2B" });
  }
};


// Obtener ventas con filtros
exports.obtenerVentas = async (req, res) => {
  try {
    const {
      cliente_id,
      local_id,
      estado_pago,
      fecha_desde,
      fecha_hasta,
      limite = 50,
      pagina = 1,
    } = req.query;

    const where = {};

    if (cliente_id) where.cliente_b2b_id = cliente_id;
    if (local_id) where.local_id = local_id;
    if (estado_pago) where.estado_pago = estado_pago;

    if (fecha_desde || fecha_hasta) {
      where.fecha_venta = {};
      if (fecha_desde) where.fecha_venta[Op.gte] = new Date(fecha_desde);
      if (fecha_hasta) where.fecha_venta[Op.lte] = new Date(fecha_hasta);
    }

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    const { count, rows: ventas } = await VentaB2B.findAndCountAll({
      where,
      include: [
        {
          model: ClienteB2B,
          as: "cliente",
          attributes: ["id", "razon_social", "numero_documento"],
        },
        {
          model: Local,
          as: "local",
          attributes: ["id", "nombre"],
        },
        {
          model: Usuario,
          as: "vendedor",
          attributes: ["id", "nombre"],
        },
      ],
      order: [["fecha_venta", "DESC"]],
      limit: parseInt(limite),
      offset,
    });

    res.json({
      ventas,
      total: count,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(count / parseInt(limite)),
    });
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
};

// Obtener venta por ID
exports.obtenerVentaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const venta = await VentaB2B.findByPk(id, {
      include: [
        {
          model: ClienteB2B,
          as: "cliente",
        },
        {
          model: ItemVentaB2B,
          as: "items",
          include: [
            {
              model: Producto,
              as: "producto",
            },
          ],
        },
        {
          model: Local,
          as: "local",
        },
        {
          model: Usuario,
          as: "vendedor",
          attributes: ["id", "nombre"],
        },
        {
          model: Pedido,
          as: "pedido",
        },
      ],
    });

    if (!venta) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json(venta);
  } catch (error) {
    console.error("Error al obtener venta:", error);
    res.status(500).json({ error: "Error al obtener venta" });
  }
};

// Anular venta
exports.anularVenta = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar un motivo de anulación" });
    }

    const venta = await VentaB2B.findByPk(id, {
      include: [
        {
          model: ItemVentaB2B,
          as: "items",
        },
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

    if (venta.estado_pago === "Anulado") {
      await transaction.rollback();
      return res.status(400).json({ error: "La venta ya está anulada" });
    }

    // Reversar inventario
    for (const item of venta.items) {
      await MovimientoInventario.create(
        {
          producto_id: item.producto_id,
          local_id: venta.local_id,
          tipo_movimiento: "Anulación Venta B2B",
          cantidad: item.cantidad,
          costo_unitario: 0,
          precio_venta: item.precio_unitario,
          usuario_id: req.usuario?.id || null, // ⭐ CORREGIDO
          numero_documento: venta.numero_factura,
          observaciones: `Anulación de venta B2B: ${motivo}`,
        },
        { transaction },
      );
    }

    // Actualizar venta
    await venta.update(
      {
        estado_pago: "Anulado",
        observaciones_anulacion: motivo,
        anulado_por: req.usuario?.id || null, // ⭐ CORREGIDO
        fecha_anulacion: new Date(),
      },
      { transaction },
    );

    // Actualizar estadísticas del cliente
    const cliente = venta.cliente;
    await cliente.update(
      {
        total_ventas:
          parseFloat(cliente.total_ventas) - parseFloat(venta.total),
        total_facturas: Math.max(0, cliente.total_facturas - 1),
        credito_utilizado:
          venta.metodo_pago === "Credito" // ⬅️ USAR credito_utilizado
            ? Math.max(
                0,
                parseFloat(cliente.credito_utilizado || 0) -
                  parseFloat(venta.saldo_pendiente),
              )
            : cliente.credito_utilizado,
      },
      { transaction },
    );

    await transaction.commit();

    res.json({ mensaje: "Venta anulada exitosamente", venta });
  } catch (error) {
    await transaction.rollback();
    console.error("Error al anular venta:", error);
    res.status(500).json({ error: "Error al anular venta" });
  }
};

// Actualizar días de mora de todas las ventas
exports.actualizarDiasMora = async (req, res) => {
  try {
    const ventasPendientes = await VentaB2B.findAll({
      where: {
        estado_pago: ["Pendiente", "Parcial", "Vencido"],
      },
    });

    let actualizadas = 0;
    let nuevasVencidas = 0;

    for (const venta of ventasPendientes) {
      const diasMoraAnterior = venta.dias_mora;
      await venta.actualizarEstadoPago();

      actualizadas++;

      if (diasMoraAnterior === 0 && venta.dias_mora > 0) {
        nuevasVencidas++;
      }
    }

    res.json({
      mensaje: "Días de mora actualizados",
      ventasActualizadas: actualizadas,
      nuevasVencidas,
    });
  } catch (error) {
    console.error("Error al actualizar días de mora:", error);
    res.status(500).json({ error: "Error al actualizar días de mora" });
  }
};

// Obtener resumen de ventas
exports.obtenerResumenVentas = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, local_id } = req.query;

    const where = {
      estado_pago: { [Op.ne]: "Anulado" },
    };

    if (local_id) where.local_id = local_id;

    if (fecha_desde || fecha_hasta) {
      where.fecha_venta = {};
      if (fecha_desde) where.fecha_venta[Op.gte] = new Date(fecha_desde);
      if (fecha_hasta) where.fecha_venta[Op.lte] = new Date(fecha_hasta);
    }

    const totalVentas = (await VentaB2B.sum("total", { where })) || 0;
    const totalPendiente =
      (await VentaB2B.sum("saldo_pendiente", {
        where: { ...where, estado_pago: ["Pendiente", "Parcial", "Vencido"] },
      })) || 0;

    const cantidadVentas = await VentaB2B.count({ where });
    const ventasCredito = await VentaB2B.count({
      where: { ...where, metodo_pago: "Credito" },
    });

    res.json({
      totalVentas: parseFloat(totalVentas),
      totalPendiente: parseFloat(totalPendiente),
      totalCobrado: parseFloat(totalVentas) - parseFloat(totalPendiente),
      cantidadVentas,
      ventasCredito,
      ventasContado: cantidadVentas - ventasCredito,
    });
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    res.status(500).json({ error: "Error al obtener resumen de ventas" });
  }
};
