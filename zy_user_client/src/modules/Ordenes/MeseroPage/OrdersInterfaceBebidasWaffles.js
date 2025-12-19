import React, { useState, useEffect } from 'react';
import ordersApi from './../../../api/ordersApi';
import comandasApi from './../../../api/comandasApi';
import ResumeComanda from './ResumeComandaComponent';
import './OrdenesCocina.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import io from 'socket.io-client';
const socket = io(`${process.env.REACT_APP_API_URL}`);

const OrdersInterfaceBebidasWaffles = () => {
    const notify = (message) => toast(message);
    const [orders, setOrders] = useState([]);
    const [activeComandas, setActiveComandas] = useState([]);
    const [arrayBebidas, setArrayBebidas] = useState([]);
    const [arrayWaffles, setArrayWaffles] = useState([]);

    // Estado para controlar si el audio está habilitado
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [showAudioModal, setShowAudioModal] = useState(true);

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

    // Eliminar comanda
    const handleDeleteComanda = async () => {
        if (!contextMenu.comanda) return;
        
        const comanda = contextMenu.comanda;
        const comandaId = comanda._id || comanda.ComandaId;
        const platillo = comanda.Platillo;
        
        try {
            await comandasApi.deleteComanda(comandaId);
            socket.emit('DeleteComandaDesdeCliente', { msg: `Delete-${comanda.OrderID}-${platillo}` });
            socket.emit('OrdenActualizadaDesdeCliente', { msg: comanda.OrderID });
            setActiveComandas(prev => prev.filter(c => c.ComandaId !== comanda.ComandaId));
            closeContextMenu();
        } catch (error) {
            console.error("Error al eliminar comanda:", error);
            notify(`Error al eliminar la comanda: ${error}`);
        }
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
            
            setActiveComandas(prev => prev.filter(c => c.ComandaId !== comanda.ComandaId));
            closeContextMenu();
        } catch (error) {
            console.error("Error al marcar como entregado:", error);
            notify(`Error al marcar como entregado: ${error}`);
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

    const fetchOrders = () => {
        ordersApi.getOrdersByOrderCustStatus("InPlace")
        .then(data => {
            setOrders(prevOrders => {return (data);});
        })
        .catch(err => {
            console.log(err);
            notify(`Error al cargar las comandas: ${err}`);
        });
    };

    const fetchComandasFromOrders = () => {
        let localOrders = orders;
        let localActiveComandas = [];

        let comandasPromises = localOrders.map(order => {
            return comandasApi.getComandasByOrderId(order.OrderID)
                .then(response => {
                    const res_comandas = response.map(comanda => {
                        return {
                            ...comanda,
                            Customer: order.Customer
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
            localActiveComandas = comandasResults.flat();
            setActiveComandas(prevActiveComandas => {
                return (localActiveComandas);
            });
        }).catch(e => {
            console.log("Error al recuperar comandas: ", e);
        });
    };

    useEffect(() => {
        if (orders.length > 0) {
            fetchComandasFromOrders();
        }
    }, [orders]);

    const fetchCategorias = () => {
        // Filtrar solo las que no están entregadas
        let localComandasForCategorize = [...activeComandas].filter(c => c.ComandaPrepStatus !== "ReadyToServe");
        // Filtrar solo Bebidas y Waffles
        const localArrayBebidas = localComandasForCategorize.filter(c => c.Categoria === "Bebidas");
        const localArrayWaffles = localComandasForCategorize.filter(c => c.Categoria === "Waffles");

        setArrayBebidas(localArrayBebidas);
        setArrayWaffles(localArrayWaffles);
    }

    useEffect(() => { 
        fetchCategorias();
    }, [activeComandas]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchOrders();
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const hacerAlgo = () => {
            fetchOrders();
        };
        const intervalo = setInterval(hacerAlgo, 5000);
        return () => clearInterval(intervalo);
    }, []);

    // Socket listeners
    useEffect(() => {
        socket.on('NuevaComandaDesdeServidor', (data) => {
            fetchOrders();
        });
        return () => {
            socket.off('NuevaComandaDesdeServidor');
        };
    }, []);

    useEffect(() => {
        socket.on('UpdateComandaDesdeServidor', (data) => {
            console.log("UpdateComandaDesdeServidor: ", data.msg);
            fetchOrders();
        });
        return () => {
            socket.off('UpdateComandaDesdeServidor');
        };
    }, []);

    useEffect(() => {
        socket.on('DeleteComandaDesdeServidor', (data) => {
            console.log("DeleteComandaDesdeServidor: ", data.msg);
            fetchOrders();
        });
        return () => {
            socket.off('DeleteComandaDesdeServidor');
        };
    }, []);

    useEffect(() => {
        socket.on('OrdenActualizadaDesdeServidor', (data) => {
            console.log("OrdenActualizadaDesdeServidor Mensaje: ", data);
            fetchOrders();
        });
        return () => {
            socket.off('OrdenActualizadaDesdeServidor');
        };
    }, []);

    return (
        <div className="container-fluid">
            <ToastContainer />
            
            {/* Sección de Bebidas */}
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
                                <ResumeComanda Comanda={comanda} compact />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sección de Waffles */}
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
                                <ResumeComanda Comanda={comanda} compact />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Mensaje cuando no hay comandas */}
            {arrayBebidas.length === 0 && arrayWaffles.length === 0 && (
                <div className="fila-elemento">
                    <div style={{ textAlign: 'center', padding: '50px', fontSize: '24px', color: '#666' }}>
                        No hay bebidas ni waffles pendientes
                    </div>
                </div>
            )}

            {/* Menú contextual para eliminar */}
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
                            Eliminar Comanda
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

            {/* Modal de confirmación de audio */}
            {showAudioModal && (
                <div 
                    className="context-menu-overlay"
                    style={{ zIndex: 10001 }}
                >
                    <div 
                        className="context-menu"
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            minWidth: '400px',
                            maxWidth: '500px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="context-menu-header" style={{ background: 'linear-gradient(135deg, #00bcd4 0%, #ff1493 100%)' }}>
                            <span className="context-menu-title" style={{ color: '#ffffff', fontSize: '24px' }}>
                                🔊 Activación de Audio
                            </span>
                        </div>
                        <div style={{ padding: '24px 20px' }}>
                            <p style={{ 
                                fontSize: '18px', 
                                lineHeight: '1.6', 
                                color: '#333',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }}>
                                Para que las comandas se puedan escuchar, es necesario hacer clic en <strong>"Aceptar"</strong>.
                            </p>
                            <p style={{ 
                                fontSize: '14px', 
                                lineHeight: '1.5', 
                                color: '#666',
                                textAlign: 'center',
                                marginBottom: '0'
                            }}>
                                Esto activará la reproducción de audio para las nuevas comandas.
                            </p>
                        </div>
                        <div style={{ padding: '0 20px 20px 20px' }}>
                            <button 
                                className="context-menu-btn"
                                style={{
                                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                    color: '#ffffff',
                                    fontWeight: '700',
                                    fontSize: '18px',
                                    marginBottom: '12px'
                                }}
                                onClick={() => {
                                    setAudioEnabled(true);
                                    setShowAudioModal(false);
                                }}
                            >
                                ✓ Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersInterfaceBebidasWaffles;

