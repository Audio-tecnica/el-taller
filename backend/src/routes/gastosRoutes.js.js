const express = require('express');
const router = express.Router();
const gastosController = require('../controllers/gastosController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas principales
router.get('/', gastosController.getGastos);
router.get('/categorias', gastosController.getCategorias);
router.get('/resumen', gastosController.getResumenGastos);
router.get('/:id', gastosController.getGastoById);
router.post('/', gastosController.createGasto);
router.put('/:id', gastosController.updateGasto);
router.delete('/:id', gastosController.deleteGasto);

module.exports = router;