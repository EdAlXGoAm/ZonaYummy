const BorradoSolicitud = require('../models/borradoSolicitudModel');
const Comanda = require('../models/comandaModel');

exports.solicitarBorrado = async (req, res) => {
    try {
        const { comandaMongoId } = req.body;
        if (!comandaMongoId) {
            return res.status(400).json({ error: 'comandaMongoId es requerido' });
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

        await Comanda.findOneAndDelete({ _id: solicitud.comandaMongoId });

        solicitud.status = 'approved';
        solicitud.processedAt = new Date();
        await solicitud.save();

        res.json({ success: true, solicitud });
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
