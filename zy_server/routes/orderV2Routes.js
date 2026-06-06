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
// Reemplazar bloque de cobro (pagos + totales) desde JSON
router.put('/:id/cobro', orderV2Controller.replaceOrderCobro);
// Actualizar método de pago de un pago existente (solo compat/UI)
router.put('/:id/pagos/:pagoId', orderV2Controller.updatePaymentMethod);
// Actualizar monto de un pago existente
router.put('/:id/pagos/:pagoId/monto', orderV2Controller.updatePaymentAmount);
// Eliminar un pago existente
router.delete('/:id/pagos/:pagoId', orderV2Controller.deletePayment);

module.exports = router; 