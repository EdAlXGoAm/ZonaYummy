export const RECENTLY_DELIVERED_TTL_MS = 10000;

export const isSameComanda = (a, b) => {
    if (a?._id && b?._id) {
        return a._id === b._id;
    }
    return Number(a?.OrderID) === Number(b?.OrderID)
        && Number(a?.ComandaId) === Number(b?.ComandaId);
};

export const getOrderSlotKey = (order) => `${order.orderId}-p${order.partNumber ?? 1}`;

export const pruneRecentlyDelivered = (recentlyDeliveredRef) => {
    const now = Date.now();
    recentlyDeliveredRef.current.forEach((timestamp, comandaId) => {
        if (now - timestamp > RECENTLY_DELIVERED_TTL_MS) {
            recentlyDeliveredRef.current.delete(comandaId);
        }
    });
};

export const filterOutRecentlyDelivered = (comandas, recentlyDeliveredRef) => {
    pruneRecentlyDelivered(recentlyDeliveredRef);
    if (recentlyDeliveredRef.current.size === 0) {
        return comandas;
    }
    return comandas.filter((comanda) => {
        const comandaId = comanda?._id;
        return !comandaId || !recentlyDeliveredRef.current.has(comandaId);
    });
};
