const express = require('express');
const router = express.Router();
const orderV2Controller = require('../controllers/orderV2Controller');

// Endpoints para órdenes v2
// Listar todas las órdenes v2
router.get('/', orderV2Controller.getOrders);
// Obtener una orden por OrderID
router.get('/:id', orderV2Controller.getOrder);
// Agregar un pago parcial o total a una orden
router.post('/:id/pagos', orderV2Controller.addPayment);

module.exports = router; 