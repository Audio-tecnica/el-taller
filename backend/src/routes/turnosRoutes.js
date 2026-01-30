const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnosController');
const { authMiddleware } = require('../middleware/authMiddleware');  // ⭐ Agregar llaves

router.use(authMiddleware);

router.post('/abrir', turnosController.abrirTurno);
router.get('/mi-turno', turnosController.getMiTurnoActivo);
router.get('/activo/:local_id', turnosController.getTurnoActivo);
router.post('/:turno_id/cerrar', turnosController.cerrarTurno);
router.get('/historial', turnosController.getHistorial);

module.exports = router;