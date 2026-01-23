const { Categoria } = require('../models');

const categoriasController = {
  // Obtener todas las categorías
  getAll: async (req, res) => {
    try {
      const categorias = await Categoria.findAll({
        where: { activo: true },
        order: [['orden', 'ASC']]
      });
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener una categoría
  getOne: async (req, res) => {
    try {
      const categoria = await Categoria.findByPk(req.params.id);
      if (!categoria) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      res.json(categoria);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Crear categoría
  create: async (req, res) => {
    try {
      const { nombre, icono, orden } = req.body;
      const categoria = await Categoria.create({ nombre, icono, orden });
      res.status(201).json(categoria);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar categoría
  update: async (req, res) => {
    try {
      const categoria = await Categoria.findByPk(req.params.id);
      if (!categoria) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      await categoria.update(req.body);
      res.json(categoria);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar categoría (soft delete)
  delete: async (req, res) => {
    try {
      const categoria = await Categoria.findByPk(req.params.id);
      if (!categoria) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      await categoria.update({ activo: false });
      res.json({ message: 'Categoría eliminada' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = categoriasController;