const express = require('express');
const router = express.Router();
const impuestosController = require('../controllers/impuestosController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// ═══════════════════════════════════════════════════════════════════
// CATÁLOGO DE IMPUESTOS
// ═══════════════════════════════════════════════════════════════════

// GET /api/impuestos - Obtener todos los impuestos
router.get('/', impuestosController.obtenerImpuestos);

// GET /api/impuestos/:id - Obtener impuesto por ID
router.get('/:id', impuestosController.obtenerImpuestoPorId);

// POST /api/impuestos - Crear nuevo impuesto
router.post('/', impuestosController.crearImpuesto);

// PUT /api/impuestos/:id - Actualizar impuesto
router.put('/:id', impuestosController.actualizarImpuesto);

// DELETE /api/impuestos/:id - Eliminar (desactivar) impuesto
router.delete('/:id', impuestosController.eliminarImpuesto);

// ═══════════════════════════════════════════════════════════════════
// IMPUESTOS POR CLIENTE
// ═══════════════════════════════════════════════════════════════════

// GET /api/impuestos/cliente/:clienteId - Obtener impuestos de un cliente
router.get('/cliente/:clienteId', impuestosController.obtenerImpuestosCliente);

// POST /api/impuestos/cliente/:clienteId - Asignar múltiples impuestos a un cliente
router.post('/cliente/:clienteId', impuestosController.asignarImpuestosCliente);

// POST /api/impuestos/cliente/:clienteId/agregar - Agregar un impuesto a un cliente
router.post('/cliente/:clienteId/agregar', impuestosController.agregarImpuestoCliente);

// DELETE /api/impuestos/cliente/:clienteId/:impuestoId - Quitar impuesto de un cliente
router.delete('/cliente/:clienteId/:impuestoId', impuestosController.quitarImpuestoCliente);

// ═══════════════════════════════════════════════════════════════════
// CÁLCULO DE IMPUESTOS
// ═══════════════════════════════════════════════════════════════════

// POST /api/impuestos/calcular - Calcular impuestos (preview)
router.post('/calcular', impuestosController.calcularImpuestos);

module.exports = router;
