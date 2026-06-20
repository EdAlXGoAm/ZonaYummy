import React, { useEffect, useMemo, useRef, useState } from 'react';
import comandasApi from './../../../api/comandasApi';
import {
    filterOutRecentlyDelivered,
} from '../kitchenComandaSyncUtils';
import {
    getComandaVariantName,
    getKitchenDisplayPlatilloName,
} from './cocinadosComandaUtils';
import { isOrigenWhatsapp } from '../Mesero/meseroOrigenUtils';
import './CocinadosListBoard.css';

import io from 'socket.io-client';

const socket = io(`${process.env.REACT_APP_API_URL}`);
const FETCH_COMANDAS_DEBOUNCE_MS = 150;

const sortComandasByComandaId = (comandas) => [...comandas].sort(
    (a, b) => Number(a.ComandaId) - Number(b.ComandaId),
);

const isDelivered = (comanda) => comanda.ComandaPrepStatus === 'ReadyToServe';

const getComandaNeedsSummary = (comanda) => {
    const variant = comanda.Details?.Variants?.[comanda.Details?.SelectedVariant];
    if (!variant) {
        return '—';
    }

    const parts = [];

    variant.Componentes?.forEach((componente) => {
        parts.push(`${componente.Checked ? 'CON' : 'SIN'} ${componente.Name}`);
    });

    variant.Opciones?.forEach((opcion) => {
        const selected = opcion.Items?.[opcion.SelectedItem];
        if (selected?.Name && selected.Name !== 'No aplica') {
            parts.push(`${opcion.Name}: ${selected.Name}`);
        }
    });

    variant.Ingredientes?.forEach((grupo) => {
        const checked = grupo.Items?.filter((item) => item.Checked) ?? [];
        const total = grupo.Items?.length ?? 0;
        if (total === 0) {
            return;
        }
        if (checked.length === 0) {
            parts.push(`${grupo.Name}: NADA`);
        } else if (checked.length === total) {
            parts.push(`${grupo.Name}: CON TODO`);
        } else {
            parts.push(`${grupo.Name}: ${checked.map((item) => item.Name).join(', ')}`);
        }
    });

    variant.Extras?.filter((extra) => extra.Checked).forEach((extra) => {
        parts.push(`+ ${extra.Extra}`);
    });

    variant.Adicionales?.filter((adicional) => adicional.Checked).forEach((adicional) => {
        parts.push(`+ ${adicional.Adicional}`);
    });

    return parts.length > 0 ? parts.join(' · ') : '—';
};

