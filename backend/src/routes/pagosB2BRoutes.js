const express = require('express');
const router = express.Router();
const pagosB2BController = require('../controllers/pagosB2BController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de consulta
router.get('/', pagosB2BController.obtenerPagos);
router.get('/resumen', pagosB2BController.obtenerResumenPagos);
router.get('/turno/:turno_id', pagosB2BController.obtenerPagosPorTurno);
router.get('/:id', pagosB2BController.obtenerPagoPorId);

// Registrar pago (puede ser admin o cajero)
router.post('/', pagosB2BController.registrarPago);

// Anular pago (solo admin)
router.delete('/:id', adminMiddleware, pagosB2BController.anularPago);

module.exports = router;
