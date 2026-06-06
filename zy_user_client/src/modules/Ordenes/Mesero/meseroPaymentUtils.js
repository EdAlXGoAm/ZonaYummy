export const sumPagosMonto = (pagos = []) => (
    pagos.reduce((sum, p) => sum + (Number(p?.monto) || 0), 0)
);

export const getLiveComandasTotal = (comandas = []) => (
    comandas.reduce((sum, c) => sum + (Number(c?.Precio) || 0), 0)
);

/**
 * Determina qué comandas siguen sin cobrar.
 * - Pagos por ítems: marcan ComandaId en itemsPagados o ComandaPaidStatus Paid.
 * - Pagos por monto: asignan FIFO por ComandaId el monto ya cobrado.
 */
export const getUnpaidComandas = (comandas = [], pagos = []) => {
    const paidByItemPayment = new Set(
        pagos
            .filter((p) => p.tipoPago === 'items')
            .flatMap((p) => p.itemsPagados || []),
    );

    const paidIds = new Set();
    const unpaid = [];

    let montoPool = pagos
        .filter((p) => p.tipoPago === 'monto')
        .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

    const sorted = [...comandas].sort((a, b) => a.ComandaId - b.ComandaId);

    sorted.forEach((comanda) => {
        const id = comanda.ComandaId;

        if (comanda.ComandaPaidStatus === 'Paid' || paidByItemPayment.has(id)) {
            paidIds.add(id);
            return;
        }

        const precio = Number(comanda.Precio) || 0;
        if (montoPool >= precio) {
            montoPool -= precio;
            paidIds.add(id);
            return;
        }

        unpaid.push(comanda);
    });

    return { unpaidComandas: unpaid, paidItemIds: paidIds };
};

export const getPaymentSummary = (comandas = [], pagos = []) => {
    const liveTotal = getLiveComandasTotal(comandas);
    const pagado = sumPagosMonto(pagos);
    const pending = liveTotal - pagado;
    const { unpaidComandas, paidItemIds } = getUnpaidComandas(comandas, pagos);

    return {
        liveTotal,
        pagado,
        pending,
        pendingDisplay: Math.max(0, pending),
        isExceeded: pending < 0,
        excesoMonto: pending < 0 ? Math.abs(pending) : 0,
        isFullyPaid: pending === 0,
        unpaidComandas,
        paidItemIds,
    };
};
