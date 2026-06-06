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

            <div className="mesero-gallery__filmstrip">
                <div className="mesero-gallery__filmstrip-label">Órdenes</div>
                <div className="mesero-gallery__filmstrip-scroll">
                    {sortedOrders.map((order) => {
                        const isSelected = Number(order.OrderID) === Number(selectedOrderId);
                        const customer = (order.Customer || '').trim();
                        return (
                            <button
                                key={order.OrderID}
                                type="button"
                                className={`mesero-gallery__frame${isSelected ? ' mesero-gallery__frame--selected' : ''}`}
                                onClick={() => setSelectedOrderId(order.OrderID)}
                            >
                                <div className="mesero-gallery__frame-top">
                                    <span className="mesero-gallery__frame-id">#{order.OrderID}</span>
                                    <span className="mesero-gallery__frame-total">
                                        ${Number(order.CuentaTotal || 0).toFixed(0)}
                                    </span>
                                </div>
                                <div className="mesero-gallery__frame-customer">
                                    {customer || 'Sin cliente'}
                                </div>
                                <div className="mesero-gallery__frame-status">
                                    {order.OrderCustStatus === 'Done' ? 'Cerrada' : 'En curso'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MeseroGalleryView;
