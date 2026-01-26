const express = require('express');
const router = express.Router();
const inventarioKardexController = require('../controllers/inventarioKardexController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// ==========================================
// COMPRAS Y ENTRADAS
// ==========================================
router.post('/compra', inventarioKardexController.registrarCompra);
router.post('/devolucion-proveedor', inventarioKardexController.registrarDevolucionProveedor);

// ==========================================
// AJUSTES
// ==========================================
router.post('/ajustar', inventarioKardexController.ajustarInventario);
router.post('/merma', inventarioKardexController.registrarMerma);

// ==========================================
// TRANSFERENCIAS
// ==========================================
router.post('/transferir', inventarioKardexController.transferirEntreLocales);

// ==========================================
// CONSULTAS KARDEX
// ==========================================
router.get('/kardex/:producto_id', inventarioKardexController.getKardexProducto);
router.get('/movimientos', inventarioKardexController.getMovimientos);
router.get('/valorizado', inventarioKardexController.getInventarioValorizado);

module.exports = router;
