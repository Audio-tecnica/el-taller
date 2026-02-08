const { Op } = require('sequelize');
const Gasto = require('../models/Gasto');
const Local = require('../models/Local');
const Proveedor = require('../models/Proveedor');
const Usuario = require('../models/Usuario');

module.exports = {
  // Obtener todos los gastos con filtros
  getGastos: async (req, res) => {
    try {
      const { 
        fecha_inicio, 
        fecha_fin, 
        categoria, 
        local_id, 
        proveedor_id,
        mes,
        anio 
      } = req.query;

      const where = {};

      // Filtro por rango de fechas
      if (fecha_inicio && fecha_fin) {
        where.fecha = {
          [Op.between]: [fecha_inicio, fecha_fin]
        };
      }

      // Filtro por categoría
      if (categoria) {
        where.categoria = categoria;
      }

      // Filtro por local
      if (local_id) {
        where.local_id = local_id;
      }

      // Filtro por proveedor
      if (proveedor_id) {
        where.proveedor_id = proveedor_id;
      }

      // Filtro por mes/año
      if (mes && anio) {
        where.mes_aplicacion = mes;
        where.anio_aplicacion = anio;
      } else if (mes) {
        where.mes_aplicacion = mes;
      } else if (anio) {
        where.anio_aplicacion = anio;
      }

      const gastos = await Gasto.findAll({
        where,
        include: [
          {
            model: Local,
            as: 'local',
            attributes: ['id', 'nombre']
          },
          {
            model: Proveedor,
            as: 'proveedor',
            attributes: ['id', 'nombre', 'nit']
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'email']
          }
        ],
        order: [['fecha', 'DESC'], ['created_at', 'DESC']]
      });

      res.json(gastos);
    } catch (error) {
      console.error('Error en getGastos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener un gasto por ID
  getGastoById: async (req, res) => {
    try {
      const { id } = req.params;

      const gasto = await Gasto.findByPk(id, {
        include: [
          {
            model: Local,
            as: 'local',
            attributes: ['id', 'nombre']
          },
          {
            model: Proveedor,
            as: 'proveedor',
            attributes: ['id', 'nombre', 'nit', 'telefono', 'email']
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre', 'email']
          }
        ]
      });

      if (!gasto) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
      }

      res.json(gasto);
    } catch (error) {
      console.error('Error en getGastoById:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Crear nuevo gasto
  createGasto: async (req, res) => {
    try {
      const {
        fecha,
        categoria,
        concepto,
        monto,
        local_id,
        proveedor_id,
        metodo_pago,
        numero_factura,
        periodicidad,
        mes_aplicacion,
        anio_aplicacion,
        usuario_id,
        aprobado,
        notas,
        archivo_adjunto
      } = req.body;

      // Validaciones
      if (!concepto || !monto || !categoria) {
        return res.status(400).json({ 
          error: 'Concepto, monto y categoría son obligatorios' 
        });
      }

      if (monto <= 0) {
        return res.status(400).json({ 
          error: 'El monto debe ser mayor a 0' 
        });
      }

      // Auto-calcular mes y año si no se proporcionan
      const fechaGasto = fecha ? new Date(fecha) : new Date();
      const mes_calculado = mes_aplicacion || fechaGasto.getMonth() + 1;
      const anio_calculado = anio_aplicacion || fechaGasto.getFullYear();

      const nuevoGasto = await Gasto.create({
        fecha: fecha || new Date(),
        categoria,
        concepto,
        monto,
        local_id: local_id || null,
        proveedor_id: proveedor_id || null,
        metodo_pago: metodo_pago || 'efectivo',
        numero_factura,
        periodicidad: periodicidad || 'unico',
        mes_aplicacion: mes_calculado,
        anio_aplicacion: anio_calculado,
        usuario_id,
        aprobado: aprobado !== undefined ? aprobado : true,
        notas,
        archivo_adjunto
      });

      // Cargar el gasto con relaciones
      const gastoCompleto = await Gasto.findByPk(nuevoGasto.id, {
        include: [
          { model: Local, as: 'local' },
          { model: Proveedor, as: 'proveedor' },
          { model: Usuario, as: 'usuario' }
        ]
      });

      res.status(201).json(gastoCompleto);
    } catch (error) {
      console.error('Error en createGasto:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar gasto
  updateGasto: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        fecha,
        categoria,
        concepto,
        monto,
        local_id,
        proveedor_id,
        metodo_pago,
        numero_factura,
        periodicidad,
        mes_aplicacion,
        anio_aplicacion,
        aprobado,
        notas,
        archivo_adjunto
      } = req.body;

      const gasto = await Gasto.findByPk(id);

      if (!gasto) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
      }

      // Validaciones
      if (monto !== undefined && monto <= 0) {
        return res.status(400).json({ 
          error: 'El monto debe ser mayor a 0' 
        });
      }

      // Actualizar campos
      await gasto.update({
        fecha: fecha !== undefined ? fecha : gasto.fecha,
        categoria: categoria || gasto.categoria,
        concepto: concepto || gasto.concepto,
        monto: monto !== undefined ? monto : gasto.monto,
        local_id: local_id !== undefined ? local_id : gasto.local_id,
        proveedor_id: proveedor_id !== undefined ? proveedor_id : gasto.proveedor_id,
        metodo_pago: metodo_pago || gasto.metodo_pago,
        numero_factura: numero_factura !== undefined ? numero_factura : gasto.numero_factura,
        periodicidad: periodicidad || gasto.periodicidad,
        mes_aplicacion: mes_aplicacion !== undefined ? mes_aplicacion : gasto.mes_aplicacion,
        anio_aplicacion: anio_aplicacion !== undefined ? anio_aplicacion : gasto.anio_aplicacion,
        aprobado: aprobado !== undefined ? aprobado : gasto.aprobado,
        notas: notas !== undefined ? notas : gasto.notas,
        archivo_adjunto: archivo_adjunto !== undefined ? archivo_adjunto : gasto.archivo_adjunto
      });

      // Cargar el gasto actualizado con relaciones
      const gastoActualizado = await Gasto.findByPk(id, {
        include: [
          { model: Local, as: 'local' },
          { model: Proveedor, as: 'proveedor' },
          { model: Usuario, as: 'usuario' }
        ]
      });

      res.json(gastoActualizado);
    } catch (error) {
      console.error('Error en updateGasto:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar gasto
  deleteGasto: async (req, res) => {
    try {
      const { id } = req.params;

      const gasto = await Gasto.findByPk(id);

      if (!gasto) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
      }

      await gasto.destroy();

      res.json({ 
        message: 'Gasto eliminado correctamente',
        id 
      });
    } catch (error) {
      console.error('Error en deleteGasto:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener resumen de gastos
  getResumenGastos: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, local_id } = req.query;

      const where = {};

      if (fecha_inicio && fecha_fin) {
        where.fecha = {
          [Op.between]: [fecha_inicio, fecha_fin]
        };
      }

      if (local_id) {
        where.local_id = local_id;
      }

      const gastos = await Gasto.findAll({ where });

      // Total general
      const totalGastos = gastos.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0);

      // Por categoría
      const porCategoria = gastos.reduce((acc, g) => {
        if (!acc[g.categoria]) {
          acc[g.categoria] = { 
            categoria: g.categoria, 
            total: 0, 
            cantidad: 0 
          };
        }
        acc[g.categoria].total += parseFloat(g.monto || 0);
        acc[g.categoria].cantidad += 1;
        return acc;
      }, {});

      // Por método de pago
      const porMetodoPago = gastos.reduce((acc, g) => {
        const metodo = g.metodo_pago || 'efectivo';
        if (!acc[metodo]) {
          acc[metodo] = { total: 0, cantidad: 0 };
        }
        acc[metodo].total += parseFloat(g.monto || 0);
        acc[metodo].cantidad += 1;
        return acc;
      }, {});

      // Por mes
      const porMes = gastos.reduce((acc, g) => {
        const mes = g.mes_aplicacion || new Date(g.fecha).getMonth() + 1;
        const anio = g.anio_aplicacion || new Date(g.fecha).getFullYear();
        const key = `${anio}-${String(mes).padStart(2, '0')}`;
        
        if (!acc[key]) {
          acc[key] = { periodo: key, total: 0, cantidad: 0 };
        }
        acc[key].total += parseFloat(g.monto || 0);
        acc[key].cantidad += 1;
        return acc;
      }, {});

      res.json({
        totalGastos,
        cantidadGastos: gastos.length,
        porCategoria: Object.values(porCategoria),
        porMetodoPago,
        porMes: Object.values(porMes).sort((a, b) => a.periodo.localeCompare(b.periodo))
      });
    } catch (error) {
      console.error('Error en getResumenGastos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener categorías de gastos
  getCategorias: async (req, res) => {
    try {
      const categorias = [
        { value: 'servicios_publicos', label: 'Servicios Públicos', icon: '💡' },
        { value: 'arriendo', label: 'Arriendo', icon: '🏠' },
        { value: 'nomina', label: 'Nómina', icon: '👥' },
        { value: 'mantenimiento', label: 'Mantenimiento', icon: '🔧' },
        { value: 'publicidad', label: 'Publicidad', icon: '📢' },
        { value: 'transporte', label: 'Transporte', icon: '🚗' },
        { value: 'seguros', label: 'Seguros', icon: '🛡️' },
        { value: 'impuestos', label: 'Impuestos', icon: '📋' },
        { value: 'papeleria', label: 'Papelería', icon: '📝' },
        { value: 'limpieza', label: 'Limpieza', icon: '🧹' },
        { value: 'tecnologia', label: 'Tecnología', icon: '💻' },
        { value: 'otros', label: 'Otros', icon: '📦' }
      ];

      res.json(categorias);
    } catch (error) {
      console.error('Error en getCategorias:', error);
      res.status(500).json({ error: error.message });
    }
  }
};
