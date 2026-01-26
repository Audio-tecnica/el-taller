const express = require('express');
const router = express.Router();
const { Proveedor, Compra, MovimientoInventario } = require('../models');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// ==========================================
// CRUD DE PROVEEDORES
// ==========================================

// GET - Listar todos los proveedores activos
router.get('/', async (req, res) => {
  try {
    const { activo } = req.query;
    
    const where = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const proveedores = await Proveedor.findAll({
      where,
      order: [['nombre', 'ASC']]
    });

    res.json(proveedores);
  } catch (error) {
    console.error('Error en listar proveedores:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener un proveedor por ID
router.get('/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nuevo proveedor
router.post('/', async (req, res) => {
  try {
    const {
      nombre,
      nit,
      telefono,
      email,
      direccion,
      contacto_nombre,
      contacto_telefono,
      terminos_pago,
      notas
    } = req.body;

    // Validaciones
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Generar código automático si no se proporciona
    let codigo = req.body.codigo;
    if (!codigo) {
      const ultimoProveedor = await Proveedor.findOne({
        order: [['created_at', 'DESC']]
      });
      
      let contador = 1;
      if (ultimoProveedor && ultimoProveedor.codigo) {
        const match = ultimoProveedor.codigo.match(/PROV-(\d+)/);
        if (match) {
          contador = parseInt(match[1]) + 1;
        }
      }
      
      codigo = `PROV-${String(contador).padStart(3, '0')}`;
    }

    const proveedor = await Proveedor.create({
      codigo,
      nombre,
      nit,
      telefono,
      email,
      direccion,
      contacto_nombre,
      contacto_telefono,
      terminos_pago,
      notas,
      activo: true
    });

    res.status(201).json({
      mensaje: 'Proveedor creado exitosamente',
      proveedor
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Actualizar proveedor
router.put('/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    await proveedor.update(req.body);

    res.json({
      mensaje: 'Proveedor actualizado exitosamente',
      proveedor
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Desactivar proveedor (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    await proveedor.update({ activo: false });

    res.json({
      mensaje: 'Proveedor desactivado exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ESTADÍSTICAS Y REPORTES DE PROVEEDORES
// ==========================================

// GET - Historial de compras de un proveedor
router.get('/:id/compras', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const proveedor_id = req.params.id;

    const where = { proveedor_id };

    if (fecha_inicio && fecha_fin) {
      where.fecha_compra = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const compras = await Compra.findAll({
      where,
      order: [['fecha_compra', 'DESC']],
      limit: 50
    });

    const totalCompras = compras.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);
    const totalComprasRecibidas = compras.filter(c => c.estado === 'recibida').length;

    res.json({
      proveedor_id,
      compras,
      resumen: {
        total_compras: compras.length,
        total_recibidas: totalComprasRecibidas,
        monto_total: totalCompras
      }
    });
  } catch (error) {
    console.error('Error al obtener compras del proveedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Productos comprados a un proveedor
router.get('/:id/productos', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const proveedor_id = req.params.id;

    const where = {
      proveedor_id,
      tipo: 'compra'
    };

    if (fecha_inicio && fecha_fin) {
      where.fecha_movimiento = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const movimientos = await MovimientoInventario.findAll({
      where,
      include: [
        {
          model: require('../models').Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'codigo'],
          include: [
            {
              model: require('../models').Categoria,
              as: 'categoria',
              attributes: ['nombre']
            }
          ]
        }
      ]
    });

    // Agrupar por producto
    const productosAgrupados = {};
    movimientos.forEach(m => {
      const prodId = m.producto_id;
      if (!productosAgrupados[prodId]) {
        productosAgrupados[prodId] = {
          producto_id: prodId,
          nombre: m.producto?.nombre,
          codigo: m.producto?.codigo,
          categoria: m.producto?.categoria?.nombre,
          cantidad_total: 0,
          monto_total: 0,
          numero_compras: 0,
          costo_promedio: 0
        };
      }
      productosAgrupados[prodId].cantidad_total += m.cantidad;
      productosAgrupados[prodId].monto_total += parseFloat(m.costo_total || 0);
      productosAgrupados[prodId].numero_compras += 1;
    });

    // Calcular costo promedio
    Object.values(productosAgrupados).forEach(p => {
      p.costo_promedio = p.cantidad_total > 0 
        ? p.monto_total / p.cantidad_total 
        : 0;
    });

    const productos = Object.values(productosAgrupados)
      .sort((a, b) => b.monto_total - a.monto_total);

    res.json({
      proveedor_id,
      productos
    });
  } catch (error) {
    console.error('Error al obtener productos del proveedor:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Estadísticas de un proveedor
router.get('/:id/estadisticas', async (req, res) => {
  try {
    const proveedor_id = req.params.id;

    const proveedor = await Proveedor.findByPk(proveedor_id);
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Compras totales
    const totalCompras = await Compra.count({ where: { proveedor_id } });
    const comprasRecibidas = await Compra.count({
      where: { proveedor_id, estado: 'recibida' }
    });

    // Monto total
    const compras = await Compra.findAll({
      where: { proveedor_id, estado: 'recibida' },
      attributes: ['total']
    });
    const montoTotal = compras.reduce((sum, c) => sum + parseFloat(c.total || 0), 0);

    // Última compra
    const ultimaCompra = await Compra.findOne({
      where: { proveedor_id },
      order: [['fecha_compra', 'DESC']]
    });

    // Productos diferentes comprados
    const movimientos = await MovimientoInventario.findAll({
      where: { proveedor_id, tipo: 'compra' },
      attributes: ['producto_id'],
      group: ['producto_id']
    });

    res.json({
      proveedor,
      estadisticas: {
        total_compras: totalCompras,
        compras_recibidas: comprasRecibidas,
        monto_total: montoTotal,
        monto_promedio: totalCompras > 0 ? montoTotal / totalCompras : 0,
        productos_diferentes: movimientos.length,
        ultima_compra: ultimaCompra ? {
          fecha: ultimaCompra.fecha_compra,
          monto: ultimaCompra.total,
          numero: ultimaCompra.numero_compra
        } : null
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del proveedor:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
