const Order = require("../models/orderModel");

exports.getOrders = (req, res) => {
    Order.find()
        .then((orders) => res.json(orders))
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.getOrder = (req, res) => {
    Order.findOne({ OrderID: req.params.id })
        .then((order) => res.json(order))
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.addOrder = (req, res) => {
    const date = new Date();
    const newOrder = new Order({
        OrderID: req.body.OrderID,
        OrderDate: date,
        OrderPaidStatus: req.body.OrderPaidStatus,
        OrderPrepStatus: req.body.OrderPrepStatus,
        OrderCustStatus: req.body.OrderCustStatus,
        Customer: req.body.Customer,
        CuentaTotal: req.body.CuentaTotal,
        ComandasList: req.body.ComandasList
    });

    newOrder
        .save()
        .then(() => res.json("Order added!"))
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.updateOrder = (req, res) => {
    Order.findOne({ OrderID: req.body.OrderID })
        .then((order) => {
            order.OrderID = req.body.OrderID;
            order.OrderPaidStatus = req.body.OrderPaidStatus;
            order.OrderPrepStatus = req.body.OrderPrepStatus;
            order.OrderCustStatus = req.body.OrderCustStatus;
            order.Customer = req.body.Customer;
            order.CuentaTotal = req.body.CuentaTotal;
            order.ComandasList = req.body.ComandasList;

            order
                .save()
                .then(() => res.json("Order updated!"))
                .catch((err) => res.status(400).json("Error: " + err));
        })
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.deleteOrder = (req, res) => {
    // Elimina por el Nombre
    Order.findOneAndDelete({ OrderID: req.params.id })
        .then(() => res.json("Order deleted."))
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.getLastOrderId = (req, res) => {
    Order.find()
        .then((orders) => {
            if (orders.length === 0) {
                console.log("No hay ordenes disponibles para mostrar.");
                return res.json(0);
            }
            else {
                console.log("Last order Id: ", orders[orders.length - 1].OrderID)
                return res.json(orders[orders.length - 1].OrderID);
            }
        })
        .catch((err) => res.status(400).json("Error: " + err));
}

exports.getByOrderCustStatus = (req, res) => {
    Order.find({ OrderCustStatus: req.params.OrderCustStatus })
        .then((orders) => {
            res.json(orders)
        })
        .catch((err) => res.status(400).json("Error: " + err));
}