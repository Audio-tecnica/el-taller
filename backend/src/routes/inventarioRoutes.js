const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Inventario consolidado
router.get('/consolidado', inventarioController.getInventarioConsolidado);

// Inventario por local
router.get('/local/:local_id', inventarioController.getInventarioPorLocal);

// Productos con stock bajo
router.get('/alertas', inventarioController.getStockBajo);

// Ajustar inventario
router.post('/ajustar', inventarioController.ajustarInventario);

// Registrar entrada
router.post('/entrada', inventarioController.registrarEntrada);

// ⭐ NUEVO: Transferir entre locales
router.post('/transferir', inventarioController.transferirEntreLocales);

// Historial de movimientos
router.get('/movimientos', inventarioController.getMovimientos);

// Movimientos de un producto específico
router.get('/movimientos/:producto_id', inventarioController.getMovimientosProducto);

module.exports = router;