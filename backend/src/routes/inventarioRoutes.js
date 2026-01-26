const express = require("express");
const router = express.Router();

const inventarioController = require("../controllers/inventarioController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Inventario
router.get("/consolidado", inventarioController.getInventarioConsolidado);
router.get("/movimientos", inventarioController.getMovimientos);
router.get(
  "/movimientos/:producto_id",
  inventarioController.getMovimientosProducto
);
router.post("/entrada", inventarioController.registrarEntrada);
router.post("/ajustar", inventarioController.ajustarInventario);
router.post("/transferir", inventarioController.transferirEntreLocales);

module.exports = router;
