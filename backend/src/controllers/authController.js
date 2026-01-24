const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'el_taller_secret_2024';
const JWT_EXPIRES_IN = '24h';

const authController = {
  // Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const usuario = await Usuario.findOne({ where: { email } });
      
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Usar el método del modelo o comparar directamente con password_hash
      const passwordValida = await bcrypt.compare(password, usuario.password_hash);
      
      if (!passwordValida) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      if (!usuario.activo) {
        return res.status(401).json({ error: 'Usuario desactivado' });
      }

      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          rol: usuario.rol,
          local: usuario.local_asignado_id
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const { password_hash: _, ...usuarioSinPassword } = usuario.toJSON();

      res.json({
        message: 'Login exitoso',
        token,
        user: usuarioSinPassword
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // Obtener usuario actual
  me: async (req, res) => {
    try {
      // req.usuario viene del middleware (no req.user)
      const usuario = await Usuario.findByPk(req.usuario.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ user: usuario });
    } catch (error) {
      console.error('Error en me:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // Refresh token
  refresh: async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.usuario.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (!usuario.activo) {
        return res.status(401).json({ error: 'Usuario desactivado' });
      }

      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          rol: usuario.rol,
          local: usuario.local_asignado_id
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Token refrescado',
        token,
        user: usuario
      });
    } catch (error) {
      console.error('Error en refresh:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // Cambiar contraseña
  cambiarPassword: async (req, res) => {
    try {
      const { passwordActual, passwordNueva } = req.body;

      const usuario = await Usuario.findByPk(req.usuario.id);

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const passwordValida = await bcrypt.compare(passwordActual, usuario.password_hash);
      
      if (!passwordValida) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      const hashedPassword = await bcrypt.hash(passwordNueva, 10);
      await usuario.update({ password_hash: hashedPassword });

      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error en cambiarPassword:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // Registrar nuevo usuario (solo admin)
  registro: async (req, res) => {
    try {
      const { nombre, email, password, rol, local_asignado_id } = req.body;

      const existente = await Usuario.findOne({ where: { email } });
      
      if (existente) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      const usuario = await Usuario.create({
        nombre,
        email,
        password_hash: password, // El hook beforeCreate lo hashea
        rol: rol || 'cajero',
        local_asignado_id: local_asignado_id || null,
        activo: true
      });

      const { password_hash: _, ...usuarioSinPassword } = usuario.toJSON();

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user: usuarioSinPassword
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  }
};

module.exports = authController;