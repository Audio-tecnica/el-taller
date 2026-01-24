const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'el_taller_secret_2024';
const JWT_EXPIRES_IN = '24h'; // Token expira en 24 horas

const authController = {
  // Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const usuario = await Usuario.findOne({ where: { email } });
      
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, usuario.password);
      
      if (!passwordValida) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar que el usuario esté activo
      if (!usuario.activo) {
        return res.status(401).json({ error: 'Usuario desactivado' });
      }

      // Generar token
      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          rol: usuario.rol,
          local: usuario.local
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Responder sin la contraseña
      const { password: _, ...usuarioSinPassword } = usuario.toJSON();

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
      const usuario = await Usuario.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
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

  // Refresh token - genera un nuevo token si el actual es válido
  refresh: async (req, res) => {
    try {
      // req.user viene del middleware de autenticación
      const usuario = await Usuario.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (!usuario.activo) {
        return res.status(401).json({ error: 'Usuario desactivado' });
      }

      // Generar nuevo token
      const token = jwt.sign(
        { 
          id: usuario.id, 
          email: usuario.email, 
          rol: usuario.rol,
          local: usuario.local
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

      const usuario = await Usuario.findByPk(req.user.id);

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar contraseña actual
      const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
      
      if (!passwordValida) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(passwordNueva, 10);

      // Actualizar
      await usuario.update({ password: hashedPassword });

      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error en cambiarPassword:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // Registrar nuevo usuario (solo admin)
  registro: async (req, res) => {
    try {
      const { nombre, email, password, rol, local } = req.body;

      // Verificar que el email no exista
      const existente = await Usuario.findOne({ where: { email } });
      
      if (existente) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const usuario = await Usuario.create({
        nombre,
        email,
        password: hashedPassword,
        rol: rol || 'cajero',
        local: local || 1,
        activo: true
      });

      const { password: _, ...usuarioSinPassword } = usuario.toJSON();

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