const express = require('express');
const router = express.Router();
const facturasPOSController = require('../controllers/facturasPOSController');
const authMiddleware = require('../middleware/authMiddleware');

// Generar PDF de factura (requiere autenticación)
router.get('/pdf/:pedido_id', authMiddleware, facturasPOSController.generarFacturaPDF);

// Obtener datos de factura (requiere autenticación)
router.get('/datos/:pedido_id', authMiddleware, facturasPOSController.obtenerDatosFactura);

module.exports = router;