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

// Reportes nuevos
router.get('/ventas/detalladas', reportesController.getVentasDetalladas);
router.get('/gastos', reportesController.getGastos);
router.get('/compras/detalladas', reportesController.getComprasDetalladas);
router.get('/inventario/valorizado', reportesController.getInventarioValorizado);
router.get('/inventario/kardex', reportesController.getKardex);
router.get('/utilidad', reportesController.getEstadoResultados);
router.get('/cierre-caja', reportesController.getCierreCaja);

module.exports = router;