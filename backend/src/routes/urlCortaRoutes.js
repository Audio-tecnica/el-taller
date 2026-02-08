const express = require('express');
const router = express.Router();
const urlCortaController = require('../controllers/urlCortaController');
const { verificarToken } = require('../middleware/authMiddleware');

// Crear URL corta (requiere autenticación)
router.post('/', verificarToken, urlCortaController.crearUrlCorta);

// Obtener estadísticas (requiere autenticación)
router.get('/stats/:codigo', verificarToken, urlCortaController.obtenerEstadisticas);

// Desactivar URL (requiere autenticación)
router.delete('/:codigo', verificarToken, urlCortaController.desactivarUrl);

module.exports = router;
