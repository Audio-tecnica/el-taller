const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidosController');
const { authMiddleware } = require('../middleware/authMiddleware');  // ⭐ Agregar llaves
const { verificarTurnoActivo } = require('../middleware/turnoMiddleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// ⭐ Aplicar verificación de turno a operaciones críticas del POS
router.get('/abiertos', verificarTurnoActivo, pedidosController.getPedidosAbiertos);
router.get('/mesa/:mesa_id', verificarTurnoActivo, pedidosController.getPedidoMesa);
router.post('/abrir', verificarTurnoActivo, pedidosController.abrirPedido);
router.post('/:pedido_id/items', verificarTurnoActivo, pedidosController.agregarItem);
router.delete('/:pedido_id/items/:item_id', verificarTurnoActivo, pedidosController.quitarItem);
router.post('/:pedido_id/cerrar', verificarTurnoActivo, pedidosController.cerrarPedido);
router.put('/:pedido_id/cambiar-mesa', verificarTurnoActivo, pedidosController.cambiarMesa);
router.post('/:pedido_id/cancelar', verificarTurnoActivo, pedidosController.cancelarPedido);

module.exports = router;