import React, { useState, useEffect, useMemo, useRef } from 'react';
import ordersApi from './../../../api/ordersApi';
import comandasApi from './../../../api/comandasApi';
import borradosApi from './../../../api/borradosApi';
import CocinaNewFeaturesComandaCard from './CocinaNewFeaturesComandaCard';
import { DebugCardHeightShell } from './CocinaNewFeaturesDebugCardHeight';
import {
    getKitchenDisplayPlatilloName,
    isTacoDeBirria,
} from './cocinaNewFeaturesComandaUtils';
import './CocinaNewFeaturesKitchenBoard.css';
import './CocinaNewFeaturesComandaCard.css';

import io from 'socket.io-client';
const socket = io(`${process.env.REACT_APP_API_URL}`);

const sortComandasByComandaId = (comandas) => [...comandas].sort(
    (a, b) => Number(a.ComandaId) - Number(b.ComandaId),
);

const RECENTLY_DELIVERED_TTL_MS = 10000;

const isSameComanda = (a, b) => {
    if (a?._id && b?._id) {
        return a._id === b._id;
    }
    return Number(a?.OrderID) === Number(b?.OrderID)
        && Number(a?.ComandaId) === Number(b?.ComandaId);
};

const getOrderSlotKey = (order) => `${order.orderId}-p${order.partNumber ?? 1}`;

