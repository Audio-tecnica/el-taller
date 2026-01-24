const express = require('express');
const router = express.Router();
const barrilesController = require('../controllers/barrilesController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/activar', authMiddleware, barrilesController.activarBarril);
router.post('/desactivar', authMiddleware, barrilesController.desactivarBarril);
router.post('/vender-vaso', authMiddleware, barrilesController.venderVaso);

module.exports = router;