import './MeseroGalleryView.css';
import React, { useEffect, useMemo, useState } from 'react';
import MeseroOrderPanel from './MeseroOrderPanel';

const getLatestOrderId = (orders) => {
    if (!orders.length) return null;
    return Math.max(...orders.map((o) => Number(o.OrderID)));
};

const MeseroGalleryView = ({
    orders,
    platillos,
    handleDeleteOrder,
    handleOrderCustStatus,
}) => {
    const [selectedOrderId, setSelectedOrderId] = useState(() => getLatestOrderId(orders));

    const sortedOrders = useMemo(
        () => [...orders].sort((a, b) => Number(a.OrderID) - Number(b.OrderID)),
        [orders]
    );

    useEffect(() => {
        if (!orders.length) {
            setSelectedOrderId(null);
            return;
        }
        const stillExists = orders.some((o) => Number(o.OrderID) === Number(selectedOrderId));
        if (!stillExists) {
            setSelectedOrderId(getLatestOrderId(orders));
        }
    }, [orders, selectedOrderId]);

    return (
        <div className="mesero-gallery">
            <div className="mesero-gallery__main">
                <div className="mesero-gallery__main-shell">
                    <span className="mesero-gallery__orb mesero-gallery__orb--cyan" aria-hidden="true" />
                    <span className="mesero-gallery__orb mesero-gallery__orb--magenta" aria-hidden="true" />
                    <div className="mesero-gallery__main-inner">
                        <div className="mesero-gallery__main-head">
                            <span className="mesero-gallery__kicker">Orden activa</span>
                            {selectedOrderId && (
                                <h2 className="mesero-gallery__main-title">Pedido #{selectedOrderId}</h2>
                            )}
                        </div>
                        {selectedOrderId ? (
                            <MeseroOrderPanel
                                key={selectedOrderId}
                                galleryLayout
                                modeInterface
                                iInterface
                                OrderID={selectedOrderId}
                                DeleteOrder={handleDeleteOrder}
                                handleOrderCustStatus={handleOrderCustStatus}
                                platillos={platillos}
                            />
                        ) : (
                            <div className="mesero-gallery__empty">
                                <p>No hay órdenes activas.</p>
                                <p className="mesero-gallery__empty-hint">Pulsa &quot;Nueva Orden&quot; para comenzar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mesero-gallery__filmstrip">
                <div className="mesero-gallery__filmstrip-shell">
                    <span className="mesero-gallery__orb mesero-gallery__orb--cyan mesero-gallery__orb--sm" aria-hidden="true" />
                    <span className="mesero-gallery__orb mesero-gallery__orb--magenta mesero-gallery__orb--sm" aria-hidden="true" />
                    <div className="mesero-gallery__filmstrip-inner">
                        <span className="mesero-gallery__kicker mesero-gallery__kicker--film">Órdenes</span>
                        <div className="mesero-gallery__filmstrip-scroll">
                            {sortedOrders.map((order) => {
                                const isSelected = Number(order.OrderID) === Number(selectedOrderId);
                                const customer = (order.Customer || '').trim();
                                const isDone = order.OrderCustStatus === 'Done';
                                return (
                                    <button
                                        key={order.OrderID}
                                        type="button"
                                        className={`mesero-gallery__tile${isSelected ? ' mesero-gallery__tile--selected' : ''}`}
                                        onClick={() => setSelectedOrderId(order.OrderID)}
                                    >
                                        <div className="mesero-gallery__tile-frame">
                                            <span className="mesero-gallery__tile-badge">
                                                #{order.OrderID}
                                            </span>
                                            <div className="mesero-gallery__tile-screen">
                                                <span className="mesero-gallery__tile-screen-icon" />
                                                <span className="mesero-gallery__tile-screen-label">
                                                    {customer || 'Sin cliente'}
                                                </span>
                                                <span className="mesero-gallery__tile-screen-total">
                                                    ${Number(order.CuentaTotal || 0).toFixed(0)}
                                                </span>
                                            </div>
                                            <span className={`mesero-gallery__tile-meta${isDone ? ' mesero-gallery__tile-meta--done' : ''}`}>
                                                {isDone ? 'Cerrada' : 'En curso'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeseroGalleryView;
