const Comanda = require("../models/comandaModel");

exports.getComandas = (req, res) => {
    Comanda.find()
        .then((comandas) => res.json(comandas))
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.getComandasByOrderId = (req, res) => {
    Comanda.find({ OrderID: req.params.id })
        .then((comandas) => {
            res.json(comandas)
        })
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.getComanda = (req, res) => {
    Comanda.findOne({ ComandaId: req.params.id })
        .then((comanda) => res.json(comanda))
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.addComanda = (req, res) => {
    const date = new Date();
    const newComanda = new Comanda({
        OrderID: req.body.OrderID,
        ComandaId: req.body.ComandaId,
        Platillo: req.body.Platillo,
        Precio: req.body.Precio,
        Imagen: req.body.Imagen,
        ComandaPaidStatus: req.body.ComandaPaidStatus,
        ComandaPrepStatus: req.body.ComandaPrepStatus,
        ComandaDeliverMode: req.body.ComandaDeliverMode,
        ComandaSwitchNota: req.body.ComandaSwitchNota,
        Notas: req.body.Notas,
        Details: req.body.Details
    });

    newComanda
        .save()
        .then(() => res.json("Comanda added!"))
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.updateComanda = (req, res) => {
    Comanda.findOne({ _id: req.body._id })
        .then((comanda) => {
            comanda.OrderID = req.body.OrderID;
            comanda.ComandaId = req.body.ComandaId;
            comanda.Platillo = req.body.Platillo;
            comanda.Precio = req.body.Precio;
            comanda.Imagen = req.body.Imagen;
            comanda.ComandaPaidStatus = req.body.ComandaPaidStatus;
            comanda.ComandaPrepStatus = req.body.ComandaPrepStatus;
            comanda.ComandaDeliverMode = req.body.ComandaDeliverMode;
            comanda.ComandaSwitchNota = req.body.ComandaSwitchNota;
            comanda.Notas = req.body.Notas;
            comanda.Details = req.body.Details;

            comanda
                .save()
                .then(() => res.json("Comanda updated!"))
                .catch((err) => res.status(400).json("Error: " + err));
        })
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.deleteComanda = (req, res) => {
    // Elimina por el Nombre
    Comanda.findOneAndDelete({ _id: req.params.id })
        .then(() => res.json("Comanda deleted."))
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.getLasComandaId = (req, res) => {
    Comanda.find()
        .then((comandas) => {
            if (comandas.length === 0) {
                console.log("No hay comandas disponibles para mostrar.");
                return res.json(0);
            }
            else {
                console.log("Last comanda Id: ", comandas[comandas.length - 1].ComandaId)
                return res.json(comandas[comandas.length - 1].ComandaId);
            }
        })
        .catch((err) => res.status(400).json("Error: " + err));
}