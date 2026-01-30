const express = require('express');
const router = express.Router();
const barrilesController = require('../controllers/barrilesController');
const { authMiddleware } = require('../middleware/authMiddleware');  // ⭐ Agregar llaves

router.get('/disponibles/:local', authMiddleware, barrilesController.getBarrilesDisponibles);
router.get('/activos/:local', authMiddleware, barrilesController.getBarrilesActivos);
router.post('/activar', authMiddleware, barrilesController.activarBarril);
router.post('/desactivar', authMiddleware, barrilesController.desactivarBarril);
router.post('/vender-vaso', authMiddleware, barrilesController.venderVaso);
router.post('/ajustar', authMiddleware, barrilesController.ajustarVasos);

module.exports = router;