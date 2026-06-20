import './MeseroGalleryView.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MeseroOrderPanel from './MeseroOrderPanel';
import MeseroOrderPickModal from './MeseroOrderPickModal';
import MeseroOrderJsonModal from './MeseroOrderJsonModal';
import MeseroPlatilloSelector from './MeseroPlatilloSelector';
import MeseroCustomerField from './MeseroCustomerField';
import {
    loadGallerySelectedOrderId,
    saveGallerySelectedOrderId,
} from './meseroViewCache';
import { bindTouchAxisScroll } from './meseroTouchAxisScroll';
import { sortMeseroOrdersActiveFirst } from './meseroOrdersSort';
import { isOrigenDomicilio, isOrigenWhatsapp } from './meseroOrigenUtils';

const resolveOrderComandas = (comandasByOrder, orderId) => {
    const key = Number(orderId);
    if (Object.prototype.hasOwnProperty.call(comandasByOrder, key)) {
        return comandasByOrder[key];
    }
    if (Object.prototype.hasOwnProperty.call(comandasByOrder, orderId)) {
        return comandasByOrder[orderId];
    }
    if (Object.prototype.hasOwnProperty.call(comandasByOrder, String(orderId))) {
        return comandasByOrder[String(orderId)];
    }
    return undefined;
};

const isOrderWithoutComandas = (order, comandasByOrder) => {
    const comandas = resolveOrderComandas(comandasByOrder, order.OrderID);
    if (comandas !== undefined) {
        return comandas.length === 0;
    }
    if (Array.isArray(order.ComandasList)) {
        return order.ComandasList.length === 0;
    }
    return Number(order.CuentaTotal || 0) === 0;
};

