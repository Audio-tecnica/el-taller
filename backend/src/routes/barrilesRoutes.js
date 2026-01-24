const express = require('express');
const router = express.Router();
const barrilesController = require('../controllers/barrilesController');
const authMiddleware = require('../middleware/authMiddleware');

// Obtener barriles disponibles para activar en un local
router.get('/disponibles/:local', authMiddleware, barrilesController.getBarrilesDisponibles);

// Obtener barriles activos en un local
router.get('/activos/:local', authMiddleware, barrilesController.getBarrilesActivos);

// Activar barril
router.post('/activar', authMiddleware, barrilesController.activarBarril);

// Desactivar barril
router.post('/desactivar', authMiddleware, barrilesController.desactivarBarril);

// Vender vaso
router.post('/vender-vaso', authMiddleware, barrilesController.venderVaso);

// Ajustar vasos manualmente
router.post('/ajustar', authMiddleware, barrilesController.ajustarVasos);

module.exports = router;