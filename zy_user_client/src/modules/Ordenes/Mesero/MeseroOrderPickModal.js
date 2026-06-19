import './MeseroOrderPickModal.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchComandasGroupedByOrder } from './meseroComandasCache';
import { sortMeseroOrdersActiveFirst } from './meseroOrdersSort';

const MAX_BUBBLES = 7;

const isComandaDelivered = (comanda) => (
    comanda.ComandaPrepStatus === 'ReadyToServe'
    || comanda.ComandaPrepStatus === 'Served'
);

const hasCacheEntry = (cache, orderId) => (
    Object.prototype.hasOwnProperty.call(cache, Number(orderId))
);

const resolveComandas = (cache, orderId) => {
    const key = Number(orderId);
    return cache[key] || cache[orderId] || cache[String(orderId)] || [];
};

const MeseroOrderPickModal = ({ orders, comandasByOrder = {}, onSelectOrder, onClose }) => {
    const sortedOrders = useMemo(() => sortMeseroOrdersActiveFirst(orders), [orders]);
    const [localComandasByOrder, setLocalComandasByOrder] = useState(comandasByOrder);
    const fetchedOrderIdsRef = useRef(new Set());

    useEffect(() => {
        setLocalComandasByOrder((prev) => ({ ...prev, ...comandasByOrder }));
    }, [comandasByOrder]);

    useEffect(() => {
        let cancelled = false;

        const missingOrders = sortedOrders.filter((order) => {
            const key = Number(order.OrderID);
            if (hasCacheEntry(comandasByOrder, key)) return false;
            if (hasCacheEntry(localComandasByOrder, key)) return false;
            if (fetchedOrderIdsRef.current.has(key)) return false;
            return true;
        });

        if (!missingOrders.length) return undefined;

        missingOrders.forEach((order) => {
            fetchedOrderIdsRef.current.add(Number(order.OrderID));
        });

        const fillMissing = async () => {
            try {
                const normalized = await fetchComandasGroupedByOrder(missingOrders);
                if (cancelled) return;
                setLocalComandasByOrder((prev) => ({
                    ...prev,
                    ...normalized,
                }));
            } catch {
                if (cancelled) return;
            }
        };

        fillMissing();
        return () => { cancelled = true; };
    }, [sortedOrders, comandasByOrder, localComandasByOrder]);

    return createPortal(
        <div className="mesero-order-pick-overlay" onClick={onClose}>
            <div
                className="mesero-order-pick"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="mesero-order-pick-title"
            >
                <div className="mesero-order-pick__header">
                    <h2 id="mesero-order-pick-title" className="mesero-order-pick__title">
                        Seleccionar orden
                    </h2>
                    <button
                        type="button"
                        className="mesero-order-pick__close"
                        onClick={onClose}
                        title="Cerrar"
                        aria-label="Cerrar selector de órdenes"
                    >
                        ✕
                    </button>
                </div>

                <div className="mesero-order-pick__body">
                    <ul className="mesero-order-pick__list">
                        {sortedOrders.map((order) => {
                            const customer = (order.Customer || '').trim();
                            const isDone = order.OrderCustStatus === 'Done';
                            const comandas = resolveComandas(localComandasByOrder, order.OrderID);
                            const visible = comandas.slice(0, MAX_BUBBLES);
                            const overflow = comandas.length - visible.length;

                            return (
                                <li key={order.OrderID}>
                                    <button
                                        type="button"
                                        className={`mesero-order-pick__row${isDone ? ' mesero-order-pick__row--done' : ''}`}
                                        onClick={() => onSelectOrder(order.OrderID)}
                                    >
                                        <div className="mesero-order-pick__row-main">
                                            <div className="mesero-order-pick__row-info">
                                                <span className="mesero-order-pick__order-id">
                                                    #{order.OrderID}
                                                </span>
                                                <span className="mesero-order-pick__customer">
                                                    {customer || 'Sin cliente'}
                                                </span>
                                            </div>
                                            <div className="mesero-order-pick__row-meta">
                                                <span className="mesero-order-pick__total">
                                                    ${Number(order.CuentaTotal || 0).toFixed(0)}
                                                </span>
                                                <span className={`mesero-order-pick__status${isDone ? ' mesero-order-pick__status--done' : ''}`}>
                                                    {isDone ? 'Cerrada' : 'En curso'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mesero-order-pick__bubbles">
                                            {visible.length === 0 ? (
                                                <span className="mesero-order-pick__empty-items">
                                                    Sin platillos
                                                </span>
                                            ) : (
                                                <>
                                                    {visible.map((comanda) => {
                                                        const delivered = isComandaDelivered(comanda);
                                                        return (
                                                        <span
                                                            key={comanda._id || `${comanda.ComandaId}-${comanda.Platillo}`}
                                                            className={`mesero-order-pick__bubble${delivered ? ' mesero-order-pick__bubble--delivered' : ''}`}
                                                            title={delivered ? `${comanda.Platillo} (Entregado)` : comanda.Platillo}
                                                        >
                                                            <img
                                                                src={comanda.Imagen}
                                                                alt={comanda.Platillo}
                                                            />
                                                            {delivered && (
                                                                <span
                                                                    className="mesero-order-pick__bubble-mask"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                        </span>
                                                        );
                                                    })}
                                                    {overflow > 0 && (
                                                        <span className="mesero-order-pick__bubble-overflow">
                                                            +{overflow}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MeseroOrderPickModal;
