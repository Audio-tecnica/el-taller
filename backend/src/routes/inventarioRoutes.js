const express = require("express");
const router = express.Router();

const inventarioKardexController = require("../controllers/inventarioKardexController");
const authMiddleware = require("../middleware/authMiddleware");

// Todas las rutas protegidas
router.use(authMiddleware);

/**
 * INVENTARIO (calculado desde movimientos)
 */
router.get(
  "/consolidado",
  inventarioKardexController.obtenerInventarioConsolidado
);

/**
 * MOVIMIENTOS (KARDEX)
 */
router.get(
  "/movimientos",
  inventarioKardexController.obtenerMovimientos
);

router.get(
  "/movimientos/:producto_id",
  inventarioKardexController.obtenerMovimientosPorProducto
);

/**
 * OPERACIONES DE STOCK
 */
router.post(
  "/entrada",
  inventarioKardexController.registrarEntrada
);

router.post(
  "/ajuste",
  inventarioKardexController.registrarAjuste
);

router.post(
  "/transferencia",
  inventarioKardexController.registrarTransferencia
);

module.exports = router;