const CocinaNewFeaturesKitchenBoard = ({modeInterface, Orders}) => {
    const [numOrders, setNumOrders] = useState([]);
    const [activeComandas, setActiveComandas] = useState([]);
    const [arrayBebidas, setArrayBebidas] = useState([]);
    const [arrayWaffles, setArrayWaffles] = useState([]);
    const fetchSeqRef = useRef(0);
    const recentlyDeliveredRef = useRef(new Map());

    // Estado para el menú contextual (comandas individuales)
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        comanda: null
    });

    // Manejar clic derecho sobre una tarjeta
    const handleContextMenu = (e, comanda) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            comanda
        });
    };

    // Cerrar menú contextual
    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, comanda: null });
    };

    // Solicitar borrado de comanda (requiere autorización)
    const handleDeleteComanda = async () => {
        if (!contextMenu.comanda) return;

        const comanda = contextMenu.comanda;
        const confirmar = window.confirm(
            '¿Solicitar eliminación de esta comanda? Un supervisor debe autorizarla en /eliminar.',
        );
        if (!confirmar) return;

        try {
            await borradosApi.solicitarBorrado(comanda);
            socket.emit('SolicitudBorradoDesdeCliente', {
                comandaMongoId: comanda._id,
                OrderID: comanda.OrderID,
            });
            alert('Solicitud de borrado enviada. Pendiente de autorización.');
            closeContextMenu();
        } catch (error) {
            console.error('Error al solicitar borrado:', error);
            const msg = error.response?.data?.error || 'Error al solicitar el borrado de la comanda';
            alert(msg);
        }
    };

    const pruneRecentlyDelivered = () => {
        const now = Date.now();
        recentlyDeliveredRef.current.forEach((timestamp, comandaId) => {
            if (now - timestamp > RECENTLY_DELIVERED_TTL_MS) {
                recentlyDeliveredRef.current.delete(comandaId);
            }
        });
    };

    const filterOutRecentlyDelivered = (comandas) => {
        pruneRecentlyDelivered();
        if (recentlyDeliveredRef.current.size === 0) {
            return comandas;
        }
        return comandas.filter((comanda) => {
            const comandaId = comanda?._id;
            return !comandaId || !recentlyDeliveredRef.current.has(comandaId);
        });
    };

    const markComandaDeliveredLocally = (comanda) => {
        if (comanda?._id) {
            recentlyDeliveredRef.current.set(comanda._id, Date.now());
        }
        setActiveComandas((prev) => prev.filter((c) => !isSameComanda(c, comanda)));
    };

    // Marcar comanda como entregada
    const handleMarkAsDelivered = async () => {
        if (!contextMenu.comanda) return;
        
        const comanda = contextMenu.comanda;
        
        try {
            const updatedComanda = {
                ...comanda,
                ComandaPrepStatus: "ReadyToServe"
            };
            await comandasApi.updateComanda(updatedComanda);
            
            socket.emit('UpdateComandaDesdeCliente', { msg: `Update-${comanda.OrderID}-${comanda.Platillo}` });
            socket.emit('OrdenActualizadaDesdeCliente', { msg: comanda.OrderID });
            
            markComandaDeliveredLocally(comanda);
            closeContextMenu();
        } catch (error) {
            console.error("Error al marcar como entregado:", error);
            alert("Error al marcar como entregado");
        }
    };

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        if (!contextMenu.visible) return;
        
        const handleClickOutside = (e) => {
            const menu = document.querySelector('.context-menu');
            if (menu && menu.contains(e.target)) return;
            closeContextMenu();
        };
        
        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('contextmenu', handleClickOutside);
        }, 10);
        
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('contextmenu', handleClickOutside);
        };
    }, [contextMenu.visible]);

    const fetchComandasFromOrders = () => {
        const fetchId = ++fetchSeqRef.current;
        console.log("fetchComandasFromOrders using the next Orders:", Orders);
        setNumOrders(Orders.length);
        let localOrders = Orders;

        let comandasPromises = localOrders.map(order => {
            return comandasApi.getComandasByOrderId(order.OrderID)
                .then(response => {
                    const res_comandas = response.map(comanda => {
                        return {
                            ...comanda,
                            Customer: order.Customer,
                            Origen: order.Origen || ''
                        };
                    });
                    return res_comandas;
                })
                .catch(e => {
                    console.log(e);
                    return [];
                });
        });
        
        Promise.all(comandasPromises).then(comandasResults => {
            if (fetchId !== fetchSeqRef.current) {
                return;
            }
            const localActiveComandas = filterOutRecentlyDelivered(comandasResults.flat());
            console.log("Todas las comandas activas: ", localActiveComandas);
            setActiveComandas(localActiveComandas);
        }).catch(e => {
            if (fetchId !== fetchSeqRef.current) {
                return;
            }
            console.log("Error al recuperar comandas: ", e);
        });
    };

    useEffect(() => {
        fetchComandasFromOrders();
    }, [Orders]);

    // Separar bebidas y waffles del resto
    const fetchCategorias = () => {
        let localComandasForCategorize = [...activeComandas].filter(c => c.ComandaPrepStatus !== "ReadyToServe");
        const localArrayBebidas = localComandasForCategorize.filter(c => c.Categoria === "Bebidas");
        const localArrayWaffles = localComandasForCategorize.filter(c => c.Categoria === "Waffles");

        setArrayBebidas(localArrayBebidas);
        setArrayWaffles(localArrayWaffles);
    };

    useEffect(() => { 
        fetchCategorias();
    }, [activeComandas]);

    // ========== NUEVO LAYOUT: 4 COLUMNAS ==========
    
    // Agrupar comandas por OrderID (excluyendo bebidas, waffles y postres)
    const ordersGrouped = useMemo(() => {
        const orderMap = new Map();
        
        // Filtrar comandas: excluir ReadyToServe, Bebidas, Waffles y Postres
        const filteredComandas = activeComandas.filter(c => 
            c.ComandaPrepStatus !== "ReadyToServe" && 
            c.Categoria !== "Bebidas" && 
            c.Categoria !== "Waffles" &&
            c.Categoria !== "Postres"
        );
        
        filteredComandas.forEach(comanda => {
            const orderId = comanda.OrderID;
            if (!orderMap.has(orderId)) {
                orderMap.set(orderId, {
                    orderId,
                    customer: comanda.Customer,
                    origen: comanda.Origen || '',
                    comandas: [],
                    total: 0
                });
            }
            const order = orderMap.get(orderId);
            order.comandas.push(comanda);
            order.total += comanda.Precio || 0;
            // Actualizar origen si viene de una comanda posterior
            if (comanda.Origen && !order.origen) {
                order.origen = comanda.Origen;
            }
        });

        return Array.from(orderMap.values())
            .map((order) => ({
                ...order,
                comandas: sortComandasByComandaId(order.comandas),
            }))
            .sort((a, b) => Number(a.orderId) - Number(b.orderId));
    }, [activeComandas]);

    // Espacio que ocupa cada platillo como fracción de una columna (1.0 = columna llena).
    // Fácil extender: añadir más entradas con su fracción.
    const PLATILLO_COLUMN_SPACE = {
        Hamburguesa: 1 / 2,
        Tacos: 1 / 6,
        'C Hamburguesa': 1, // 100% de la columna; se expande verticalmente a lo que necesite.
        // Ejemplo futuro: Waffle: 1/4,
    };
    const DEFAULT_COLUMN_SPACE = 1 / 3; // Platillos no listados (comportamiento similar a hamburguesa).
    const getComandaSpace = (comanda) => {
        if (isTacoDeBirria(comanda)) {
            return 1 / 4;
        }
        return PLATILLO_COLUMN_SPACE[comanda.Platillo] ?? DEFAULT_COLUMN_SPACE;
    };

    const { mainOrders, extraOrders } = useMemo(() => {
        const columnSlots = []; // Cada slot representa una columna
        const overflow = []; // Comandas que van a "próximas"
        const COLUMN_CAPACITY = 1.0;

        ordersGrouped.forEach((order) => {
            // Formar partes: cada parte es un conjunto de comandas cuya suma de espacios <= 1.0
            const parts = [];
            let currentPart = [];
            let currentUsed = 0;

            order.comandas.forEach((comanda) => {
                const space = getComandaSpace(comanda);
                if (currentUsed + space <= COLUMN_CAPACITY) {
                    currentPart.push(comanda);
                    currentUsed += space;
                } else {
                    if (currentPart.length > 0) {
                        parts.push(currentPart);
                    }
                    currentPart = [comanda];
                    currentUsed = space;
                }
            });
            if (currentPart.length > 0) {
                parts.push(currentPart);
            }

            // Asignar cada parte a columnSlots (si < 4) o overflow
            parts.forEach((part, partIndex) => {
                const total = part.reduce((sum, c) => sum + (c.Precio || 0), 0);
                const slot = {
                    orderId: order.orderId,
                    customer: order.customer,
                    origen: order.origen,
                    comandas: part,
                    total,
                    isPartial: parts.length > 1,
                    partNumber: parts.length > 1 ? partIndex + 1 : null,
                    totalParts: parts.length > 1 ? parts.length : null
                };
                if (columnSlots.length < 4) {
                    columnSlots.push(slot);
                } else {
                    overflow.push(slot);
                }
            });
        });

        return {
            mainOrders: columnSlots.slice(0, 4),
            extraOrders: [...columnSlots.slice(4), ...overflow]
        };
    }, [ordersGrouped]);

    // Componente para el header con burbujas animadas (tren de burbujas)
    const BubbleTrainHeader = ({ order }) => {
        const bubbleCount = order.comandas.length;
        const maxVisibleBubbles = 4;
        const needsAnimation = bubbleCount > maxVisibleBubbles;

        return (
            <div className="column-header" onContextMenu={(e) => e.preventDefault()}>
                <div className="column-header-info">
                    <span className="column-order-number">
                        #{order.orderId}
                        {order.isPartial && <span className="order-part-badge">({order.partNumber}/{order.totalParts})</span>}
                    </span>
                    <span className={`column-customer colorTextClienteCocina${order.orderId % 10}`}>
                        {order.origen === 'Whatsapp' && (
                            <img 
                                src="icons/whatsapp.png" 
                                alt="WhatsApp" 
                                className="whatsapp-icon-header"
                            />
                        )}
                        {order.customer || 'Cliente'}
                    </span>
                    <span className="column-total">${order.total.toFixed(0)}</span>
                </div>
                <div className="bubble-train-container">
                    <div className={`bubble-train ${needsAnimation ? 'bubble-train-animated' : ''}`}
                         style={needsAnimation ? { '--bubble-count': bubbleCount } : {}}>
                        {order.comandas.map((comanda, idx) => (
                            <div 
                                key={comanda.ComandaId} 
                                className="bubble-train-item"
                                title={getKitchenDisplayPlatilloName(comanda)}
                            >
                                <img 
                                    src={comanda.Imagen} 
                                    alt={comanda.Platillo}
                                    onError={(e) => { e.target.src = 'placeholder.png'; }}
                                />
                                <span className="bubble-train-price">${comanda.Precio || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Columna con un solo platillo "C Hamburguesa" expande altura al contenido
    const isExpandHeightColumn = (order) =>
        order.comandas.length === 1 && order.comandas[0].Platillo === 'C Hamburguesa';

    // Renderizar una columna de orden
    const renderOrderColumn = (order, index) => {
        const expandHeight = isExpandHeightColumn(order);
        return (
            <div
                key={getOrderSlotKey(order)}
                className={`order-column${expandHeight ? ' order-column--expand-height' : ''}`}
            >
                <BubbleTrainHeader order={order} />
                <div className="order-column-body">
                    {order.comandas.map((comanda, comandaIndex) => (
                        <div 
                            key={comanda.ComandaId}
                            className="order-column-comanda"
                            onContextMenu={(e) => handleContextMenu(e, comanda)}
                        >
                            <CocinaNewFeaturesComandaCard Comanda={comanda} compact comandaNumber={comanda.ComandaId} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Helper para obtener los aderezos de una hamburguesa
    const getAderezosPreview = (comanda) => {
        if (comanda.Platillo !== "Hamburguesa") return null;
        
        const selectedVariant = comanda.Details?.Variants?.[comanda.Details?.SelectedVariant];
        if (!selectedVariant) return null;
        
        // Buscar el grupo de ingredientes llamado "Aderezos"
        const aderezosGroup = selectedVariant.Ingredientes?.find(ing => ing.Name === "Aderezos");
        if (!aderezosGroup || !aderezosGroup.Items) return null;
        
        // Obtener los aderezos seleccionados (Checked = true)
        const selectedAderezos = aderezosGroup.Items.filter(item => item.Checked).map(item => item.Name);
        
        if (selectedAderezos.length === 0) return "SIN ADEREZOS";
        if (selectedAderezos.length === aderezosGroup.Items.length) return "TODOS";
        
        return selectedAderezos.join(", ");
    };

    // Renderizar órdenes extra en formato reducido (panel lateral)
    const renderExtraOrdersPanel = () => {
        if (extraOrders.length === 0) return null;

        return (
            <>
                <div className="bebidas-header proximas-header">
                    <span>PRÓXIMAS</span>
                    <span className="bebidas-header-count">{extraOrders.length}</span>
                </div>
                <div className="bebidas-list">
                    {extraOrders.map(order => (
                        <div key={getOrderSlotKey(order)} className="bebidas-order-card">
                            <div className="bebidas-order-header">
                                <div className="bebidas-order-title">
                                    <div className="bebidas-order-number">#{order.orderId}</div>
                                    <div className="bebidas-order-subtitle">{order.customer || 'Cliente'}</div>
                                </div>
                                <div className="bebidas-order-metrics">
                                    <span className="bebidas-pill bebidas-pill-count">{order.comandas.length} items</span>
                                    <span className="bebidas-pill bebidas-pill-total">${order.total.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className="bebidas-items">
                                {order.comandas.map((comanda, comandaIndex) => {
                                    // Calcular tiempo transcurrido
                                    const getTimeAgo = () => {
                                        if (!comanda.CreatedAt) return null;
                                        const created = new Date(comanda.CreatedAt);
                                        const now = new Date();
                                        const diffMs = now - created;
                                        const diffMins = Math.floor(diffMs / 60000);
                                        if (diffMins < 1) return { text: 'ahora', urgency: 'normal' };
                                        if (diffMins < 10) return { text: `${diffMins} min`, urgency: 'normal' };
                                        if (diffMins < 20) return { text: `${diffMins} min`, urgency: 'warning' };
                                        return { text: `${diffMins} min`, urgency: 'urgent' };
                                    };
                                    const timeAgo = getTimeAgo();
                                    const displayPlatilloName = getKitchenDisplayPlatilloName(comanda);
                                    const variantName = comanda.Details?.Variants?.[comanda.Details?.SelectedVariant]?.VariantName;
                                    
                                    return (
                                    <DebugCardHeightShell
                                        key={comanda.ComandaId}
                                        trackKey={`extra-${comanda.ComandaId}-${comanda._id}`}
                                        className="bebida-item"
                                        badgeVariant="bebida"
                                        onContextMenu={(e) => handleContextMenu(e, comanda)}
                                        style={{ cursor: 'context-menu', position: 'relative' }}
                                    >
                                        {/* Número de comanda arriba a la derecha */}
                                        <div className="bebida-comanda-number">{comanda.ComandaId}</div>
                                        
                                        {/* Tiempo transcurrido */}
                                        {timeAgo && (
                                            <div className={`bebida-time-badge bebida-time-${timeAgo.urgency}`}>
                                                {timeAgo.text}
                                            </div>
                                        )}
                                        
                                        <div className="bebida-icons-stack">
                                            <div className="bebida-deliver-icon">
                                                <img 
                                                    src={comanda.ComandaDeliverMode === "Delivery" ? "Ideogram/llevare.png" : "Ideogram/aquie.png"}
                                                    alt={comanda.ComandaDeliverMode === "Delivery" ? "Para llevar" : "Comer aquí"}
                                                />
                                            </div>
                                            <div className="bebida-thumb">
                                                {comanda.Imagen ? (
                                                    <img src={comanda.Imagen} alt={comanda.Platillo} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                ) : (
                                                    <div className="bebida-thumb-fallback" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="bebida-meta">
                                            <div className="bebida-name-row">
                                                <div className="bebida-name">{displayPlatilloName}</div>
                                            </div>
                                            {variantName && (
                                                <div className="bebida-variant-badge">{variantName.toUpperCase()}</div>
                                            )}
                                            {comanda.Platillo === "Hamburguesa" && getAderezosPreview(comanda) && (
                                                <div className={`hamburguesa-aderezos-preview ${getAderezosPreview(comanda) === "TODOS" ? 'aderezos-todos' : ''}`}>
                                                    <span className="aderezos-label">Aderezos:</span> {getAderezosPreview(comanda)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="bebida-right">
                                            <div className="bebida-price">${Number(comanda.Precio || 0).toFixed(0)}</div>
                                        </div>
                                    </DebugCardHeightShell>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // Renderizar bebidas agrupadas por orden (panel lateral)
    const renderBebidasPanel = () => {
        if (arrayBebidas.length === 0) return null;

        // Agrupar bebidas por OrderID
        const bebidasByOrder = new Map();
        arrayBebidas.forEach(comanda => {
            const orderId = comanda.OrderID;
            if (!bebidasByOrder.has(orderId)) {
                bebidasByOrder.set(orderId, {
                    orderId,
                    customer: comanda.Customer,
                    comandas: [],
                    total: 0
                });
            }
            const order = bebidasByOrder.get(orderId);
            order.comandas.push(comanda);
            order.total += comanda.Precio || 0;
        });

        const orderedBebidas = Array.from(bebidasByOrder.values())
            .map((order) => ({
                ...order,
                comandas: sortComandasByComandaId(order.comandas),
            }))
            .sort((a, b) => Number(a.orderId) - Number(b.orderId));

        return (
            <>
                <div className="bebidas-header">
                    <span>BEBIDAS</span>
                    <span className="bebidas-header-count">{arrayBebidas.length}</span>
                </div>
                <div className="bebidas-list">
                    {orderedBebidas.map(order => (
                        <div key={order.orderId} className="bebidas-order-card">
                            <div className="bebidas-order-header">
                                <div className="bebidas-order-title">
                                    <div className="bebidas-order-number">#{order.orderId}</div>
                                    <div className="bebidas-order-subtitle">{order.customer || 'Cliente'}</div>
                                </div>
                                <div className="bebidas-order-metrics">
                                    <span className="bebidas-pill bebidas-pill-count">{order.comandas.length} bebidas</span>
                                    <span className="bebidas-pill bebidas-pill-total">${order.total.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className="bebidas-items">
                                {order.comandas.map((comanda, comandaIndex) => {
                                    const getTimeAgo = () => {
                                        if (!comanda.CreatedAt) return null;
                                        const created = new Date(comanda.CreatedAt);
                                        const now = new Date();
                                        const diffMs = now - created;
                                        const diffMins = Math.floor(diffMs / 60000);
                                        if (diffMins < 1) return { text: 'ahora', urgency: 'normal' };
                                        if (diffMins < 10) return { text: `${diffMins} min`, urgency: 'normal' };
                                        if (diffMins < 20) return { text: `${diffMins} min`, urgency: 'warning' };
                                        return { text: `${diffMins} min`, urgency: 'urgent' };
                                    };
                                    const timeAgo = getTimeAgo();
                                    
                                    return (
                                    <DebugCardHeightShell
                                        key={comanda.ComandaId}
                                        trackKey={`bebida-${comanda.ComandaId}-${comanda._id}`}
                                        className="bebida-item"
                                        badgeVariant="bebida"
                                        onContextMenu={(e) => handleContextMenu(e, comanda)}
                                        style={{ cursor: 'context-menu', position: 'relative' }}
                                    >
                                        <div className="bebida-comanda-number">{comanda.ComandaId}</div>
                                        {timeAgo && (
                                            <div className={`bebida-time-badge bebida-time-${timeAgo.urgency}`}>
                                                {timeAgo.text}
                                            </div>
                                        )}
                                        <div className="bebida-icons-stack">
                                            <div className="bebida-deliver-icon">
                                                <img 
                                                    src={comanda.ComandaDeliverMode === "Delivery" ? "Ideogram/llevare.png" : "Ideogram/aquie.png"}
                                                    alt={comanda.ComandaDeliverMode === "Delivery" ? "Para llevar" : "Comer aquí"}
                                                />
                                            </div>
                                            <div className="bebida-thumb">
                                                {comanda.Imagen ? (
                                                    <img src={comanda.Imagen} alt={comanda.Platillo} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                ) : (
                                                    <div className="bebida-thumb-fallback" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="bebida-meta">
                                            <div className="bebida-name-row">
                                                <div className="bebida-name">{comanda.Platillo}</div>
                                            </div>
                                            {comanda.Details?.Variants?.[comanda.Details?.SelectedVariant]?.VariantName && (
                                                <div className="bebida-descriptor">{comanda.Details.Variants[comanda.Details.SelectedVariant].VariantName}</div>
                                            )}
                                        </div>
                                        <div className="bebida-right">
                                            <div className="bebida-price">${Number(comanda.Precio || 0).toFixed(0)}</div>
                                        </div>
                                    </DebugCardHeightShell>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // Renderizar waffles agrupados por orden (panel lateral)
    const renderWafflesPanel = () => {
        if (arrayWaffles.length === 0) return null;

        // Agrupar waffles por OrderID
        const wafflesByOrder = new Map();
        arrayWaffles.forEach(comanda => {
            const orderId = comanda.OrderID;
            if (!wafflesByOrder.has(orderId)) {
                wafflesByOrder.set(orderId, {
                    orderId,
                    customer: comanda.Customer,
                    comandas: [],
                    total: 0
                });
            }
            const order = wafflesByOrder.get(orderId);
            order.comandas.push(comanda);
            order.total += comanda.Precio || 0;
        });

        const orderedWaffles = Array.from(wafflesByOrder.values())
            .map((order) => ({
                ...order,
                comandas: sortComandasByComandaId(order.comandas),
            }))
            .sort((a, b) => Number(a.orderId) - Number(b.orderId));

        return (
            <>
                <div className="bebidas-header waffles-header">
                    <span>WAFFLES</span>
                    <span className="bebidas-header-count">{arrayWaffles.length}</span>
                </div>
                <div className="bebidas-list waffles-list">
                    {orderedWaffles.map(order => (
                        <div key={order.orderId} className="bebidas-order-card">
                            <div className="bebidas-order-header">
                                <div className="bebidas-order-title">
                                    <div className="bebidas-order-number">#{order.orderId}</div>
                                    <div className="bebidas-order-subtitle">{order.customer || 'Cliente'}</div>
                                </div>
                                <div className="bebidas-order-metrics">
                                    <span className="bebidas-pill bebidas-pill-count">{order.comandas.length} waffles</span>
                                    <span className="bebidas-pill bebidas-pill-total">${order.total.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className="bebidas-items">
                                {order.comandas.map((comanda, comandaIndex) => {
                                    const getTimeAgo = () => {
                                        if (!comanda.CreatedAt) return null;
                                        const created = new Date(comanda.CreatedAt);
                                        const now = new Date();
                                        const diffMs = now - created;
                                        const diffMins = Math.floor(diffMs / 60000);
                                        if (diffMins < 1) return { text: 'ahora', urgency: 'normal' };
                                        if (diffMins < 10) return { text: `${diffMins} min`, urgency: 'normal' };
                                        if (diffMins < 20) return { text: `${diffMins} min`, urgency: 'warning' };
                                        return { text: `${diffMins} min`, urgency: 'urgent' };
                                    };
                                    const timeAgo = getTimeAgo();
                                    
                                    return (
                                    <DebugCardHeightShell
                                        key={comanda.ComandaId}
                                        trackKey={`waffle-${comanda.ComandaId}-${comanda._id}`}
                                        className="bebida-item"
                                        badgeVariant="bebida"
                                        onContextMenu={(e) => handleContextMenu(e, comanda)}
                                        style={{ cursor: 'context-menu', position: 'relative' }}
                                    >
                                        <div className="bebida-comanda-number">{comanda.ComandaId}</div>
                                        {timeAgo && (
                                            <div className={`bebida-time-badge bebida-time-${timeAgo.urgency}`}>
                                                {timeAgo.text}
                                            </div>
                                        )}
                                        <div className="bebida-icons-stack">
                                            <div className="bebida-deliver-icon">
                                                <img 
                                                    src={comanda.ComandaDeliverMode === "Delivery" ? "Ideogram/llevare.png" : "Ideogram/aquie.png"}
                                                    alt={comanda.ComandaDeliverMode === "Delivery" ? "Para llevar" : "Comer aquí"}
                                                />
                                            </div>
                                            <div className="bebida-thumb">
                                                {comanda.Imagen ? (
                                                    <img src={comanda.Imagen} alt={comanda.Platillo} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                ) : (
                                                    <div className="bebida-thumb-fallback" />
                                                )}
                                            </div>
                                        </div>
                                        <div className="bebida-meta">
                                            <div className="bebida-name-row">
                                                <div className="bebida-name">{comanda.Platillo}</div>
                                            </div>
                                            {comanda.Details?.Variants?.[comanda.Details?.SelectedVariant]?.VariantName && (
                                                <div className="bebida-descriptor">{comanda.Details.Variants[comanda.Details.SelectedVariant].VariantName}</div>
                                            )}
                                        </div>
                                        <div className="bebida-right">
                                            <div className="bebida-price">${Number(comanda.Precio || 0).toFixed(0)}</div>
                                        </div>
                                    </DebugCardHeightShell>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // Socket listeners
    useEffect(() => {
        socket.on('NuevaComandaDesdeServidor', () => {
            fetchComandasFromOrders();
        });
        return () => socket.off('NuevaComandaDesdeServidor');
    }, [Orders]);

    useEffect(() => {
        socket.on('UpdateComandaDesdeServidor', () => fetchComandasFromOrders());
        return () => socket.off('UpdateComandaDesdeServidor');
    }, [Orders]);

    useEffect(() => {
        socket.on('DeleteComandaDesdeServidor', () => fetchComandasFromOrders());
        return () => socket.off('DeleteComandaDesdeServidor');
    }, [Orders]);

    // Verificar si hay contenido
    const hasMainOrders = mainOrders.length > 0;
    const hasExtraOrders = extraOrders.length > 0;
    const hasBebidas = arrayBebidas.length > 0;
    const hasWaffles = arrayWaffles.length > 0;
    const hasLeftPanel = hasExtraOrders || hasBebidas || hasWaffles;
    const hasAnything = hasMainOrders || hasExtraOrders || hasBebidas || hasWaffles;

    return (
        <div className="cocina-new-layout">
            {/* Layout principal */}
            <div className="main-layout">
                {/* Panel lateral izquierdo: Órdenes Próximas + Bebidas + Waffles */}
                {hasLeftPanel && (
                    <div className="bebidas-column">
                        {renderExtraOrdersPanel()}
                        {renderBebidasPanel()}
                        {renderWafflesPanel()}
                    </div>
                )}

                {/* Contenido principal: 4 columnas de órdenes */}
                <div className="content-right">
                    {hasMainOrders ? (
                        <div className="four-columns-grid">
                            {mainOrders.map((order, idx) => renderOrderColumn(order, idx))}
                            {/* Columnas vacías si hay menos de 4 órdenes */}
                            {Array.from({ length: 4 - mainOrders.length }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="order-column order-column-empty">
                                    <div className="column-header column-header-empty">
                                        <span className="empty-column-text">Sin orden</span>
                                    </div>
                                    <div className="order-column-body order-column-body-empty"></div>
                                </div>
                            ))}
                        </div>
                    ) : hasAnything ? (
                        <div className="no-orders-message">
                            <span>No hay órdenes principales pendientes</span>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Mensaje cuando no hay nada */}
            {!hasAnything && (
                <div className="empty-kitchen">
                    <div className="empty-kitchen-message">
                        🍽️ No hay comandas pendientes
                    </div>
                </div>
            )}

            {/* Menú contextual */}
            {contextMenu.visible && (
                <div className="context-menu-overlay" onClick={closeContextMenu}>
                    <div 
                        className="context-menu"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="context-menu-header">
                            <span className="context-menu-title">
                                {contextMenu.comanda?.Platillo || 'Comanda'}
                            </span>
                            <span className="context-menu-subtitle">
                                #{contextMenu.comanda?.OrderID} • ${contextMenu.comanda?.Precio || 0}
                            </span>
                        </div>
                        <button 
                            className="context-menu-btn context-menu-btn-delivered"
                            onClick={handleMarkAsDelivered}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Entregado
                        </button>
                        <button 
                            className="context-menu-btn context-menu-btn-delete"
                            onClick={handleDeleteComanda}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Solicitar borrado
                        </button>
                        <button 
                            className="context-menu-btn context-menu-btn-cancel"
                            onClick={closeContextMenu}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CocinaNewFeaturesKitchenBoard;
