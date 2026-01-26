const express = require('express');
const router = express.Router();
const reportesPremiumController = require('../controllers/reportesPremiumController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// ==========================================
// REPORTES DE VENTAS
// ==========================================
router.get('/ventas/hoy', reportesPremiumController.getVentasHoy);

// ==========================================
// REPORTES DE COMPRAS
// ==========================================
router.get('/compras/periodo', reportesPremiumController.getComprasPorPeriodo);

// ==========================================
// ANÁLISIS FINANCIERO
// ==========================================
router.get('/analisis/financiero', reportesPremiumController.getAnalisisFinanciero);
router.get('/productos/rentabilidad', reportesPremiumController.getProductosPorRentabilidad);

// ==========================================
// REPORTES DE INVENTARIO
// ==========================================
router.get('/inventario/movimientos', reportesPremiumController.getHistorialMovimientos);

module.exports = router;
