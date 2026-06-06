export const buildComandasByOrderId = (comandas, orders) => {
    const byOrder = {};

    orders.forEach((order) => {
        byOrder[Number(order.OrderID)] = [];
    });

    comandas.forEach((comanda) => {
        const orderId = Number(comanda.OrderID);
        if (!byOrder[orderId]) return;
        byOrder[orderId].push(comanda);
    });

    return byOrder;
};
