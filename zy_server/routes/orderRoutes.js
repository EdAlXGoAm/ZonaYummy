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

// Ruta para obtener el ultimo ID de todos los platillos
router.get('/getByOrderCustStatus/:OrderCustStatus', orderController.getByOrderCustStatus);

// Ruta para obtener la suma de CuentaTotal de órdenes de un día específico considerando offset de zona horaria
router.get('/getSumByDate/:date/:offset', orderController.getSumByDate);
// Ruta para obtener desglose de ventas por método de pago (cash/card/transfer) de un día específico
router.get('/getSumByDateV2Breakdown/:date/:offset', orderController.getSumByDateV2Breakdown);
// Conteo de platillos vendidos por día (basado en OrderDate) con desglose por variante
router.get('/getItemCountsByDate/:date/:offset', orderController.getItemCountsByDate);

module.exports = router;