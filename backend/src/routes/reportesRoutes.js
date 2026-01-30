const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { authMiddleware } = require('../middleware/authMiddleware');  // ⭐ Agregar llaves

router.use(authMiddleware);
// Dashboard resumen
router.get('/dashboard', reportesController.getDashboard);

// Ventas de hoy
router.get('/ventas/hoy', reportesController.getVentasHoy);

// Ventas por rango de fechas
router.get('/ventas/rango', reportesController.getVentasPorRango);

// Productos más vendidos
router.get('/productos/top', reportesController.getProductosMasVendidos);

// Ventas por categoría
router.get('/ventas/categorias', reportesController.getVentasPorCategoria);

// Cortesías
router.get('/cortesias', reportesController.getCortesias);

module.exports = router;