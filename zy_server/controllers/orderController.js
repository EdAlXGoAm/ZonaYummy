const Order = require("../models/orderV2Model");
const Comanda = require("../models/comandaModel");

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
            order.Origen = req.body.Origen || '';

            if (req.body.pagado !== undefined && req.body.pagado !== null) {
                order.pagado = req.body.pagado;
            }
            if (req.body.pendiente !== undefined && req.body.pendiente !== null) {
                order.pendiente = req.body.pendiente;
            } else if (req.body.CuentaTotal !== undefined && req.body.CuentaTotal !== null) {
                order.pendiente = order.CuentaTotal - (order.pagado || 0);
            }

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

    const nowUtc = new Date();
    let now_startOfDay = new Date(Date.UTC(
        nowUtc.getUTCFullYear(),
        nowUtc.getUTCMonth(),
        nowUtc.getUTCDate(),
        22, 0, 0, 0
    ));
    if (nowUtc.getTime() < now_startOfDay.getTime()) {
        now_startOfDay = new Date(now_startOfDay.getTime() - 24 * 60 * 60 * 1000);
    }
    const now_endOfDay = new Date(now_startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Crear fecha de inicio y fin del día actual en la hora de Ciudad de México
    const startOfDay = new Date("2025-04-09T00:00:00.000Z");
    //startOfDay.setHours(0,0,0,0); // Inicio del día en UTC
    const endOfDay = new Date("2025-04-14T00:00:00.000Z");

    //console.log(`VS TIME`);
    console.log(`Old StartOfDay: ${startOfDay}`);
    console.log(`Old EndOfDay: ${endOfDay}`);
    //endOfDay.setHours(23,59,59,999); // Final del día en UTC
    //console.log(`New StartOfDay: ${now_startOfDay}`);
    //console.log(`New EndOfDay: ${now_endOfDay}`);

    Order.find({
            OrderCustStatus: req.params.OrderCustStatus,
            OrderDate: {
                $gte: now_startOfDay,
                $lte: now_endOfDay
            }
        })
        .then((orders) => {
            res.json(orders)
        })
        .catch((err) => res.status(400).json("Error: " + err));
}

// Función para obtener la suma de CuentaTotal de órdenes de un día específico considerando offset de zona horaria
exports.getSumByDate = (req, res) => {
    const dateParam = req.params.date;
    const offsetParam = parseInt(req.params.offset, 10);
    if (isNaN(offsetParam)) {
        return res.status(400).json({ error: "Offset inválido" });
    }
    const partes = dateParam.split('-');
    if (partes.length !== 3) {
        return res.status(400).json({ error: "Formato de fecha inválido, use YYYY-MM-DD" });
    }
    const [year, month, day] = partes.map(n => parseInt(n, 10));
    if ([year, month, day].some(isNaN)) {
        return res.status(400).json({ error: "Fecha inválida" });
    }
    // Calcular inicio y fin de día en UTC según offset en horas (ej: -6)
    const startUtc = new Date(Date.UTC(year, month - 1, day, 0 - offsetParam, 0, 0, 0));
    const endUtc = new Date(Date.UTC(year, month - 1, day, 23 - offsetParam, 59, 59, 999));

    Order.aggregate([
        { $match: { OrderDate: { $gte: startUtc, $lte: endUtc } } },
        { $group: { _id: null, totalSum: { $sum: "$CuentaTotal" } } }
    ])
    .then(result => {
        const total = result.length > 0 ? result[0].totalSum : 0;
        res.json({ totalSum: total });
    })
    .catch(err => res.status(400).json({ error: "Error: " + err }));
};

// Función para obtener desglose de ventas por método de pago para un día específico considerando offset
// Fuente: pagos[] dentro de OrderV2. Se usa pagos.fecha (no OrderDate).
// Compatibilidad: si un pago no trae metodoPago, se considera 'cash'.
exports.getSumByDateV2Breakdown = (req, res) => {
    const dateParam = req.params.date;
    const offsetParam = parseInt(req.params.offset, 10);
    if (isNaN(offsetParam)) {
        return res.status(400).json({ error: "Offset inválido" });
    }
    const partes = dateParam.split('-');
    if (partes.length !== 3) {
        return res.status(400).json({ error: "Formato de fecha inválido, use YYYY-MM-DD" });
    }
    const [year, month, day] = partes.map(n => parseInt(n, 10));
    if ([year, month, day].some(isNaN)) {
        return res.status(400).json({ error: "Fecha inválida" });
    }

    const startUtc = new Date(Date.UTC(year, month - 1, day, 0 - offsetParam, 0, 0, 0));
    const endUtc = new Date(Date.UTC(year, month - 1, day, 23 - offsetParam, 59, 59, 999));

    Order.aggregate([
        { $unwind: "$pagos" },
        { $match: { "pagos.fecha": { $gte: startUtc, $lte: endUtc } } },
        {
            $group: {
                _id: { $ifNull: ["$pagos.metodoPago", "cash"] },
                total: { $sum: "$pagos.monto" }
            }
        }
    ])
    .then(result => {
        let cash = 0, card = 0, transfer = 0;
        result.forEach(r => {
            const key = (r && r._id) ? r._id : 'cash';
            if (key === 'card') card += r.total || 0;
            else if (key === 'transfer') transfer += r.total || 0;
            else cash += r.total || 0; // default cash + cualquier inesperado
        });
        const total = cash + card + transfer;
        res.json({ date: dateParam, cash, card, transfer, total });
    })
    .catch(err => res.status(400).json({ error: "Error: " + err }));
};

