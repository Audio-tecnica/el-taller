const express = require('express');
const router = express.Router();
const clientesB2BController = require('../controllers/clientesB2BController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas públicas (para usuarios autenticados)
router.get('/', clientesB2BController.obtenerClientes);
router.get('/resumen', clientesB2BController.obtenerResumenGeneral);
router.get('/:id', clientesB2BController.obtenerClientePorId);
router.get('/:id/historial-ventas', clientesB2BController.obtenerHistorialVentas);
router.get('/:id/estado-cuenta', clientesB2BController.obtenerEstadoCuenta);

// Rutas que requieren permisos de admin
router.post('/', adminMiddleware, clientesB2BController.crearCliente);
router.put('/:id', adminMiddleware, clientesB2BController.actualizarCliente);
router.patch('/:id/estado', adminMiddleware, clientesB2BController.cambiarEstado);
router.post('/:id/recalcular-credito', adminMiddleware, clientesB2BController.recalcularCredito);

module.exports = router;
