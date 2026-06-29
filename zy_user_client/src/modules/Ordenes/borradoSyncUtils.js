export const buildComandaDeleteSocketMsg = (solicitud) => {
    const orderId = solicitud?.OrderID;
    const comandaKey = solicitud?.ComandaId != null
        ? solicitud.ComandaId
        : solicitud?.comandaMongoId;
    return `Delete-${orderId}-${comandaKey}`;
};

export const buildBorradoAprobadoPayload = (solicitud) => ({
    comandaMongoId: solicitud?.comandaMongoId,
    OrderID: solicitud?.OrderID,
    ComandaId: solicitud?.ComandaId,
    Platillo: solicitud?.Platillo,
});

export const comandaMatchesBorrado = (comanda, payload) => {
    if (!comanda || !payload) return false;
    if (payload.comandaMongoId && comanda._id) {
        return String(comanda._id) === String(payload.comandaMongoId);
    }
    if (payload.ComandaId != null && comanda.ComandaId != null) {
        return Number(comanda.ComandaId) === Number(payload.ComandaId);
    }
    return false;
};

export const filterComandasAfterBorrado = (comandas, payload) => (
    (comandas || []).filter((comanda) => !comandaMatchesBorrado(comanda, payload))
);
