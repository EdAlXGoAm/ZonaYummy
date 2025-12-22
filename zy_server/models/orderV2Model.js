const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema para pagos parciales/fin de orden
const paymentSchema = new Schema({
  fecha: { type: Date, default: Date.now },
  monto: { type: Number, required: true },
  tipoPago: { type: String, enum: ['monto','items'], default: 'monto' },
  // Compatibilidad: si no existe en registros viejos, se asume 'cash' (efectivo)
  metodoPago: { type: String, enum: ['cash','card','transfer'], default: 'cash' },
  itemsPagados: [ Number ]
});

// Esquema de orden versión 2 que incluye pagos
const orderV2Schema = new mongoose.Schema({
  OrderID:          { type: Number, required: true, unique: true },
  OrderDate:        { type: Date,   required: true },
  OrderPaidStatus:  { type: String, required: true },
  OrderPrepStatus:  { type: String, required: true },
  OrderCustStatus:  { type: String, required: true },
  Customer:         { type: String },
  CuentaTotal:      { type: Number },
  Origen:           { type: String, default: '' },
  pagado:           { type: Number, default: 0 },
  pendiente:        { type: Number, default: function() { return this.CuentaTotal; } },
  pagos:            [ paymentSchema ]
});

// Se especifica un nuevo nombre de colección para no solapar con la anterior
const OrderV2 = mongoose.model('OrderV2', orderV2Schema, 'zy-jorders-temp-241024');

module.exports = OrderV2; 