const CocinadosListBoard = ({ Orders }) => {
    const [activeComandas, setActiveComandas] = useState([]);
    const fetchSeqRef = useRef(0);
    const fetchComandasTimerRef = useRef(null);
    const recentlyDeliveredRef = useRef(new Map());

    const fetchComandasFromOrders = () => {
        const fetchId = ++fetchSeqRef.current;

        const comandasPromises = Orders.map((order) => comandasApi.getComandasByOrderId(order.OrderID)
            .then((response) => response.map((comanda) => ({
                ...comanda,
                Customer: order.Customer,
                Origen: order.Origen || '',
            })))
            .catch(() => []));

        Promise.all(comandasPromises).then((comandasResults) => {
            if (fetchId !== fetchSeqRef.current) {
                return;
            }
            const localActiveComandas = filterOutRecentlyDelivered(
                comandasResults.flat(),
                recentlyDeliveredRef,
            );
            setActiveComandas(localActiveComandas);
        }).catch((error) => {
            if (fetchId !== fetchSeqRef.current) {
                return;
            }
            console.log('Error al recuperar comandas:', error);
        });
    };

    const scheduleFetchComandas = () => {
        if (fetchComandasTimerRef.current) {
            clearTimeout(fetchComandasTimerRef.current);
        }
        fetchComandasTimerRef.current = setTimeout(() => {
            fetchComandasTimerRef.current = null;
            fetchComandasFromOrders();
        }, FETCH_COMANDAS_DEBOUNCE_MS);
    };

    useEffect(() => {
        scheduleFetchComandas();
        return () => {
            if (fetchComandasTimerRef.current) {
                clearTimeout(fetchComandasTimerRef.current);
            }
        };
    }, [Orders]);

    useEffect(() => {
        socket.on('NuevaComandaDesdeServidor', scheduleFetchComandas);
        socket.on('UpdateComandaDesdeServidor', scheduleFetchComandas);
        socket.on('DeleteComandaDesdeServidor', scheduleFetchComandas);

        return () => {
            socket.off('NuevaComandaDesdeServidor', scheduleFetchComandas);
            socket.off('UpdateComandaDesdeServidor', scheduleFetchComandas);
            socket.off('DeleteComandaDesdeServidor', scheduleFetchComandas);
        };
    }, [Orders]);

    const pendingComandas = useMemo(
        () => sortComandasByComandaId(activeComandas.filter((comanda) => !isDelivered(comanda))),
        [activeComandas],
    );

    const ordersSummary = useMemo(() => {
        const orderMap = new Map();

        pendingComandas.forEach((comanda) => {
            const orderId = comanda.OrderID;
            if (!orderMap.has(orderId)) {
                orderMap.set(orderId, {
                    orderId,
                    customer: comanda.Customer,
                    origen: comanda.Origen || '',
                    comandaCount: 0,
                    total: 0,
                });
            }
            const order = orderMap.get(orderId);
            order.comandaCount += 1;
            order.total += comanda.Precio || 0;
            if (comanda.Origen && !order.origen) {
                order.origen = comanda.Origen;
            }
        });

        return Array.from(orderMap.values()).sort((a, b) => Number(a.orderId) - Number(b.orderId));
    }, [pendingComandas]);

    return (
        <div className="cocinado-layout">
            <header className="cocinado-list-header">
                <div>
                    <h1>Cocinado</h1>
                    <p>Vista de datos para reconstruir el board. Solo comandas no entregadas.</p>
                </div>
                <div className="cocinado-list-stats">
                    <span>{Orders.length} órdenes InPlace</span>
                    <span>{ordersSummary.length} órdenes con comandas activas</span>
                    <span>{pendingComandas.length} comandas pendientes</span>
                </div>
            </header>

            <section className="cocinado-list-section">
                <h2>Órdenes</h2>
                {ordersSummary.length === 0 ? (
                    <p className="cocinado-list-empty">No hay órdenes con comandas pendientes.</p>
                ) : (
                    <div className="cocinado-list-table-wrap">
                        <table className="cocinado-list-table">
                            <thead>
                                <tr>
                                    <th>Orden #</th>
                                    <th>Cliente</th>
                                    <th>Origen</th>
                                    <th>Comandas</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordersSummary.map((order) => (
                                    <tr key={order.orderId}>
                                        <td>#{order.orderId}</td>
                                        <td>{order.customer || 'Cliente'}</td>
                                        <td>
                                            {isOrigenWhatsapp(order.origen) ? 'WhatsApp' : (order.origen || '—')}
                                        </td>
                                        <td>{order.comandaCount}</td>
                                        <td>${order.total.toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="cocinado-list-section">
                <h2>Comandas</h2>
                {pendingComandas.length === 0 ? (
                    <p className="cocinado-list-empty">No hay comandas pendientes.</p>
                ) : (
                    <div className="cocinado-list-table-wrap">
                        <table className="cocinado-list-table cocinado-list-table--comandas">
                            <thead>
                                <tr>
                                    <th>Orden #</th>
                                    <th>Cliente</th>
                                    <th>Comanda #</th>
                                    <th>Platillo</th>
                                    <th>Variante</th>
                                    <th>Categoría</th>
                                    <th>Prep</th>
                                    <th>Pago</th>
                                    <th>Entrega</th>
                                    <th>Precio</th>
                                    <th>Notas</th>
                                    <th>Detalle / necesidades</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingComandas.map((comanda) => (
                                    <tr key={comanda._id || `${comanda.OrderID}-${comanda.ComandaId}`}>
                                        <td>#{comanda.OrderID}</td>
                                        <td>{comanda.Customer || 'Cliente'}</td>
                                        <td>{comanda.ComandaId}</td>
                                        <td>{getKitchenDisplayPlatilloName(comanda)}</td>
                                        <td>{getComandaVariantName(comanda) || '—'}</td>
                                        <td>{comanda.Categoria || '—'}</td>
                                        <td>{comanda.ComandaPrepStatus || '—'}</td>
                                        <td>{comanda.ComandaPaidStatus || '—'}</td>
                                        <td>{comanda.ComandaDeliverMode || '—'}</td>
                                        <td>${Number(comanda.Precio || 0).toFixed(0)}</td>
                                        <td>{comanda.Notas || '—'}</td>
                                        <td className="cocinado-list-needs">{getComandaNeedsSummary(comanda)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default CocinadosListBoard;
