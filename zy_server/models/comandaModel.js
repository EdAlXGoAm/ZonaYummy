const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const comandaSchema = new mongoose.Schema({
  OrderID: { type : Number },
  ComandaId: { type : Number, required: true },
  ComandaId: { type : Number },
  Platillo: { type : String },
  Precio: { type : Number },
  Imagen: { type : String },
  ComandaPaidStatus: { type : String },
  ComandaPrepStatus: { type : String },
  ComandaDeliverMode: { type : String },
  ComandaSwitchNota: { type : Boolean },
  Notas: { type : String },
  Details: Schema.Types.Mixed
});

const Comanda = mongoose.model('Comanda', comandaSchema, 'test-zy-orders-comandas-online-2');

module.exports = Comanda;
