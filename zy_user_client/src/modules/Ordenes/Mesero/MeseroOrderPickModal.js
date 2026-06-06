import './MeseroOrderPickModal.css';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import comandasApi from '../../../api/comandasApi';

const MAX_BUBBLES = 7;

const sortOrdersForPicker = (orders) => {
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

const MeseroOrderPickModal = ({ orders, onSelectOrder, onClose }) => {
    const sortedOrders = useMemo(() => sortOrdersForPicker(orders), [orders]);
    const [comandasByOrder, setComandasByOrder] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadComandas = async () => {
            setLoading(true);
            try {
                const entries = await Promise.all(
                    sortedOrders.map(async (order) => {
                        const comandas = await comandasApi.getComandasByOrderId(order.OrderID);
                        return [order.OrderID, comandas];
                    })
                );
                if (!cancelled) {
                    setComandasByOrder(Object.fromEntries(entries));
                }
            } catch {
                if (!cancelled) {
                    setComandasByOrder({});
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadComandas();
        return () => { cancelled = true; };
    }, [sortedOrders]);

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
                    {loading ? (
                        <p className="mesero-order-pick__loading">Cargando órdenes…</p>
                    ) : (
                        <ul className="mesero-order-pick__list">
                            {sortedOrders.map((order) => {
                                const customer = (order.Customer || '').trim();
                                const isDone = order.OrderCustStatus === 'Done';
                                const comandas = comandasByOrder[order.OrderID] || [];
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
                                                        {visible.map((comanda) => (
                                                            <span
                                                                key={comanda._id || `${comanda.ComandaId}-${comanda.Platillo}`}
                                                                className="mesero-order-pick__bubble"
                                                                title={comanda.Platillo}
                                                            >
                                                                <img
                                                                    src={comanda.Imagen}
                                                                    alt={comanda.Platillo}
                                                                />
                                                            </span>
                                                        ))}
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
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MeseroOrderPickModal;
