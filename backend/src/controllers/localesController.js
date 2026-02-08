const Local = require('../models/Local');

// Obtener todos los locales
exports.getLocales = async (req, res) => {
  try {
    const locales = await Local.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']]
    });
    
    res.json(locales);
  } catch (error) {
    console.error('Error al obtener locales:', error);
    res.status(500).json({ 
      error: 'Error al obtener locales',
      details: error.message 
    });
  }
};

// Obtener un local por ID
exports.getLocalById = async (req, res) => {
  try {
    const { id } = req.params;
    const local = await Local.findByPk(id);
    
    if (!local) {
      return res.status(404).json({ error: 'Local no encontrado' });
    }
    
    res.json(local);
  } catch (error) {
    console.error('Error al obtener local:', error);
    res.status(500).json({ 
      error: 'Error al obtener local',
      details: error.message 
    });
  }
};

// Crear un nuevo local
exports.createLocal = async (req, res) => {
  try {
    const { nombre, direccion, telefono } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    
    const local = await Local.create({
      nombre,
      direccion,
      telefono,
      activo: true
    });
    
    res.status(201).json(local);
  } catch (error) {
    console.error('Error al crear local:', error);
    res.status(500).json({ 
      error: 'Error al crear local',
      details: error.message 
    });
  }
};

// Actualizar un local
exports.updateLocal = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, activo } = req.body;
    
    const local = await Local.findByPk(id);
    
    if (!local) {
      return res.status(404).json({ error: 'Local no encontrado' });
    }
    
    await local.update({
      nombre: nombre || local.nombre,
      direccion: direccion !== undefined ? direccion : local.direccion,
      telefono: telefono !== undefined ? telefono : local.telefono,
      activo: activo !== undefined ? activo : local.activo
    });
    
    res.json(local);
  } catch (error) {
    console.error('Error al actualizar local:', error);
    res.status(500).json({ 
      error: 'Error al actualizar local',
      details: error.message 
    });
  }
};

// Eliminar un local (soft delete)
exports.deleteLocal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const local = await Local.findByPk(id);
    
    if (!local) {
      return res.status(404).json({ error: 'Local no encontrado' });
    }
    
    // Soft delete: marcar como inactivo
    await local.update({ activo: false });
    
    res.json({ message: 'Local desactivado correctamente' });
  } catch (error) {
    console.error('Error al eliminar local:', error);
    res.status(500).json({ 
      error: 'Error al eliminar local',
      details: error.message 
    });
  }
};
