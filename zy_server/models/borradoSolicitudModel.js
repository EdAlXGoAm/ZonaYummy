const mongoose = require('mongoose');

const borradoSolicitudSchema = new mongoose.Schema({
    comandaMongoId: { type: String, required: true },
    OrderID: { type: Number, required: true },
    ComandaId: { type: Number },
    Platillo: { type: String },
    Precio: { type: Number },
    Imagen: { type: String },
    Categoria: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
});

const BorradoSolicitud = mongoose.model(
    'BorradoSolicitud',
    borradoSolicitudSchema,
    'zy-borrado-solicitudes',
);

module.exports = BorradoSolicitud;
