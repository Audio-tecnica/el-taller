const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');
const { authMiddleware } = require('../middleware/authMiddleware');  // ⭐ Agregar llaves

router.use(authMiddleware);

router.get('/', categoriasController.getAll);
router.get('/:id', categoriasController.getOne);
router.post('/', categoriasController.create);
router.put('/:id', categoriasController.update);
router.delete('/:id', categoriasController.delete);

module.exports = router;