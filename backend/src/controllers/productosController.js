const { Producto, Categoria } = require('../models');

const productosController = {
  // Obtener todos los productos
  getAll: async (req, res) => {
    try {
      const { categoria_id, activo } = req.query;
      const where = {};
      
      if (categoria_id) where.categoria_id = categoria_id;
      if (activo !== undefined) where.activo = activo === 'true';
      else where.activo = true;

      const productos = await Producto.findAll({
        where,
        include: [{ model: Categoria, as: 'categoria' }],
        order: [['nombre', 'ASC']]
      });
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener un producto
  getOne: async (req, res) => {
    try {
      const producto = await Producto.findByPk(req.params.id, {
        include: [{ model: Categoria, as: 'categoria' }]
      });
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json(producto);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Crear producto
  create: async (req, res) => {
    try {
      const producto = await Producto.create(req.body);
      const productoConCategoria = await Producto.findByPk(producto.id, {
        include: [{ model: Categoria, as: 'categoria' }]
      });
      res.status(201).json(productoConCategoria);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar producto
  update: async (req, res) => {
    try {
      const producto = await Producto.findByPk(req.params.id);
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      await producto.update(req.body);
      const productoActualizado = await Producto.findByPk(producto.id, {
        include: [{ model: Categoria, as: 'categoria' }]
      });
      res.json(productoActualizado);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar producto (soft delete)
  delete: async (req, res) => {
    try {
      const producto = await Producto.findByPk(req.params.id);
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      await producto.update({ activo: false });
      res.json({ message: 'Producto eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Productos con stock bajo
  getStockBajo: async (req, res) => {
    try {
      const productos = await Producto.findAll({
        where: { activo: true },
        include: [{ model: Categoria, as: 'categoria' }]
      });
      
      const stockBajo = productos.filter(p => 
        (p.stock_local1 + p.stock_local2) <= p.alerta_stock
      );
      
      res.json(stockBajo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = productosController;