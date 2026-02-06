const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  generarPDFFactura,
  descargarPDFFactura,
  editarFactura,
  anularFactura
} = require('../controllers/facturasCompraController');

router.use(authMiddleware);

router.post('/:id/generar-pdf', generarPDFFactura);
router.get('/:id/descargar-pdf', descargarPDFFactura);
router.put('/:id/editar', editarFactura);
router.put('/:id/anular', anularFactura);

module.exports = router;