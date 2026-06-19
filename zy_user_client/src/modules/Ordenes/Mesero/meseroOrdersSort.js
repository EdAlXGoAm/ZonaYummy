// Active orders first, then closed; newest to oldest within each group.
export const sortMeseroOrdersActiveFirst = (orders) => {
    const active = [];
    const closed = [];

    orders.forEach((order) => {
        if (order.OrderCustStatus === 'Done') {
            closed.push(order);
        } else {
            active.push(order);
        }
    });

    const byNewest = (a, b) => Number(b.OrderID) - Number(a.OrderID);
    return [...active.sort(byNewest), ...closed.sort(byNewest)];
};
