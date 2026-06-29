const mongoose = require('mongoose');
const BorradoSolicitud = require('../models/borradoSolicitudModel');
const Comanda = require('../models/comandaModel');
const { notifyComandaDeleted } = require('../realtime');

const isPlaceholderComandaId = (id) => {
    const value = String(id ?? '');
    return !value || value.startsWith('pending-') || !mongoose.Types.ObjectId.isValid(value);
};

const buildComandaDeleteFilter = (solicitud) => {
    if (!isPlaceholderComandaId(solicitud.comandaMongoId)) {
        return { _id: solicitud.comandaMongoId };
    }

    const filter = { OrderID: solicitud.OrderID };
    if (solicitud.ComandaId != null) {
        filter.ComandaId = solicitud.ComandaId;
    }
    return filter;
};

exports.solicitarBorrado = async (req, res) => {
    try {
        const { comandaMongoId } = req.body;
        if (!comandaMongoId) {
            return res.status(400).json({ error: 'comandaMongoId es requerido' });
        }
        if (isPlaceholderComandaId(comandaMongoId)) {
            return res.status(400).json({
                error: 'La comanda aún no está guardada en la base de datos. Espera a que se sincronice e intenta de nuevo.',
            });
        }

        const existente = await BorradoSolicitud.findOne({
            comandaMongoId,
            status: 'pending',
        });
        if (existente) {
            return res.status(409).json({ error: 'Ya existe una solicitud pendiente para esta comanda' });
        }

        const solicitud = new BorradoSolicitud({
            comandaMongoId: req.body.comandaMongoId,
            OrderID: req.body.OrderID,
            ComandaId: req.body.ComandaId,
            Platillo: req.body.Platillo,
            Precio: req.body.Precio,
            Imagen: req.body.Imagen,
            Categoria: req.body.Categoria,
        });

        await solicitud.save();
        res.json(solicitud);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getPendientes = async (req, res) => {
    try {
        const solicitudes = await BorradoSolicitud.find({ status: 'pending' })
            .sort({ requestedAt: 1 });
        res.json(solicitudes);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.procederBorrado = async (req, res) => {
    try {
        const solicitud = await BorradoSolicitud.findById(req.params.id);
        if (!solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        if (solicitud.status !== 'pending') {
            return res.status(400).json({ error: 'La solicitud ya fue procesada' });
        }

        const deleted = await Comanda.findOneAndDelete(buildComandaDeleteFilter(solicitud));

        solicitud.status = 'approved';
        solicitud.processedAt = new Date();
        await solicitud.save();

        notifyComandaDeleted(solicitud);

        res.json({
            success: true,
            solicitud,
            alreadyDeleted: !deleted,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.rechazarBorrado = async (req, res) => {
    try {
        const solicitud = await BorradoSolicitud.findById(req.params.id);
        if (!solicitud) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        if (solicitud.status !== 'pending') {
            return res.status(400).json({ error: 'La solicitud ya fue procesada' });
        }

        solicitud.status = 'rejected';
        solicitud.processedAt = new Date();
        await solicitud.save();

        res.json({ success: true, solicitud });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
