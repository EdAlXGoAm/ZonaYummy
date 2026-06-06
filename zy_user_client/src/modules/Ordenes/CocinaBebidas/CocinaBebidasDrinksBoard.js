import React, { useState, useEffect } from 'react';
import comandasApi from './../../../api/comandasApi';
import borradosApi from './../../../api/borradosApi';
import CocinaBebidasComandaCard from './CocinaBebidasComandaCard';
import './../MeseroPage/OrdenesCocina.css';

import io from 'socket.io-client';
const socket = io(`${process.env.REACT_APP_API_URL}`);

const CocinaBebidasDrinksBoard = ({ Orders }) => {
    const [activeComandas, setActiveComandas] = useState([]);
    const [arrayBebidas, setArrayBebidas] = useState([]);
    const [arrayWaffles, setArrayWaffles] = useState([]);

    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        comanda: null
    });

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

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, comanda: null });
    };

    const handleDeleteComanda = async () => {
        if (!contextMenu.comanda) return;

        const comanda = contextMenu.comanda;
        const confirmar = window.confirm(
            '¿Solicitar eliminación de esta comanda? Un supervisor debe autorizarla en /autorización_borrados.',
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

            setActiveComandas(prev => prev.filter(c => c.ComandaId !== comanda.ComandaId));
            closeContextMenu();
        } catch (error) {
            console.error("Error al marcar como entregado:", error);
            alert("Error al marcar como entregado");
        }
    };

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
        const comandasPromises = Orders.map(order => {
            return comandasApi.getComandasByOrderId(order.OrderID)
                .then(response => {
                    return response.map(comanda => ({
                        ...comanda,
                        Customer: order.Customer
                    }));
                })
                .catch(e => {
                    console.log(e);
                    return [];
                });
        });

        Promise.all(comandasPromises).then(comandasResults => {
            setActiveComandas(comandasResults.flat());
        }).catch(e => {
            console.log("Error al recuperar comandas: ", e);
        });
    };

    useEffect(() => {
        if (Orders.length > 0) {
            fetchComandasFromOrders();
        } else {
            setActiveComandas([]);
        }
    }, [Orders]);

    const fetchCategorias = () => {
        const localComandasForCategorize = [...activeComandas].filter(c => c.ComandaPrepStatus !== "ReadyToServe");
        setArrayBebidas(localComandasForCategorize.filter(c => c.Categoria === "Bebidas"));
        setArrayWaffles(localComandasForCategorize.filter(c => c.Categoria === "Waffles"));
    };

    useEffect(() => {
        fetchCategorias();
    }, [activeComandas]);

    return (
        <div className="container-fluid">
            {arrayBebidas.length > 0 && (
                <div className="fila-elemento">
                    <div className="category-banner">BEBIDAS</div>
                    <div className="row">
                        {arrayBebidas.map((comanda) => (
                            <div
                                key={comanda.ComandaId}
                                className="col-3"
                                onContextMenu={(e) => handleContextMenu(e, comanda)}
                            >
                                <CocinaBebidasComandaCard Comanda={comanda} compact />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {arrayWaffles.length > 0 && (
                <div className="fila-elemento">
                    <div className="category-banner">WAFFLES</div>
                    <div className="row">
                        {arrayWaffles.map((comanda) => (
                            <div
                                key={comanda.ComandaId}
                                className="col-3"
                                onContextMenu={(e) => handleContextMenu(e, comanda)}
                            >
                                <CocinaBebidasComandaCard Comanda={comanda} compact />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {arrayBebidas.length === 0 && arrayWaffles.length === 0 && (
                <div className="fila-elemento">
                    <div style={{ textAlign: 'center', padding: '50px', fontSize: '24px', color: '#666' }}>
                        No hay bebidas ni waffles pendientes
                    </div>
                </div>
            )}

            {contextMenu.visible && (
                <div
                    className="context-menu-overlay"
                    onClick={closeContextMenu}
                >
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

export default CocinaBebidasDrinksBoard;
