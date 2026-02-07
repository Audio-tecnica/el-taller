const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const facturasCompraController = require('../controllers/facturasCompraController');
const pagosComprasController = require('../controllers/pagosComprasController');

// ========================================
// RUTAS DE FACTURAS Y PDFs
// ========================================

// Generar PDF de factura de compra
router.post(
  '/:id/generar-pdf',
  authMiddleware,
  facturasCompraController.generarPDFFactura
);

// Descargar PDF de factura
router.get(
  '/:id/descargar-pdf',
  authMiddleware,
  facturasCompraController.descargarPDFFactura
);

// Editar factura (solo si está pendiente)
router.put(
  '/:id',
  authMiddleware,
  facturasCompraController.editarFactura
);

// Anular factura
router.post(
  '/:id/anular',
  authMiddleware,
  facturasCompraController.anularFactura
);

// ========================================
// RUTAS DE PAGOS DE COMPRAS
// ========================================

// Registrar pago de compra
router.post(
  '/:compra_id/pagos',
  authMiddleware,
  pagosComprasController.registrarPago
);

// Listar pagos de una compra específica
router.get(
  '/:compra_id/pagos',
  authMiddleware,
  pagosComprasController.listarPagosCompra
);

// Listar todos los pagos (con filtros)
router.get(
  '/pagos/lista',
  authMiddleware,
  pagosComprasController.listarPagos
);

// Obtener resumen de pagos
router.get(
  '/pagos/resumen',
  authMiddleware,
  pagosComprasController.obtenerResumen
);

// Anular pago
router.post(
  '/pagos/:pago_id/anular',
  authMiddleware,
  pagosComprasController.anularPago
);

module.exports = router;