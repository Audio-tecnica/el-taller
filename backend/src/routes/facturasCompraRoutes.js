const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const pagosComprasController = require('../controllers/pagosComprasController');

// ⭐ RUTAS DE PAGOS DE COMPRAS
router.post(
  '/compras/:compra_id/pagos',
  authMiddleware,
  pagosComprasController.registrarPago
);

router.get(
  '/compras/:compra_id/pagos',
  authMiddleware,
  pagosComprasController.listarPagosCompra
);

router.get(
  '/pagos-compras',
  authMiddleware,
  pagosComprasController.listarPagos
);

router.get(
  '/pagos-compras/resumen',
  authMiddleware,
  pagosComprasController.obtenerResumen
);

router.post(
  '/pagos-compras/:pago_id/anular',
  authMiddleware,
  pagosComprasController.anularPago
);

module.exports = router;