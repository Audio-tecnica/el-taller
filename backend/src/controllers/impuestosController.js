const { Impuesto, ClienteImpuesto, ClienteB2B } = require('../models');
const { Op } = require('sequelize');

// ═══════════════════════════════════════════════════════════════════
// CATÁLOGO DE IMPUESTOS
// ═══════════════════════════════════════════════════════════════════

// Obtener todos los impuestos
exports.obtenerImpuestos = async (req, res) => {
  try {
    const { activo, tipo } = req.query;
    
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';
    if (tipo) where.tipo = tipo;

    const impuestos = await Impuesto.findAll({
      where,
      order: [['tipo', 'ASC'], ['orden', 'ASC']]
    });

    res.json(impuestos);
  } catch (error) {
    console.error('Error al obtener impuestos:', error);
    res.status(500).json({ error: 'Error al obtener impuestos' });
  }
};

// Obtener impuesto por ID
exports.obtenerImpuestoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const impuesto = await Impuesto.findByPk(id);
    
    if (!impuesto) {
      return res.status(404).json({ error: 'Impuesto no encontrado' });
    }

    res.json(impuesto);
  } catch (error) {
    console.error('Error al obtener impuesto:', error);
    res.status(500).json({ error: 'Error al obtener impuesto' });
  }
};

// Crear impuesto
exports.crearImpuesto = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      descripcion,
      tipo,
      porcentaje,
      base_calculo,
      aplica_a,
      cuenta_contable,
      orden
    } = req.body;

    // Validar código único
    const existente = await Impuesto.findOne({ where: { codigo } });
    if (existente) {
      return res.status(400).json({ error: 'Ya existe un impuesto con ese código' });
    }

    const impuesto = await Impuesto.create({
      codigo,
      nombre,
      descripcion,
      tipo: tipo || 'Impuesto',
      porcentaje,
      base_calculo: base_calculo || 'Subtotal',
      aplica_a: aplica_a || 'Todos',
      cuenta_contable,
      orden: orden || 0,
      activo: true
    });

    res.status(201).json(impuesto);
  } catch (error) {
    console.error('Error al crear impuesto:', error);
    res.status(500).json({ error: 'Error al crear impuesto' });
  }
};

// Actualizar impuesto
exports.actualizarImpuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo,
      nombre,
      descripcion,
      tipo,
      porcentaje,
      base_calculo,
      aplica_a,
      cuenta_contable,
      orden,
      activo
    } = req.body;

    const impuesto = await Impuesto.findByPk(id);
    
    if (!impuesto) {
      return res.status(404).json({ error: 'Impuesto no encontrado' });
    }

    // Validar código único si se cambia
    if (codigo && codigo !== impuesto.codigo) {
      const existente = await Impuesto.findOne({ where: { codigo } });
      if (existente) {
        return res.status(400).json({ error: 'Ya existe un impuesto con ese código' });
      }
    }

    await impuesto.update({
      codigo: codigo || impuesto.codigo,
      nombre: nombre || impuesto.nombre,
      descripcion: descripcion !== undefined ? descripcion : impuesto.descripcion,
      tipo: tipo || impuesto.tipo,
      porcentaje: porcentaje !== undefined ? porcentaje : impuesto.porcentaje,
      base_calculo: base_calculo || impuesto.base_calculo,
      aplica_a: aplica_a || impuesto.aplica_a,
      cuenta_contable: cuenta_contable !== undefined ? cuenta_contable : impuesto.cuenta_contable,
      orden: orden !== undefined ? orden : impuesto.orden,
      activo: activo !== undefined ? activo : impuesto.activo
    });

    res.json(impuesto);
  } catch (error) {
    console.error('Error al actualizar impuesto:', error);
    res.status(500).json({ error: 'Error al actualizar impuesto' });
  }
};

