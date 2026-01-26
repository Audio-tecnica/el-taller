const express = require("express");
const router = express.Router();

const inventarioKardexController = require("../controllers/inventarioKardexController");
const authMiddleware = require("../middleware/authMiddleware");

// Todas protegidas
router.use(authMiddleware);

// ================================
// INVENTARIO (AGREGADOS)
// ================================
router.get(
  "/valorizado",
  inventarioKardexController.obtenerInventarioValorizado
);

// ================================
// MOVIMIENTOS / KARDEX
// ================================
router.get(
  "/movimientos",
  inventarioKardexController.obtenerMovimientos
);

router.get(
  "/kardex/:producto_id",
  inventarioKardexController.obtenerKardexProducto
);

// ================================
// OPERACIONES
// ================================
router.post(
  "/compra",
  inventarioKardexController.registrarCompra
);

router.post(
  "/ajustar",
  inventarioKardexController.registrarAjuste
);

router.post(
  "/transferir",
  inventarioKardexController.registrarTransferencia
);

module.exports = router;
