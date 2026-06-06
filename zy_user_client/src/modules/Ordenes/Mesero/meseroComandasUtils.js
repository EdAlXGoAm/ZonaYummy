export const isPendingComandaDoc = (comanda) => String(comanda?._id ?? '').startsWith('pending-');

const isPendingComandaId = (id) => String(id ?? '').startsWith('pending-');

/**
 * Fusiona comandas duplicadas por ComandaId (p. ej. optimista pending-* + documento del servidor).
 * Prefiere el documento persistido sobre el placeholder pending-*.
 */
export const normalizeComandasList = (comandas = []) => {
    if (!comandas?.length) return [];

    const byComandaId = new Map();
    comandas.forEach((comanda) => {
        const comandaId = Number(comanda?.ComandaId);
        if (!Number.isFinite(comandaId)) return;

        const existing = byComandaId.get(comandaId);
        if (!existing) {
            byComandaId.set(comandaId, comanda);
            return;
        }

        const existingPending = isPendingComandaId(existing._id);
        const incomingPending = isPendingComandaId(comanda._id);

        if (existingPending && !incomingPending) {
            byComandaId.set(comandaId, comanda);
        } else if (!existingPending && incomingPending) {
            // conservar el documento del servidor
        } else {
            byComandaId.set(comandaId, comanda);
        }
    });

    return Array.from(byComandaId.values()).sort((a, b) => a.ComandaId - b.ComandaId);
};

export const getNextComandaId = (comandas = []) => {
    if (!comandas.length) return 1;
    const maxId = comandas.reduce(
        (max, c) => Math.max(max, Number(c?.ComandaId) || 0),
        0,
    );
    return maxId + 1;
};
