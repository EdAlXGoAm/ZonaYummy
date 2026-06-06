const express = require('express');
const router = express.Router();
const borradoController = require('../controllers/borradoController');

router.post('/solicitar', borradoController.solicitarBorrado);
router.get('/pendientes', borradoController.getPendientes);
router.post('/proceder/:id', borradoController.procederBorrado);
router.post('/rechazar/:id', borradoController.rechazarBorrado);

module.exports = router;
