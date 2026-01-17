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
    const { monto, tipoPago, itemsPagados = [], metodoPago = 'cash' } = req.body;
    const order = await OrderV2.findOne({ OrderID: id });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    // Insertar registro de pago
    order.pagos.push({ monto, tipoPago, itemsPagados, metodoPago });
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

// Actualizar método de pago de un pago existente (compatibilidad: si faltaba, se asume 'cash')
exports.updatePaymentMethod = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { pagoId } = req.params;
    const { metodoPago = 'cash' } = req.body;

    const allowed = new Set(['cash', 'card', 'transfer']);
    if (!allowed.has(metodoPago)) {
      return res.status(400).json({ error: 'metodoPago inválido' });
    }

    const order = await OrderV2.findOne({ OrderID: id });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const pago = order.pagos.id(pagoId);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

    pago.metodoPago = metodoPago;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar el monto de un pago existente
exports.updatePaymentAmount = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { pagoId } = req.params;
    const { monto } = req.body;

    if (typeof monto !== 'number' || monto < 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const order = await OrderV2.findOne({ OrderID: id });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const pago = order.pagos.id(pagoId);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

    const diferencia = monto - pago.monto;
    pago.monto = monto;

    // Recalcular pagado y pendiente
    order.pagado = (order.pagado || 0) + diferencia;
    order.pendiente = order.CuentaTotal - order.pagado;

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Eliminar un pago existente
exports.deletePayment = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { pagoId } = req.params;

    const order = await OrderV2.findOne({ OrderID: id });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

    const pago = order.pagos.id(pagoId);
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

    const montoEliminado = pago.monto;

    // Eliminar el pago del array
    order.pagos.pull(pagoId);

    // Recalcular pagado y pendiente
    order.pagado = Math.max(0, (order.pagado || 0) - montoEliminado);
    order.pendiente = order.CuentaTotal - order.pagado;

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};