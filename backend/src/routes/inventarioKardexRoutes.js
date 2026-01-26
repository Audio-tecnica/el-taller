const express = require("express");
const router = express.Router();

const inventarioKardexController = require("../controllers/inventarioKardexController");
const authMiddleware = require("../middleware/authMiddleware");

// Todas protegidas
router.use(authMiddleware);

// INVENTARIO (AGREGADOS)
router.get(
  "/valorizado",
  inventarioKardexController.getInventarioValorizado
);

// MOVIMIENTOS / KARDEX
router.get(
  "/movimientos",
  inventarioKardexController.getMovimientos
);

router.get(
  "/kardex/:producto_id",
  inventarioKardexController.getKardexProducto
);

// OPERACIONES
router.post(
  "/compra",
  inventarioKardexController.registrarCompra
);

router.post(
  "/ajustar",
  inventarioKardexController.ajustarInventario
);

router.post(
  "/transferir",
  inventarioKardexController.transferirEntreLocales
);


module.exports = router;
