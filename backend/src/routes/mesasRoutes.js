const express = require('express');
const router = express.Router();
const mesasController = require('../controllers/mesasController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/locales', mesasController.getLocales);
router.get('/', mesasController.getAll);
router.get('/:id', mesasController.getOne);
router.post('/', mesasController.create);
router.put('/:id', mesasController.update);
router.patch('/:id/estado', mesasController.cambiarEstado);
router.delete('/:id', mesasController.delete);

module.exports = router;