const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new mongoose.Schema({
  OrderID: { type : Number, required: true, unique: true },
  OrderDate: { type: Date, required: true },
  OrderPaidStatus : { type: String, required: true },
  OrderPrepStatus : { type: String, required: true },
  OrderCustStatus : { type: String, required: true },
  Customer: { type: String },
  CuentaTotal: { type: Number},
  ComandasList: [Schema.Types.Mixed]
});

const Order = mongoose.model('Order', orderSchema, 'orders');

module.exports = Order;