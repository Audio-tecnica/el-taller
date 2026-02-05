const express = require('express');
const router = express.Router();
const facturasPOSController = require('../controllers/facturasPOSController');

// Generar PDF de factura
router.get('/pdf/:pedido_id', facturasPOSController.generarFacturaPDF);

// Obtener datos de factura
router.get('/datos/:pedido_id', facturasPOSController.obtenerDatosFactura);

module.exports = router;