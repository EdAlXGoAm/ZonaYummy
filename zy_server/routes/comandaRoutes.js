const express = require('express');
const router = express.Router();
const comandaController = require('../controllers/comandaController');

// Ruta para obtener todos los platillos
router.get('/get/', comandaController.getComanda);

// Ruta para obtener todos los platillos por OrderID
router.get('/getByOrderId/:id', comandaController.getComandasByOrderId);

// Ruta para obtener un platillo específico por su ID
router.get('/get/:id', comandaController.getComanda);

// Ruta para añadir un nuevo platillo
router.post('/add/', comandaController.addComanda);

// Ruta para actualizar un platillo por su ID
router.put('/update/', comandaController.updateComanda);

// Ruta para eliminar un platillo por su ID
router.delete('/delete/:id', comandaController.deleteComanda);

module.exports = router;