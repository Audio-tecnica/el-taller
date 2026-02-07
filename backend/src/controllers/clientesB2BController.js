const { ClienteB2B, VentaB2B, PagoB2B, Usuario } = require("../models");
const { Op } = require("sequelize");

// Obtener todos los clientes con filtros
exports.obtenerClientes = async (req, res) => {
  try {
    const {
      estado,
      buscar,
      ordenar = "razon_social",
      direccion = "ASC",
      limite = 50,
      pagina = 1,
    } = req.query;

    const where = {};

    // Filtro por estado
    if (estado) {
      where.estado = estado;
    }

    // Búsqueda por múltiples campos
    if (buscar) {
      where[Op.or] = [
        { razon_social: { [Op.iLike]: `%${buscar}%` } },
        { nombre_comercial: { [Op.iLike]: `%${buscar}%` } },
        { numero_documento: { [Op.iLike]: `%${buscar}%` } },
        { email: { [Op.iLike]: `%${buscar}%` } },
        { telefono: { [Op.iLike]: `%${buscar}%` } },
      ];
    }

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    const { count, rows: clientes } = await ClienteB2B.findAndCountAll({
      where,
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "nombre", "email"],
        },
      ],
      order: [[ordenar, direccion]],
      limit: parseInt(limite),
      offset,
    });

    res.json({
      clientes,
      total: count,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(count / parseInt(limite)),
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
};

// Obtener cliente por ID
exports.obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await ClienteB2B.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "nombre", "email"],
        },
        {
          model: Usuario,
          as: "actualizador",
          attributes: ["id", "nombre", "email"],
        },
      ],
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // Obtener estadísticas adicionales
    const ventasPendientes =
      (await VentaB2B.sum("saldo_pendiente", {
        where: {
          cliente_b2b_id: id,
          estado_pago: ["Pendiente", "Parcial", "Vencido"],
        },
      })) || 0;

    const facturasVencidas = await VentaB2B.count({
      where: {
        cliente_b2b_id: id,
        estado_pago: "Vencido",
      },
    });

    res.json({
      ...cliente.toJSON(),
      estadisticas: {
        ventasPendientes: parseFloat(ventasPendientes),
        facturasVencidas,
      },
    });
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    res.status(500).json({ error: "Error al obtener cliente" });
  }
};

// Crear nuevo cliente
exports.crearCliente = async (req, res) => {
  try {
    const {
      tipo_documento,
      numero_documento,
      razon_social,
      nombre_comercial,
      nombre_contacto,
      cargo_contacto,
      email,
      telefono,
      telefono_secundario,
      direccion,
      ciudad,
      departamento,
      codigo_postal,
      limite_credito,
      dias_credito,
      descuento_porcentaje,
      banco,
      tipo_cuenta,
      numero_cuenta,
      notas,
    } = req.body;

    // Validar que no exista el documento
    const clienteExistente = await ClienteB2B.findOne({
      where: { numero_documento },
    });

    if (clienteExistente) {
      return res.status(400).json({
        error: "Ya existe un cliente con ese número de documento",
      });
    }

    // Validar email
    const emailExistente = await ClienteB2B.findOne({
      where: { email },
    });

    if (emailExistente) {
      return res.status(400).json({
        error: "Ya existe un cliente con ese email",
      });
    }

    // Crear cliente
    // Crear cliente
    const credito = parseFloat(limite_credito) || 0;

    const nuevoCliente = await ClienteB2B.create({
      tipo_documento,
      numero_documento,
      razon_social,
      nombre_comercial,
      nombre_contacto,
      cargo_contacto,
      email,
      telefono,
      telefono_secundario,
      direccion,
      ciudad: ciudad || "Montería",
      departamento: departamento || "Córdoba",
      codigo_postal,
      limite_credito: credito,
      credito_disponible: credito,
      dias_credito: parseInt(dias_credito) || 30,
      descuento_porcentaje: parseFloat(descuento_porcentaje) || 0,
      banco,
      tipo_cuenta: tipo_cuenta || null, // ⭐ CAMBIAR: Convertir string vacío a null
      numero_cuenta,
      notas,
      estado: "Activo",
      creado_por: req.usuario?.id || null,
    });

    const cliente = await ClienteB2B.findByPk(nuevoCliente.id, {
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "nombre", "email"],
        },
      ],
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error("Error al crear cliente:", error);
    res.status(500).json({ error: "Error al crear cliente" });
  }
};

