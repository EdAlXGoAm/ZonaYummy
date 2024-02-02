const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Ruta para obtener todos los platillos
router.get('/get/', orderController.getOrders);

// Ruta para obtener un platillo específico por su ID
router.get('/get/:id', orderController.getOrder);

// Ruta para añadir un nuevo platillo
router.post('/add/', orderController.addOrder);

// Ruta para actualizar un platillo por su ID
router.put('/update/', orderController.updateOrder);

// Ruta para eliminar un platillo por su ID
router.delete('/delete/:id', orderController.deleteOrder);

// Ruta para obtener el ultimo ID de todos los platillos
router.get('/getLastOrderId/', orderController.getLastOrderId);

module.exports = router;