const OrderV2 = require('../models/orderV2Model');
const Comanda = require('../models/comandaModel');

// Obtener todas las órdenes v2
exports.getOrders = async (req, res) => {
  try {
    const orders = await OrderV2.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener una orden v2 por OrderID
exports.getOrder = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await OrderV2.findOne({ OrderID: id });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Agregar un pago (parcial o total) a una orden v2
exports.addPayment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { monto, tipoPago, itemsPagados = [] } = req.body;
    const order = await OrderV2.findOne({ OrderID: id });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // Insertar registro de pago
    order.pagos.push({ monto, tipoPago, itemsPagados });
    // Actualizar montos
    order.pagado = (order.pagado || 0) + monto;
    order.pendiente = Math.max(order.CuentaTotal - order.pagado, 0);
    if (order.pendiente === 0) {
    }

    // Marcar comandas como cobradas en la colección de comandas
    if (itemsPagados.length > 0) {
      await Comanda.updateMany(
        { OrderID: order.OrderID, ComandaId: { $in: itemsPagados } },
        { $set: { ComandaPaidStatus: 'Paid' } }
      );
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 