// Actualizar cliente
exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo_documento,
      numero_documento,
      razon_social,
      nombre_comercial,
      nombre_contacto,
      cargo_contacto,
      email,
      telefono,
      telefono_secundario,
      direccion,
      ciudad,
      departamento,
      codigo_postal,
      limite_credito,
      dias_credito,
      descuento_porcentaje,
      banco,
      tipo_cuenta,
      numero_cuenta,
      estado,
      notas,
    } = req.body;

    const cliente = await ClienteB2B.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // Validar documento único si se está cambiando
    if (numero_documento && numero_documento !== cliente.numero_documento) {
      const documentoExistente = await ClienteB2B.findOne({
        where: {
          numero_documento,
          id: { [Op.ne]: id },
        },
      });

      if (documentoExistente) {
        return res.status(400).json({
          error: "Ya existe otro cliente con ese número de documento",
        });
      }
    }

    // Validar email único si se está cambiando
    if (email && email !== cliente.email) {
      const emailExistente = await ClienteB2B.findOne({
        where: {
          email,
          id: { [Op.ne]: id },
        },
      });

      if (emailExistente) {
        return res.status(400).json({
          error: "Ya existe otro cliente con ese email",
        });
      }
    }

    // Si se actualiza el límite de crédito, recalcular el disponible
    if (limite_credito !== undefined) {
      const ventasPendientes =
        (await VentaB2B.sum("saldo_pendiente", {
          where: {
            cliente_b2b_id: id,
            estado_pago: ["Pendiente", "Parcial"],
          },
        })) || 0;

      cliente.credito_disponible =
        parseFloat(limite_credito) - parseFloat(ventasPendientes);
    }

    // Actualizar campos
    await cliente.update({
      tipo_documento: tipo_documento || cliente.tipo_documento,
      numero_documento: numero_documento || cliente.numero_documento,
      razon_social: razon_social || cliente.razon_social,
      nombre_comercial,
      nombre_contacto: nombre_contacto || cliente.nombre_contacto,
      cargo_contacto,
      email: email || cliente.email,
      telefono: telefono || cliente.telefono,
      telefono_secundario,
      direccion: direccion || cliente.direccion,
      ciudad: ciudad || cliente.ciudad,
      departamento: departamento || cliente.departamento,
      codigo_postal,
      limite_credito:
        limite_credito !== undefined ? limite_credito : cliente.limite_credito,
      dias_credito:
        dias_credito !== undefined ? dias_credito : cliente.dias_credito,
      descuento_porcentaje:
        descuento_porcentaje !== undefined
          ? descuento_porcentaje
          : cliente.descuento_porcentaje,
      banco,
      tipo_cuenta,
      numero_cuenta,
      estado: estado || cliente.estado,
      notas,
      actualizado_por: req.usuario?.id || null, // ⭐ CORREGIDO
    });

    const clienteActualizado = await ClienteB2B.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: "creador",
          attributes: ["id", "nombre", "email"],
        },
        {
          model: Usuario,
          as: "actualizador",
          attributes: ["id", "nombre", "email"],
        },
      ],
    });

    res.json(clienteActualizado);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
};

// Cambiar estado del cliente
exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo } = req.body;

    if (!["Activo", "Inactivo", "Suspendido", "Bloqueado"].includes(estado)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    const cliente = await ClienteB2B.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    await cliente.update({
      estado,
      notas: motivo
        ? `${cliente.notas || ""}\n[${new Date().toISOString()}] Cambio de estado a ${estado}: ${motivo}`
        : cliente.notas,
      actualizado_por: req.usuario?.id || null, // ⭐ CORREGIDO
    });

    res.json({
      mensaje: `Cliente ${estado.toLowerCase()} exitosamente`,
      cliente,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ error: "Error al cambiar estado del cliente" });
  }
};

// Obtener historial de ventas del cliente
exports.obtenerHistorialVentas = async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 20, pagina = 1 } = req.query;

    const cliente = await ClienteB2B.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    const { count, rows: ventas } = await VentaB2B.findAndCountAll({
      where: { cliente_b2b_id: id },
      include: [
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
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: "Error al obtener historial de ventas" });
  }
};

