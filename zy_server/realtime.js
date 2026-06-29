let ioRef = null;

const attachIo = (io) => {
    ioRef = io;
};

const buildComandaDeleteMsg = (solicitud) => {
    const orderId = solicitud.OrderID;
    const comandaKey = solicitud.ComandaId != null
        ? solicitud.ComandaId
        : solicitud.comandaMongoId;
    return `Delete-${orderId}-${comandaKey}`;
};

const buildBorradoAprobadoPayload = (solicitud) => ({
    comandaMongoId: solicitud?.comandaMongoId,
    OrderID: solicitud?.OrderID,
    ComandaId: solicitud?.ComandaId,
    Platillo: solicitud?.Platillo,
});

const notifyComandaDeleted = (solicitud) => {
    if (!ioRef || !solicitud) return;
    ioRef.emit('DeleteComandaDesdeServidor', { msg: buildComandaDeleteMsg(solicitud) });
    ioRef.emit('OrdenActualizadaDesdeServidor', { msg: solicitud.OrderID });
    ioRef.emit('BorradoAprobadoDesdeServidor', buildBorradoAprobadoPayload(solicitud));
};

module.exports = {
    attachIo,
    buildComandaDeleteMsg,
    notifyComandaDeleted,
};
