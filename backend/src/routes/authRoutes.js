const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.get('/me', authMiddleware, authController.me);
router.post('/refresh', authMiddleware, authController.refresh);
router.post('/cambiar-password', authMiddleware, authController.cambiarPassword);
router.post('/registro', authMiddleware, authController.registro);

// ⭐ NUEVAS RUTAS - Intentos de acceso (solo administradores)
router.get('/intentos-acceso', authMiddleware, adminMiddleware, authController.getIntentosAcceso);
router.get('/estadisticas-intentos', authMiddleware, adminMiddleware, authController.getEstadisticasIntentos);

// Rutas de gestión de usuarios (solo administradores)
router.get('/usuarios', authMiddleware, adminMiddleware, authController.listarUsuarios);
router.get('/usuarios/:id', authMiddleware, adminMiddleware, authController.obtenerUsuario);
router.put('/usuarios/:id', authMiddleware, adminMiddleware, authController.actualizarUsuario);
router.delete('/usuarios/:id', authMiddleware, adminMiddleware, authController.eliminarUsuario);

router.get('/cajeros', authMiddleware, authController.getCajeros);

module.exports = router;