// Obtener estado de cuenta del cliente
exports.obtenerEstadoCuenta = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await ClienteB2B.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // Facturas pendientes
    const facturasPendientes = await VentaB2B.findAll({
      where: {
        cliente_b2b_id: id,
        estado_pago: ["Pendiente", "Parcial", "Vencido"],
      },
      order: [["fecha_vencimiento", "ASC"]],
    });

    // Pagos recientes
    const pagosRecientes = await PagoB2B.findAll({
      where: {
        cliente_b2b_id: id,
        estado: "Aplicado",
      },
      include: [
        {
          model: VentaB2B,
          as: "venta",
          attributes: ["numero_factura"],
        },
      ],
      order: [["fecha_pago", "DESC"]],
      limit: 10,
    });

    // Calcular totales
    const totalPendiente = facturasPendientes.reduce(
      (sum, factura) => sum + parseFloat(factura.saldo_pendiente),
      0,
    );

    const facturasVencidas = facturasPendientes.filter(
      (f) => f.estado_pago === "Vencido",
    );

    const totalVencido = facturasVencidas.reduce(
      (sum, factura) => sum + parseFloat(factura.saldo_pendiente),
      0,
    );

    res.json({
      cliente: {
        id: cliente.id,
        razon_social: cliente.razon_social,
        limite_credito: cliente.limite_credito,
        credito_disponible: cliente.credito_disponible,
        dias_credito: cliente.dias_credito,
      },
      resumen: {
        totalPendiente,
        totalVencido,
        facturasPendientes: facturasPendientes.length,
        facturasVencidas: facturasVencidas.length,
      },
      facturasPendientes,
      pagosRecientes,
    });
  } catch (error) {
    console.error("Error al obtener estado de cuenta:", error);
    res.status(500).json({ error: "Error al obtener estado de cuenta" });
  }
};

// Recalcular crédito disponible
exports.recalcularCredito = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await ClienteB2B.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const creditoDisponible = await cliente.calcularCreditoDisponible();

    res.json({
      mensaje: "Crédito recalculado exitosamente",
      limite_credito: cliente.limite_credito,
      credito_disponible: creditoDisponible,
    });
  } catch (error) {
    console.error("Error al recalcular crédito:", error);
    res.status(500).json({ error: "Error al recalcular crédito" });
  }
};

// Obtener resumen general de clientes
exports.obtenerResumenGeneral = async (req, res) => {
  try {
    const totalClientes = await ClienteB2B.count();
    const clientesActivos = await ClienteB2B.count({
      where: { estado: "Activo" },
    });
    const clientesBloqueados = await ClienteB2B.count({
      where: { bloqueado_por_mora: true },
    });

    const totalCartera =
      (await VentaB2B.sum("saldo_pendiente", {
        where: { estado_pago: ["Pendiente", "Parcial", "Vencido"] },
      })) || 0;

    const carteraVencida =
      (await VentaB2B.sum("saldo_pendiente", {
        where: { estado_pago: "Vencido" },
      })) || 0;

    res.json({
      totalClientes,
      clientesActivos,
      clientesBloqueados,
      totalCartera: parseFloat(totalCartera),
      carteraVencida: parseFloat(carteraVencida),
    });
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    res.status(500).json({ error: "Error al obtener resumen general" });
  }
};

// Eliminar cliente
exports.eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el cliente
    const cliente = await ClienteB2B.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // NOTA: Permitimos eliminar aunque tenga saldo pendiente
    // La validación y confirmación se hace en el frontend
    
    // Eliminar cliente (CASCADE eliminará ventas, pagos, etc.)
    await cliente.destroy();

    console.log(`✅ Cliente eliminado: ${cliente.razon_social} (${cliente.numero_documento})`);
    if (parseFloat(cliente.saldo_pendiente) > 0) {
      console.log(`⚠️ Se eliminó con saldo pendiente: $${parseFloat(cliente.saldo_pendiente).toLocaleString()}`);
    }

    res.json({ 
      message: 'Cliente eliminado exitosamente',
      cliente: {
        id: cliente.id,
        razon_social: cliente.razon_social,
        numero_documento: cliente.numero_documento,
        saldo_eliminado: parseFloat(cliente.saldo_pendiente)
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando cliente:', error);
    res.status(500).json({ error: error.message });
  }
};