const MeseroGalleryView = ({
    orders,
    comandasByOrder = {},
    onComandasCacheSync,
    onOrderCacheSync,
    platillos,
    handleDeleteOrder,
    handleOrderCustStatus,
    onRefreshAll,
    onNewOrder,
    onSwitchToClassicView,
}) => {
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [panelRefreshKey, setPanelRefreshKey] = useState(0);
    const [selectionReady, setSelectionReady] = useState(false);
    const [pickerDismissed, setPickerDismissed] = useState(false);
    const selectionHydratedRef = useRef(false);
    const addPlatilloRef = useRef(null);
    const filmstripScrollRef = useRef(null);
    const tileLongPressTimerRef = useRef(null);
    const tileLongPressTriggeredRef = useRef(false);
    const [jsonModalOrderId, setJsonModalOrderId] = useState(null);
    const TILE_LONG_PRESS_MS = 550;

    const registerAddPlatillo = useCallback((handler) => {
        addPlatilloRef.current = handler;
    }, []);

    const addPlatilloViaRef = useCallback((platillo) => {
        addPlatilloRef.current?.(platillo);
    }, []);

    const selectOrder = useCallback((orderId) => {
        setSelectedOrderId(orderId);
        saveGallerySelectedOrderId(orderId);
        setPickerDismissed(false);
    }, []);

    const clearSelectedOrder = useCallback(() => {
        setSelectedOrderId(null);
        saveGallerySelectedOrderId(null);
        setPickerDismissed(false);
    }, []);

    const handleCustomerUpdated = useCallback((updatedOrder) => {
        if (!updatedOrder?.OrderID || typeof onOrderCacheSync !== 'function') {
            return;
        }
        onOrderCacheSync({
            OrderID: updatedOrder.OrderID,
            Customer: updatedOrder.Customer ?? '',
            Origen: updatedOrder.Origen ?? '',
        });
    }, [onOrderCacheSync]);

    const sortedOrders = useMemo(
        () => sortMeseroOrdersActiveFirst(orders),
        [orders]
    );

    useEffect(() => {
        const filmstrip = filmstripScrollRef.current;
        if (!filmstrip) {
            return undefined;
        }
        return bindTouchAxisScroll(filmstrip, { axis: 'x' });
    }, [sortedOrders.length]);

    useEffect(() => {
        if (!orders.length) {
            setSelectedOrderId(null);
            setSelectionReady(true);
            return;
        }

        if (!selectionHydratedRef.current) {
            const cachedId = loadGallerySelectedOrderId();
            if (cachedId == null) {
                setSelectedOrderId(null);
            } else {
                const exists = orders.some((o) => Number(o.OrderID) === Number(cachedId));
                setSelectedOrderId(exists ? cachedId : null);
                if (!exists) {
                    saveGallerySelectedOrderId(null);
                }
            }
            selectionHydratedRef.current = true;
            setSelectionReady(true);
            return;
        }

        if (
            selectedOrderId != null
            && !orders.some((o) => Number(o.OrderID) === Number(selectedOrderId))
        ) {
            setSelectedOrderId(null);
            saveGallerySelectedOrderId(null);
        }
    }, [orders, selectedOrderId]);

    const handleCloseOrder = () => {
        clearSelectedOrder();
    };

    const selectedOrder = useMemo(
        () => sortedOrders.find((o) => Number(o.OrderID) === Number(selectedOrderId)) ?? null,
        [sortedOrders, selectedOrderId]
    );

    const selectedOrderComandas = useMemo(() => {
        if (selectedOrderId == null) return undefined;
        return resolveOrderComandas(comandasByOrder, selectedOrderId);
    }, [selectedOrderId, comandasByOrder]);

    const hasPreloadedComandas = selectedOrderComandas !== undefined;

    const showOrderPicker = (
        selectionReady
        && selectedOrderId == null
        && sortedOrders.length > 0
        && !pickerDismissed
    );

    const handleRefreshAll = async () => {
        if (!onRefreshAll || refreshing) return;
        setRefreshing(true);
        addPlatilloRef.current = null;
        try {
            await onRefreshAll();
            setPanelRefreshKey((key) => key + 1);
        } catch {
            // El shell ya notifica el error
        } finally {
            setRefreshing(false);
        }
    };

    const handleNewOrder = async () => {
        if (!onNewOrder) return;
        const newOrderId = await onNewOrder();
        if (newOrderId != null) {
            selectOrder(newOrderId);
        }
    };

    const clearTileLongPress = useCallback(() => {
        if (tileLongPressTimerRef.current) {
            clearTimeout(tileLongPressTimerRef.current);
            tileLongPressTimerRef.current = null;
        }
    }, []);

    const handleTilePressStart = useCallback((orderId) => {
        tileLongPressTriggeredRef.current = false;
        clearTileLongPress();
        tileLongPressTimerRef.current = setTimeout(() => {
            tileLongPressTriggeredRef.current = true;
            setJsonModalOrderId(orderId);
        }, TILE_LONG_PRESS_MS);
    }, [clearTileLongPress]);

    const handleTilePressEnd = useCallback(() => {
        clearTileLongPress();
    }, [clearTileLongPress]);

    const handleTileClick = useCallback((orderId) => {
        if (tileLongPressTriggeredRef.current) {
            tileLongPressTriggeredRef.current = false;
            return;
        }
        selectOrder(orderId);
    }, [selectOrder]);

    const handleOrderJsonSaved = useCallback((updatedOrder) => {
        if (!updatedOrder?.OrderID || typeof onOrderCacheSync !== 'function') {
            return;
        }
        onOrderCacheSync(updatedOrder);
    }, [onOrderCacheSync]);

    useEffect(() => () => clearTileLongPress(), [clearTileLongPress]);

    const jsonModalOrder = useMemo(
        () => sortedOrders.find((o) => Number(o.OrderID) === Number(jsonModalOrderId)) ?? null,
        [sortedOrders, jsonModalOrderId]
    );

    const jsonModalComandas = useMemo(() => {
        if (jsonModalOrderId == null) return undefined;
        return resolveOrderComandas(comandasByOrder, jsonModalOrderId);
    }, [jsonModalOrderId, comandasByOrder]);

    const showClassicViewFab = (
        selectionReady
        && selectedOrderId == null
        && typeof onSwitchToClassicView === 'function'
    );

    return (
        <div className="mesero-gallery">
            {showClassicViewFab && (
                <button
                    type="button"
                    className="mesero-view-fab mesero-view-fab--gallery mesero-view-fab--corner-top"
                    onClick={onSwitchToClassicView}
                    title="Cambiar a vista clásica"
                    aria-label="Cambiar a vista clásica"
                >
                    <span className="mesero-view-fab__icon" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
                        </svg>
                    </span>
                    <span className="mesero-view-fab__label">Clásica</span>
                </button>
            )}
            {showOrderPicker && (
                <MeseroOrderPickModal
                    orders={sortedOrders}
                    comandasByOrder={comandasByOrder}
                    onSelectOrder={selectOrder}
                    onClose={() => setPickerDismissed(true)}
                />
            )}
            {jsonModalOrderId != null && (
                <MeseroOrderJsonModal
                    orderId={jsonModalOrderId}
                    cachedOrder={jsonModalOrder}
                    comandas={jsonModalComandas}
                    onClose={() => setJsonModalOrderId(null)}
                    onSaved={handleOrderJsonSaved}
                />
            )}
            <div className="mesero-gallery__main">
                <div className="mesero-gallery__main-shell">
                    <span className="mesero-gallery__orb mesero-gallery__orb--cyan" aria-hidden="true" />
                    <span className="mesero-gallery__orb mesero-gallery__orb--magenta" aria-hidden="true" />
                    <div className="mesero-gallery__main-inner">
                        <div className="mesero-gallery__main-head">
                            <div className="mesero-gallery__main-head-bar">
                                <span className="mesero-gallery__kicker">Orden activa</span>
                                {selectedOrderId && (
                                    <>
                                        <h2 className="mesero-gallery__main-title">Pedido #{selectedOrderId}</h2>
                                        <button
                                            type="button"
                                            className="mesero-gallery__close-order"
                                            onClick={handleCloseOrder}
                                            title="Cerrar orden seleccionada"
                                            aria-label="Cerrar orden seleccionada"
                                        >
                                            ✕
                                        </button>
                                    </>
                                )}
                            </div>
                            {selectedOrderId && (
                                <div className="mesero-gallery__main-head-actions">
                                    <MeseroCustomerField
                                        order={selectedOrder}
                                        compact
                                        onOrderUpdated={handleCustomerUpdated}
                                    />
                                    <MeseroPlatilloSelector
                                        addPlatilloToOrder={addPlatilloViaRef}
                                        platillos={platillos}
                                        floating
                                        inHead
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mesero-gallery__panel-slot">
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
                                    preloadedOrder={selectedOrder}
                                    preloadedComandas={hasPreloadedComandas ? selectedOrderComandas : undefined}
                                    isOptimized={hasPreloadedComandas}
                                    onRegisterAddPlatillo={registerAddPlatillo}
                                    onComandasCacheSync={onComandasCacheSync}
                                    onOrderCacheSync={onOrderCacheSync}
                                />
                            ) : (
                                <div className="mesero-gallery__empty">
                                    {orders.length > 0 ? (
                                        <>
                                            <p>Ninguna orden seleccionada.</p>
                                            <p className="mesero-gallery__empty-hint">
                                                {pickerDismissed
                                                    ? 'Elige una orden del cintillo inferior o abre el selector.'
                                                    : 'Elige una orden en el selector o del cintillo inferior.'}
                                            </p>
                                            {pickerDismissed && (
                                                <button
                                                    type="button"
                                                    className="mesero-gallery__open-picker-btn"
                                                    onClick={() => setPickerDismissed(false)}
                                                >
                                                    Ver órdenes
                                                </button>
                                            )}
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
            </div>

            <div className="mesero-gallery__filmstrip">
                <div className="mesero-gallery__filmstrip-shell">
                    <span className="mesero-gallery__orb mesero-gallery__orb--cyan mesero-gallery__orb--sm" aria-hidden="true" />
                    <span className="mesero-gallery__orb mesero-gallery__orb--magenta mesero-gallery__orb--sm" aria-hidden="true" />
                    <div className="mesero-gallery__filmstrip-inner">
                        <div className="mesero-gallery__filmstrip-head">
                            <span className="mesero-gallery__kicker mesero-gallery__kicker--film">Órdenes</span>
                            <div className="mesero-gallery__filmstrip-actions">
                                <button
                                    type="button"
                                    className="mesero-gallery__new-order-btn"
                                    onClick={handleNewOrder}
                                    title="Nueva orden"
                                    aria-label="Nueva orden"
                                >
                                    <span className="mesero-gallery__new-order-icon" aria-hidden="true">+</span>
                                    <span className="mesero-gallery__new-order-label">Nueva Orden</span>
                                </button>
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
                        </div>
                        <div ref={filmstripScrollRef} className="mesero-gallery__filmstrip-scroll">
                            {sortedOrders.map((order) => {
                                const isSelected = Number(order.OrderID) === Number(selectedOrderId);
                                const customer = (order.Customer || '').trim();
                                const isDone = order.OrderCustStatus === 'Done';
                                const isEmpty = isOrderWithoutComandas(order, comandasByOrder);
                                const isWhatsapp = isOrigenWhatsapp(order.Origen);
                                const isDomicilio = isOrigenDomicilio(order.Origen);
                                return (
                                    <button
                                        key={order.OrderID}
                                        type="button"
                                        className={`mesero-gallery__tile${isSelected ? ' mesero-gallery__tile--selected' : ''}${isDone ? ' mesero-gallery__tile--done' : ' mesero-gallery__tile--active'}${isEmpty ? ' mesero-gallery__tile--empty' : ''}${isWhatsapp ? ' mesero-gallery__tile--whatsapp' : ''}`}
                                        onPointerDown={() => handleTilePressStart(order.OrderID)}
                                        onPointerUp={handleTilePressEnd}
                                        onPointerLeave={handleTilePressEnd}
                                        onPointerCancel={handleTilePressEnd}
                                        onClick={() => handleTileClick(order.OrderID)}
                                        onContextMenu={(e) => e.preventDefault()}
                                        title="Clic para seleccionar · Mantener presionado para ver JSON"
                                    >
                                        <div className="mesero-gallery__tile-frame">
                                            <span className="mesero-gallery__tile-badge">
                                                #{order.OrderID}
                                            </span>
                                            <div className="mesero-gallery__tile-screen">
                                                {isEmpty ? (
                                                    <span className="mesero-gallery__tile-screen-empty">
                                                        Vacía
                                                    </span>
                                                ) : (
                                                    <>
                                                        {isDomicilio ? (
                                                            <span
                                                                className="mesero-gallery__tile-screen-icon mesero-gallery__tile-screen-icon--delivery"
                                                                aria-hidden="true"
                                                            >
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M10 17h4" />
                                                                    <path d="M3 7h11v8H3z" />
                                                                    <path d="M14 9h4l2 3v3h-6V9z" />
                                                                    <circle cx="7.5" cy="17.5" r="1.5" />
                                                                    <circle cx="17.5" cy="17.5" r="1.5" />
                                                                </svg>
                                                            </span>
                                                        ) : (
                                                            <span className="mesero-gallery__tile-screen-icon" />
                                                        )}
                                                        <span className="mesero-gallery__tile-screen-label">
                                                            {customer || 'Sin cliente'}
                                                        </span>
                                                        <span className="mesero-gallery__tile-screen-total">
                                                            ${Number(order.CuentaTotal || 0).toFixed(0)}
                                                        </span>
                                                    </>
                                                )}
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
