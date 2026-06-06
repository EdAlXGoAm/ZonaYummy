export const sumPagosMonto = (pagos = []) => (
    pagos.reduce((sum, p) => sum + (Number(p?.monto) || 0), 0)
);

export const getLiveComandasTotal = (comandas = []) => (
    comandas.reduce((sum, c) => sum + (Number(c?.Precio) || 0), 0)
);

const EPS = 0.009;

const collectExplicitlyPaidIds = (comandas = [], pagos = []) => {
    const paidByItemPayment = new Set(
        pagos
            .filter((p) => p.tipoPago === 'items')
            .flatMap((p) => (p.itemsPagados || []).map((id) => Number(id))),
    );

    const paidIds = new Set();
    comandas.forEach((comanda) => {
        const id = Number(comanda.ComandaId);
        if (comanda.ComandaPaidStatus === 'Paid' || paidByItemPayment.has(id)) {
            paidIds.add(id);
        }
    });

    return paidIds;
};

/**
 * Determina qué comandas siguen sin cobrar.
 * - Pagos por ítems: marcan ComandaId en itemsPagados o ComandaPaidStatus Paid.
 * - Pagos por monto: el saldo pendiente (total − cobrado) se asigna a los platillos
 *   no cubiertos explícitamente, empezando por los más recientes (ComandaId mayor).
 */
export const getUnpaidComandas = (comandas = [], pagos = []) => {
    const paidIds = collectExplicitlyPaidIds(comandas, pagos);
    const pending = getLiveComandasTotal(comandas) - sumPagosMonto(pagos);

    if (pending <= EPS) {
        return { unpaidComandas: [], paidItemIds: paidIds };
    }

    const candidates = [...comandas]
        .filter((c) => !paidIds.has(Number(c.ComandaId)))
        .sort((a, b) => b.ComandaId - a.ComandaId);

    const unpaid = [];
    let accumulated = 0;

    for (const comanda of candidates) {
        unpaid.push(comanda);
        accumulated += Number(comanda.Precio) || 0;
        if (accumulated >= pending - EPS) break;
    }

    unpaid.sort((a, b) => a.ComandaId - b.ComandaId);
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
        isExceeded: pending < -EPS,
        excesoMonto: pending < -EPS ? Math.abs(pending) : 0,
        isFullyPaid: pending <= EPS,
        unpaidComandas,
        paidItemIds,
    };
};
