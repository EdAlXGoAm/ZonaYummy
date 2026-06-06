const express = require('express');
const router = express.Router();
const comandaController = require('../controllers/comandaController');
const borradoController = require('../controllers/borradoController');

// Ruta para obtener todos los platillos
router.get('/get/', comandaController.getComanda);

// Ruta para obtener todos los platillos por OrderID
router.get('/getByOrderId/:id', comandaController.getComandasByOrderId);

// Ruta para obtener comandas de varias órdenes en una sola consulta
router.post('/getByOrderIds', comandaController.getComandasByOrderIds);

// Ruta para obtener un platillo específico por su ID
router.get('/get/:id', comandaController.getComanda);

// Ruta para añadir un nuevo platillo
router.post('/add/', comandaController.addComanda);

// Ruta para actualizar un platillo por su ID
router.put('/update/', comandaController.updateComanda);

// Ruta para eliminar un platillo por su ID
router.delete('/delete/:id', comandaController.deleteComanda);

// Solicitudes de borrado (bajo /api/comandas/borrados/…)
router.post('/borrados/solicitar', borradoController.solicitarBorrado);
router.get('/borrados/pendientes', borradoController.getPendientes);
router.post('/borrados/proceder/:id', borradoController.procederBorrado);
router.post('/borrados/rechazar/:id', borradoController.rechazarBorrado);

module.exports = router;