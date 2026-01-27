const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.get('/me', authMiddleware, authController.me);
router.post('/refresh', authMiddleware, authController.refresh);
router.post('/cambiar-password', authMiddleware, authController.cambiarPassword);
router.post('/registro', authMiddleware, authController.registro); // Solo admin puede registrar

// ⭐ NUEVAS RUTAS - Intentos de acceso (solo administradores)
router.get('/intentos-acceso', authMiddleware, adminMiddleware, authController.getIntentosAcceso);
router.get('/estadisticas-intentos', authMiddleware, adminMiddleware, authController.getEstadisticasIntentos);

module.exports = router;
