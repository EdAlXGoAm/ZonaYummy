const express = require('express');
const router = express.Router();
const platilloController = require('../controllers/platilloController');

// Ruta para obtener todos los platillos
router.get('/get/', platilloController.getPlatillos);

// Ruta para obtener un platillo específico por su ID
router.get('/get/:id', platilloController.getPlatillo);

// Ruta para añadir un nuevo platillo
router.post('/add/', platilloController.addPlatillo);

// Ruta para actualizar un platillo por su ID
router.put('/update/', platilloController.updatePlatillo);

// Ruta para eliminar un platillo por su ID
router.delete('/delete/:id', platilloController.deletePlatillo);

// Ruta para obtener el ultimo ID de todos los platillos
router.get('/getLastPlatilloId/', platilloController.getLastPlatilloId);

module.exports = router;