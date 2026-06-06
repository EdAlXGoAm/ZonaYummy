import './MeseroGalleryView.css';
import React, { useEffect, useMemo, useState } from 'react';
import MeseroOrderPanel from './MeseroOrderPanel';
import MeseroPlatilloSelector from './MeseroPlatilloSelector';

const getLatestOrderId = (orders) => {
    if (!orders.length) return null;
    return Math.max(...orders.map((o) => Number(o.OrderID)));
};

const MeseroGalleryView = ({
    orders,
    platillos,
    handleDeleteOrder,
    handleOrderCustStatus,
    onRefreshAll,
}) => {
    const [selectedOrderId, setSelectedOrderId] = useState(() => getLatestOrderId(orders));
    const [addPlatilloToOrder, setAddPlatilloToOrder] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [panelRefreshKey, setPanelRefreshKey] = useState(0);

    const sortedOrders = useMemo(
        () => [...orders].sort((a, b) => Number(a.OrderID) - Number(b.OrderID)),
        [orders]
    );

    useEffect(() => {
        if (!orders.length) {
            setSelectedOrderId(null);
            return;
        }
        if (selectedOrderId == null) {
            return;
        }
        const stillExists = orders.some((o) => Number(o.OrderID) === Number(selectedOrderId));
        if (!stillExists) {
            setSelectedOrderId(getLatestOrderId(orders));
        }
    }, [orders, selectedOrderId]);

    const handleCloseOrder = () => {
        setSelectedOrderId(null);
    };

    const handleRefreshAll = async () => {
        if (!onRefreshAll || refreshing) return;
        setRefreshing(true);
        setAddPlatilloToOrder(null);
        try {
            await onRefreshAll();
            setPanelRefreshKey((key) => key + 1);
        } catch {
            // El shell ya notifica el error
        } finally {
            setRefreshing(false);
        }
    };

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
                                <>
                                    <h2 className="mesero-gallery__main-title">Pedido #{selectedOrderId}</h2>
                                    <div className="mesero-gallery__main-head-actions">
                                        {addPlatilloToOrder && (
                                            <MeseroPlatilloSelector
                                                addPlatilloToOrder={addPlatilloToOrder}
                                                platillos={platillos}
                                                floating
                                                inHead
                                            />
                                        )}
                                        <button
                                            type="button"
                                            className="mesero-gallery__close-order"
                                            onClick={handleCloseOrder}
                                            title="Cerrar orden seleccionada"
                                            aria-label="Cerrar orden seleccionada"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        {selectedOrderId ? (
                            <MeseroOrderPanel
                                key={`${selectedOrderId}-${panelRefreshKey}`}
                                galleryLayout
                                modeInterface
                                iInterface
                                OrderID={selectedOrderId}
                                DeleteOrder={handleDeleteOrder}
                                handleOrderCustStatus={handleOrderCustStatus}
                                platillos={platillos}
                                onRegisterAddPlatillo={setAddPlatilloToOrder}
                            />
                        ) : (
                            <div className="mesero-gallery__empty">
                                {orders.length > 0 ? (
                                    <>
                                        <p>Ninguna orden seleccionada.</p>
                                        <p className="mesero-gallery__empty-hint">
                                            Elige una orden del cintillo inferior o pulsa &quot;Nueva Orden&quot;.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p>No hay órdenes activas.</p>
                                        <p className="mesero-gallery__empty-hint">Pulsa &quot;Nueva Orden&quot; para comenzar.</p>
                                    </>
                                )}
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
                        <div className="mesero-gallery__filmstrip-head">
                            <span className="mesero-gallery__kicker mesero-gallery__kicker--film">Órdenes</span>
                            <button
                                type="button"
                                className={`mesero-gallery__refresh-btn${refreshing ? ' mesero-gallery__refresh-btn--loading' : ''}`}
                                onClick={handleRefreshAll}
                                disabled={refreshing}
                                title="Refrescar órdenes y platillos"
                                aria-label="Refrescar órdenes y platillos"
                            >
                                <svg
                                    className="mesero-gallery__refresh-icon"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                                    <polyline points="21 3 21 9 15 9" />
                                </svg>
                                <span className="mesero-gallery__refresh-label">
                                    {refreshing ? 'Actualizando…' : 'Refrescar'}
                                </span>
                            </button>
                        </div>
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
