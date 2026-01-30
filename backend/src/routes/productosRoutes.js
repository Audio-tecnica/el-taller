const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { authMiddleware } = require('../middleware/authMiddleware');  // ⭐ Agregar llaves

router.use(authMiddleware);

router.get('/', productosController.getAll);
router.get('/stock-bajo', productosController.getStockBajo);
router.get('/:id', productosController.getOne);
router.post('/', productosController.create);
router.put('/:id', productosController.update);
router.delete('/:id', productosController.delete);

module.exports = router;