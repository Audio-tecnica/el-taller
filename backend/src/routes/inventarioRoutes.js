const express = require("express");
const router = express.Router();

const inventarioKardexController = require("../controllers/inventarioKardexController");
const authMiddleware = require("../middleware/authMiddleware");

// Todas las rutas protegidas
router.use(authMiddleware);

/**
 * MOVIMIENTOS (KARDEX)
 */
router.get(
  "/movimientos",
  inventarioKardexController.getMovimientos
);

router.get(
  "/movimientos/:producto_id",
  inventarioKardexController.getMovimientosPorProducto
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
  inventarioKardexController.ajustarInventario
);

router.post(
  "/transferencia",
  inventarioKardexController.transferirEntreLocales
);

module.exports = router;

