import comandasApi from '../../../api/comandasApi';

export const normalizeComandasByOrder = (byOrder, orderList) => {
    const normalized = {};
    orderList.forEach((order) => {
        const key = Number(order.OrderID);
        const raw = byOrder?.[key]
            ?? byOrder?.[order.OrderID]
            ?? byOrder?.[String(order.OrderID)];
        normalized[key] = Array.isArray(raw) ? raw : [];
    });
    return normalized;
};

export const fetchComandasGroupedByOrder = async (orderList) => {
    if (!orderList?.length) {
        return {};
    }

    const orderIds = orderList.map((order) => order.OrderID);

    try {
        const byOrder = await comandasApi.getComandasByOrderIds(orderIds);
        return normalizeComandasByOrder(byOrder, orderList);
    } catch (bulkErr) {
        console.warn('Bulk comandas fetch failed, using per-order fallback:', bulkErr?.message || bulkErr);
        const results = await Promise.all(
            orderList.map((order) =>
                comandasApi.getComandasByOrderId(order.OrderID)
                    .then((comandas) => [Number(order.OrderID), comandas])
                    .catch(() => [Number(order.OrderID), []])
            )
        );
        return Object.fromEntries(results);
    }
};
