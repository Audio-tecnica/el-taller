const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Usuario, Local, Turno, IntentoAcceso } = require("../models");
const { Op } = require("sequelize");

const JWT_SECRET = process.env.JWT_SECRET || "el_taller_secret_2024";
const JWT_EXPIRES_IN = "24h";

const authController = {
  // Login con control de turnos para cajeros
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const ip_address = req.ip || req.connection.remoteAddress;
      const user_agent = req.headers["user-agent"];

      // Buscar usuario
      const usuario = await Usuario.findOne({
        where: { email },
        include: [{ model: Local, as: "local", attributes: ["id", "nombre"] }],
      });

      if (!usuario) {
        // Registrar intento fallido - usuario no encontrado
        await IntentoAcceso.create({
          usuario_id: null,
          email,
          exitoso: false,
          motivo_rechazo: "Usuario no encontrado",
          ip_address,
          user_agent,
        });

        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Validar password
      const passwordValida = await bcrypt.compare(
        password,
        usuario.password_hash,
      );

      if (!passwordValida) {
        // Registrar intento fallido - contraseña incorrecta
        await IntentoAcceso.create({
          usuario_id: usuario.id,
          email,
          exitoso: false,
          motivo_rechazo: "Contraseña incorrecta",
          ip_address,
          user_agent,
        });

        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      if (!usuario.activo) {
        // Registrar intento fallido - usuario desactivado
        await IntentoAcceso.create({
          usuario_id: usuario.id,
          email,
          exitoso: false,
          motivo_rechazo: "Usuario desactivado",
          ip_address,
          user_agent,
        });

        return res.status(401).json({ error: "Usuario desactivado" });
      }

      // ⭐ VALIDACIÓN PARA CAJEROS - Solo pueden entrar si tienen turno abierto
      let turnoActivoCajero = null;

      if (usuario.rol === "cajero") {
        // Buscar turno activo DEL CAJERO (usar cajero_id)
        turnoActivoCajero = await Turno.findOne({
          where: {
            cajero_id: usuario.id,
            estado: "abierto",
          },
          include: [{ model: Local, as: "local" }],
        });

        if (!turnoActivoCajero) {
          // Registrar intento bloqueado
          await IntentoAcceso.create({
            usuario_id: usuario.id,
            email,
            exitoso: false,
            motivo_rechazo: "Sin turno abierto - acceso denegado",
            ip_address,
            user_agent,
          });

          return res.status(403).json({
            error:
              "No tienes un turno abierto. Espera a que el administrador te asigne un turno.",
            codigo: "SIN_TURNO_ABIERTO",
          });
        }
      }

      // ⭐ Determinar el local correcto: del turno activo o del usuario
      const localParaToken = turnoActivoCajero
        ? turnoActivoCajero.local_id
        : usuario.local_asignado_id;

      // Login exitoso - Generar token
      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol,
          local: localParaToken, // ⭐ Usar el local del turno para cajeros
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      // Registrar intento exitoso
      await IntentoAcceso.create({
        usuario_id: usuario.id,
        email,
        exitoso: true,
        motivo_rechazo: null,
        ip_address,
        user_agent,
      });

      const { password_hash: _, ...usuarioSinPassword } = usuario.toJSON();

      // ⭐ Agregar información del turno activo para cajeros
      const respuestaUsuario = {
        ...usuarioSinPassword,
        turno_activo: turnoActivoCajero
          ? {
              id: turnoActivoCajero.id,
              local_id: turnoActivoCajero.local_id,
              local_nombre: turnoActivoCajero.local?.nombre,
            }
          : null,
        // ⭐ Sobrescribir local_asignado_id con el del turno activo para cajeros
        local_asignado_id: turnoActivoCajero
          ? turnoActivoCajero.local_id
          : usuario.local_asignado_id,
      };

      res.json({
        message: "Login exitoso",
        token,
        user: respuestaUsuario,
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },

  // ⭐ NUEVO: Obtener historial de intentos de acceso (solo admin)
  getIntentosAcceso: async (req, res) => {
    try {
      const { limit = 50, solo_bloqueados = "false" } = req.query;

      const where = {};
      if (solo_bloqueados === "true") {
        where.exitoso = false;
      }

      const intentos = await IntentoAcceso.findAll({
        where,
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id", "nombre", "email", "rol"],
            required: false, // LEFT JOIN para incluir intentos sin usuario
          },
        ],
        order: [["fecha_intento", "DESC"]],
        limit: parseInt(limit),
      });

      res.json(intentos);
    } catch (error) {
      console.error("Error obteniendo intentos:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ⭐ NUEVO: Obtener estadísticas de intentos
  getEstadisticasIntentos: async (req, res) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const [totalHoy, bloqueadosHoy, exitososHoy] = await Promise.all([
        IntentoAcceso.count({
          where: { fecha_intento: { [Op.gte]: hoy } },
        }),
        IntentoAcceso.count({
          where: {
            fecha_intento: { [Op.gte]: hoy },
            exitoso: false,
          },
        }),
        IntentoAcceso.count({
          where: {
            fecha_intento: { [Op.gte]: hoy },
            exitoso: true,
          },
        }),
      ]);

      res.json({
        hoy: {
          total: totalHoy,
          bloqueados: bloqueadosHoy,
          exitosos: exitososHoy,
        },
      });
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener usuario actual
  me: async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.usuario.id, {
        // ⭐ req.usuario
        attributes: { exclude: ["password_hash"] },
      });

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({ user: usuario });
    } catch (error) {
      console.error("Error en me:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },

  // Línea 245 - función refresh
  refresh: async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.usuario.id, {
        // ⭐ req.usuario
        attributes: { exclude: ["password_hash"] },
      });

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      if (!usuario.activo) {
        return res.status(401).json({ error: "Usuario desactivado" });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol,
          local: usuario.local_asignado_id,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      res.json({
        message: "Token refrescado",
        token,
        user: usuario,
      });
    } catch (error) {
      console.error("Error en refresh:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },

  // Cambiar contraseña
  cambiarPassword: async (req, res) => {
    try {
      const { passwordActual, passwordNueva } = req.body;

      const usuario = await Usuario.findByPk(req.usuario.id); // ⭐ req.usuario

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const passwordValida = await bcrypt.compare(
        passwordActual,
        usuario.password_hash,
      );

      if (!passwordValida) {
        return res.status(401).json({ error: "Contraseña actual incorrecta" });
      }

      const hashedPassword = await bcrypt.hash(passwordNueva, 10);
      await usuario.update({ password_hash: hashedPassword });

      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error en cambiarPassword:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },

  // Registrar nuevo usuario (solo admin)
  registro: async (req, res) => {
    try {
      const { nombre, email, password, rol, local_asignado_id } = req.body;

      const existente = await Usuario.findOne({ where: { email } });

      if (existente) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      const usuario = await Usuario.create({
        nombre,
        email,
        password_hash: password, // El hook beforeCreate lo hashea
        rol: rol || "cajero",
        local_asignado_id: local_asignado_id || null,
        activo: true,
      });

      const { password_hash: _, ...usuarioSinPassword } = usuario.toJSON();

      res.status(201).json({
        message: "Usuario creado exitosamente",
        user: usuarioSinPassword,
      });
    } catch (error) {
      console.error("Error en registro:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },

  // Listar todos los usuarios (solo admin)
  listarUsuarios: async (req, res) => {
    try {
      const usuarios = await Usuario.findAll({
        attributes: { exclude: ["password_hash"] },
        include: [{ model: Local, as: "local", attributes: ["id", "nombre"] }],
        order: [["created_at", "DESC"]],
      });

      res.json(usuarios);
    } catch (error) {
      console.error("Error listando usuarios:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener un usuario específico (solo admin)
  obtenerUsuario: async (req, res) => {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id, {
        attributes: { exclude: ["password_hash"] },
        include: [{ model: Local, as: "local", attributes: ["id", "nombre"] }],
      });

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json(usuario);
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar usuario (solo admin)
  actualizarUsuario: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, email, password, rol, local_asignado_id, activo } =
        req.body;

      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Preparar datos para actualizar
      const updateData = {
        nombre,
        email,
        rol,
        local_asignado_id,
        activo,
      };

      // Solo actualizar password si se proporcionó uno nuevo
      if (password && password.trim() !== "") {
        updateData.password_hash = await bcrypt.hash(password, 10);
      }

      await usuario.update(updateData);

      const { password_hash: _, ...usuarioSinPassword } = usuario.toJSON();

      res.json({
        message: "Usuario actualizado exitosamente",
        user: usuarioSinPassword,
      });
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar usuario (solo admin)
  eliminarUsuario: async (req, res) => {
    try {
      const { id } = req.params;

      // No permitir eliminar al usuario actual
      if (id === req.usuario.id) {
        // ⭐ req.usuario
        return res
          .status(400)
          .json({ error: "No puedes eliminar tu propio usuario" });
      }

      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      await usuario.destroy();

      res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ⭐ CORREGIDO: Obtener cajeros activos + administradores
  getCajeros: async (req, res) => {
    try {
      const { local_id } = req.query;
      
      console.log('📋 ===== GET CAJEROS =====');
      console.log('🏢 Local solicitado:', local_id);
      console.log('👤 Usuario solicitante:', req.usuario.id, '-', req.usuario.nombre, '-', req.usuario.rol);

      // ⭐ ESTRATEGIA: Obtener cajeros del local + TODOS los administradores activos
      
      // 1. Obtener cajeros del local específico
      const whereCajeros = {
        activo: true,
        rol: "cajero",
      };

      if (local_id) {
        whereCajeros.local_asignado_id = local_id;
        console.log('🔍 Filtrando cajeros por local:', local_id);
      } else {
        console.log('🔍 Obteniendo TODOS los cajeros activos (sin filtro de local)');
      }

      const cajeros = await Usuario.findAll({
        where: whereCajeros,
        attributes: ["id", "nombre", "email", "rol", "local_asignado_id"],
        include: [
          {
            model: Local,
            as: "local",
            attributes: ["id", "nombre"],
          },
        ],
        order: [["nombre", "ASC"]],
      });

      console.log(`✅ Encontrados ${cajeros.length} cajeros del local`);
      
      // 2. Obtener TODOS los administradores activos (pueden abrir turno en cualquier local)
      const administradores = await Usuario.findAll({
        where: {
          activo: true,
          rol: "administrador",
        },
        attributes: ["id", "nombre", "email", "rol", "local_asignado_id"],
        include: [
          {
            model: Local,
            as: "local",
            attributes: ["id", "nombre"],
          },
        ],
        order: [["nombre", "ASC"]],
      });

      console.log(`✅ Encontrados ${administradores.length} administradores activos`);

      // 3. Combinar cajeros + administradores
      const usuariosDisponibles = [...administradores, ...cajeros];

      console.log(`✅ Total usuarios disponibles: ${usuariosDisponibles.length}`);
      usuariosDisponibles.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.nombre} (${u.rol}) - Local: ${u.local?.nombre || 'Todos los locales'}`);
      });

      res.json(usuariosDisponibles);
    } catch (error) {
      console.error('❌ Error obteniendo cajeros:', error);
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = authController;