// Obtener órdenes de un día específico con sus pagos para el modal de balance
exports.getOrdersByDate = (req, res) => {
    const dateParam = req.params.date;
    const offsetParam = parseInt(req.params.offset, 10);
    if (isNaN(offsetParam)) {
        return res.status(400).json({ error: "Offset inválido" });
    }
    const partes = dateParam.split('-');
    if (partes.length !== 3) {
        return res.status(400).json({ error: "Formato de fecha inválido, use YYYY-MM-DD" });
    }
    const [year, month, day] = partes.map(n => parseInt(n, 10));
    if ([year, month, day].some(isNaN)) {
        return res.status(400).json({ error: "Fecha inválida" });
    }

    const startUtc = new Date(Date.UTC(year, month - 1, day, 0 - offsetParam, 0, 0, 0));
    const endUtc = new Date(Date.UTC(year, month - 1, day, 23 - offsetParam, 59, 59, 999));

    Order.find({
        OrderDate: { $gte: startUtc, $lte: endUtc }
    })
    .select('OrderID OrderDate CuentaTotal Customer pagado pendiente pagos')
    .sort({ OrderID: 1 })
    .then(orders => {
        res.json({ date: dateParam, orders });
    })
    .catch(err => res.status(400).json({ error: "Error: " + err }));
};

// Conteo de platillos/variantes vendidos por día (basado en OrderDate) considerando offset
exports.getItemCountsByDate = (req, res) => {
    const dateParam = req.params.date;
    const offsetParam = parseInt(req.params.offset, 10);
    if (isNaN(offsetParam)) {
        return res.status(400).json({ error: "Offset inválido" });
    }
    const partes = dateParam.split('-');
    if (partes.length !== 3) {
        return res.status(400).json({ error: "Formato de fecha inválido, use YYYY-MM-DD" });
    }
    const [year, month, day] = partes.map(n => parseInt(n, 10));
    if ([year, month, day].some(isNaN)) {
        return res.status(400).json({ error: "Fecha inválida" });
    }

    const startUtc = new Date(Date.UTC(year, month - 1, day, 0 - offsetParam, 0, 0, 0));
    const endUtc = new Date(Date.UTC(year, month - 1, day, 23 - offsetParam, 59, 59, 999));

    // Join Comandas -> Orders por OrderID para filtrar por OrderDate
    Comanda.aggregate([
        {
            $lookup: {
                from: "zy-jorders-temp-241024",
                localField: "OrderID",
                foreignField: "OrderID",
                as: "order"
            }
        },
        { $unwind: "$order" },
        { $match: { "order.OrderDate": { $gte: startUtc, $lte: endUtc } } },
        {
            $addFields: {
                variantName: {
                    $let: {
                        vars: {
                            sel: { $ifNull: ["$Details.SelectedVariant", null] },
                            varsArr: { $ifNull: ["$Details.Variants", []] }
                        },
                        in: {
                            $let: {
                                vars: { v: { $arrayElemAt: ["$$varsArr", "$$sel"] } },
                                in: { $ifNull: ["$$v.VariantName", ""] }
                            }
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: {
                    Platillo: { $ifNull: ["$Platillo", ""] },
                    Variante: { $ifNull: ["$variantName", ""] }
                },
                qty: { $sum: 1 }
            }
        },
        { $sort: { qty: -1, "_id.Platillo": 1, "_id.Variante": 1 } }
    ])
    .then(result => {
        const items = result.map(r => ({
            platillo: r._id?.Platillo || '',
            variante: r._id?.Variante || '',
            qty: r.qty || 0
        }));
        res.json({ date: dateParam, items });
    })
    .catch(err => res.status(400).json({ error: "Error: " + err }));
};