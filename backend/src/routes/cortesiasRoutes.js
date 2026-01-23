const express = require('express');
const router = express.Router();
const cortesiasController = require('../controllers/cortesiasController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', cortesiasController.getAll);
router.get('/resumen', cortesiasController.getResumen);

module.exports = router;