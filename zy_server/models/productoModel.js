const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  Categoria: { type : String, },
  Proveedor: { type: String, },
  Producto: { type: String, required: true},
  Unidad: { type: String },
  Cantidad: { type: Number },
  Precios: [{
    fecha: {type: String},
    precio: {type: Number}
  }]
});

const Producto = mongoose.model('Producto', productoSchema, 'productos');

module.exports = Producto;