// Eliminar impuesto (soft delete - desactivar)
exports.eliminarImpuesto = async (req, res) => {
  try {
    const { id } = req.params;

    const impuesto = await Impuesto.findByPk(id);
    
    if (!impuesto) {
      return res.status(404).json({ error: 'Impuesto no encontrado' });
    }

    await impuesto.update({ activo: false });

    res.json({ mensaje: 'Impuesto desactivado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar impuesto:', error);
    res.status(500).json({ error: 'Error al eliminar impuesto' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// IMPUESTOS POR CLIENTE
// ═══════════════════════════════════════════════════════════════════

// Obtener impuestos de un cliente
exports.obtenerImpuestosCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;

    const cliente = await ClienteB2B.findByPk(clienteId, {
      include: [{
        model: ClienteImpuesto,
        as: 'impuestos_cliente',
        where: { activo: true },
        required: false,
        include: [{
          model: Impuesto,
          as: 'impuesto'
        }]
      }]
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Formatear respuesta
    const impuestosCliente = (cliente.impuestos_cliente || []).map(ci => ({
      id: ci.id,
      impuesto_id: ci.impuesto_id,
      codigo: ci.impuesto.codigo,
      nombre: ci.impuesto.nombre,
      tipo: ci.impuesto.tipo,
      porcentaje: ci.porcentaje_personalizado || ci.impuesto.porcentaje,
      porcentaje_original: ci.impuesto.porcentaje,
      porcentaje_personalizado: ci.porcentaje_personalizado,
      base_calculo: ci.impuesto.base_calculo
    }));

    res.json(impuestosCliente);
  } catch (error) {
    console.error('Error al obtener impuestos del cliente:', error);
    res.status(500).json({ error: 'Error al obtener impuestos del cliente' });
  }
};

// Asignar impuestos a un cliente
exports.asignarImpuestosCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { impuestos } = req.body; // Array de { impuesto_id, porcentaje_personalizado? }

    const cliente = await ClienteB2B.findByPk(clienteId);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Desactivar impuestos actuales
    await ClienteImpuesto.update(
      { activo: false },
      { where: { cliente_b2b_id: clienteId } }
    );

    // Crear nuevas asignaciones
    const asignaciones = [];
    for (const imp of impuestos) {
      const [clienteImpuesto, created] = await ClienteImpuesto.findOrCreate({
        where: {
          cliente_b2b_id: clienteId,
          impuesto_id: imp.impuesto_id
        },
        defaults: {
          porcentaje_personalizado: imp.porcentaje_personalizado || null,
          activo: true
        }
      });

      if (!created) {
        await clienteImpuesto.update({
          porcentaje_personalizado: imp.porcentaje_personalizado || null,
          activo: true
        });
      }

      asignaciones.push(clienteImpuesto);
    }

    res.json({ 
      mensaje: 'Impuestos asignados exitosamente',
      impuestos_asignados: asignaciones.length
    });
  } catch (error) {
    console.error('Error al asignar impuestos al cliente:', error);
    res.status(500).json({ error: 'Error al asignar impuestos al cliente' });
  }
};

// Agregar un impuesto a un cliente
exports.agregarImpuestoCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { impuesto_id, porcentaje_personalizado } = req.body;

    const cliente = await ClienteB2B.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const impuesto = await Impuesto.findByPk(impuesto_id);
    if (!impuesto) {
      return res.status(404).json({ error: 'Impuesto no encontrado' });
    }

    const [clienteImpuesto, created] = await ClienteImpuesto.findOrCreate({
      where: {
        cliente_b2b_id: clienteId,
        impuesto_id: impuesto_id
      },
      defaults: {
        porcentaje_personalizado: porcentaje_personalizado || null,
        activo: true
      }
    });

    if (!created) {
      await clienteImpuesto.update({
        porcentaje_personalizado: porcentaje_personalizado || null,
        activo: true
      });
    }

    res.status(201).json(clienteImpuesto);
  } catch (error) {
    console.error('Error al agregar impuesto al cliente:', error);
    res.status(500).json({ error: 'Error al agregar impuesto al cliente' });
  }
};

// Quitar un impuesto de un cliente
exports.quitarImpuestoCliente = async (req, res) => {
  try {
    const { clienteId, impuestoId } = req.params;

    const clienteImpuesto = await ClienteImpuesto.findOne({
      where: {
        cliente_b2b_id: clienteId,
        impuesto_id: impuestoId
      }
    });

    if (!clienteImpuesto) {
      return res.status(404).json({ error: 'Relación cliente-impuesto no encontrada' });
    }

    await clienteImpuesto.update({ activo: false });

    res.json({ mensaje: 'Impuesto removido del cliente exitosamente' });
  } catch (error) {
    console.error('Error al quitar impuesto del cliente:', error);
    res.status(500).json({ error: 'Error al quitar impuesto del cliente' });
  }
};

// ═══════════════════════════════════════════════════════════════════
// CÁLCULO DE IMPUESTOS
// ═══════════════════════════════════════════════════════════════════

// Calcular impuestos para un monto (preview)
exports.calcularImpuestos = async (req, res) => {
  try {
    const { subtotal, impuestos_ids } = req.body;

    if (!subtotal || !impuestos_ids || !Array.isArray(impuestos_ids)) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const impuestos = await Impuesto.findAll({
      where: { 
        id: { [Op.in]: impuestos_ids },
        activo: true
      },
      order: [['tipo', 'ASC'], ['orden', 'ASC']]
    });

    const subtotalNum = parseFloat(subtotal);
    let totalImpuestos = 0;
    let totalRetenciones = 0;
    const detalle = [];

    for (const imp of impuestos) {
      const porcentaje = parseFloat(imp.porcentaje);
      let base = subtotalNum;
      
      // Determinar base de cálculo
      if (imp.base_calculo === 'BaseGravable') {
        // Para ReteIVA, la base es el monto del IVA
        const ivaAplicado = detalle.find(d => d.codigo.startsWith('IVA') && d.tipo === 'Impuesto');
        base = ivaAplicado ? ivaAplicado.monto : 0;
      }

      const monto = (base * porcentaje) / 100;

      if (imp.tipo === 'Impuesto') {
        totalImpuestos += monto;
      } else {
        totalRetenciones += monto;
      }

      detalle.push({
        id: imp.id,
        codigo: imp.codigo,
        nombre: imp.nombre,
        tipo: imp.tipo,
        porcentaje: porcentaje,
        base: base,
        monto: monto
      });
    }

    const total = subtotalNum + totalImpuestos - totalRetenciones;

    res.json({
      subtotal: subtotalNum,
      total_impuestos: totalImpuestos,
      total_retenciones: totalRetenciones,
      total: total,
      neto_a_pagar: total,
      detalle: detalle
    });
  } catch (error) {
    console.error('Error al calcular impuestos:', error);
    res.status(500).json({ error: 'Error al calcular impuestos' });
  }
};
