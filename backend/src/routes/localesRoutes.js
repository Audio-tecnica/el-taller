const express = require('express');
const router = express.Router();
const localesController = require('../controllers/localesController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas principales
router.get('/', localesController.getLocales);
router.get('/:id', localesController.getLocalById);
router.post('/', localesController.createLocal);
router.put('/:id', localesController.updateLocal);
router.delete('/:id', localesController.deleteLocal);

module.exports = router;
