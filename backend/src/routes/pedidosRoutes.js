const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/abiertos', pedidosController.getPedidosAbiertos);
router.get('/mesa/:mesa_id', pedidosController.getPedidoMesa);
router.post('/abrir', pedidosController.abrirPedido);
router.post('/:pedido_id/items', pedidosController.agregarItem);
router.delete('/:pedido_id/items/:item_id', pedidosController.quitarItem);
router.post('/:pedido_id/cerrar', pedidosController.cerrarPedido);
router.post('/:pedido_id/cancelar', pedidosController.cancelarPedido);

module.exports = router;