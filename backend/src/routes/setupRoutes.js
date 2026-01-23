const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

// Crear usuario admin (SOLO PARA DESARROLLO)
router.post('/create-admin', async (req, res) => {
  try {
    // Verificar si ya existe
    const existe = await Usuario.findOne({ 
      where: { email: 'admin@eltaller.com' } 
    });

    if (existe) {
      return res.json({ 
        message: 'Usuario admin ya existe',
        usuario: {
          email: existe.email,
          nombre: existe.nombre
        }
      });
    }

    // Crear usuario
    const usuario = await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@eltaller.com',
      password_hash: 'admin123',
      rol: 'administrador',
      puede_autorizar_cortesias: true,
      monto_maximo_cortesia: 999999.99
    });

    res.json({ 
      message: 'Usuario admin creado exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error creando admin:', error);
    res.status(500).json({ error: error.message });
  }
});

// NUEVO: Resetear admin
router.post('/reset-admin', async (req, res) => {
  try {
    // Eliminar el admin existente
    await Usuario.destroy({ 
      where: { email: 'admin@eltaller.com' } 
    });

    // Crear nuevo admin
    const usuario = await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@eltaller.com',
      password_hash: 'admin123', // beforeCreate lo hasheará
      rol: 'administrador',
      puede_autorizar_cortesias: true,
      monto_maximo_cortesia: 999999.99
    });

    res.json({ 
      message: 'Usuario admin reseteado exitosamente',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error reseteando admin:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;