const express = require('express');
const router = express.Router();
const facturasPOSController = require('../controllers/facturasPOSController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Generar PDF de factura
router.get('/pdf/:pedido_id', facturasPOSController.generarFacturaPDF);

// Obtener datos de factura (para previsualización)
router.get('/datos/:pedido_id', facturasPOSController.obtenerDatosFactura);

module.exports = router;