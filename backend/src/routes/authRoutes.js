const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login
router.post('/login', authController.login);

// Obtener usuario actual (requiere autenticación)
// router.get('/me', authMiddleware, authController.getMe);

module.exports = router;