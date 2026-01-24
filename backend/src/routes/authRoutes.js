const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.get('/me', authMiddleware, authController.me);
router.post('/refresh', authMiddleware, authController.refresh);
router.post('/cambiar-password', authMiddleware, authController.cambiarPassword);
router.post('/registro', authMiddleware, authController.registro); // Solo admin puede registrar

module.exports = router;