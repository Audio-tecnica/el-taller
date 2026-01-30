const express = require('express');
const router = express.Router();
const ventasB2BController = require('../controllers/ventasB2BController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de consulta
router.get('/', ventasB2BController.obtenerVentas);
router.get('/resumen', ventasB2BController.obtenerResumenVentas);
router.get('/:id', ventasB2BController.obtenerVentaPorId);

// Crear venta (puede ser admin o cajero)
router.post('/', ventasB2BController.crearVenta);

// Rutas administrativas
router.delete('/:id', adminMiddleware, ventasB2BController.anularVenta);
router.post('/actualizar-mora', adminMiddleware, ventasB2BController.actualizarDiasMora);

module.exports = router;
