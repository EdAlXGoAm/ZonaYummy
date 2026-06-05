import React, { useState, useEffect, useMemo } from 'react';
import ordersApi from './../../../api/ordersApi';
import comandasApi from './../../../api/comandasApi';
import ResumeComanda from './ResumeComandaComponent';
import './OrdenesCocina.css';

import io from 'socket.io-client';
const socket = io(`${process.env.REACT_APP_API_URL}`);

const OrdenesCocina = ({modeInterface, Orders}) => {
    const [numOrders, setNumOrders] = useState([]);
 
    const [activeComandas, setActiveComandas] = useState([]);
    const [arrayPostres, setArrayPostres] = useState([]);
    const [arrayBebidas, setArrayBebidas] = useState([]);
    const [arrayBotanas, setArrayBotanas] = useState([]);
    const [arrayComidas, setArrayComidas] = useState([]);
    const [arrayWaffles, setArrayWaffles] = useState([]);

    // Estado para controlar si el audio está habilitado
    const [audioEnabled] = useState(false);

    // Estado para el menú contextual (comandas individuales)
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        comanda: null
    });

    // Estado para el menú contextual de órdenes completas
    const [orderContextMenu, setOrderContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        order: null
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
        const comandaId = comanda._id || comanda.ComandaId; // La API usa _id (MongoDB)
        const platillo = comanda.Platillo;
        
        try {
            await comandasApi.deleteComanda(comandaId);
            // Emitir eventos de socket para actualizar en tiempo real
            socket.emit('DeleteComandaDesdeCliente', { msg: `Delete-${comanda.OrderID}-${platillo}` });
            // También emitir actualización de orden para que el mesero refresque
            socket.emit('OrdenActualizadaDesdeCliente', { msg: comanda.OrderID });
            // Actualizar estado local inmediatamente
            setActiveComandas(prev => prev.filter(c => c.ComandaId !== comanda.ComandaId));
            closeContextMenu();
        } catch (error) {
            console.error("Error al eliminar comanda:", error);
            alert("Error al eliminar la comanda");
        }
    };

    // Marcar comanda como entregada
    const handleMarkAsDelivered = async () => {
        if (!contextMenu.comanda) return;
        
        const comanda = contextMenu.comanda;
        
        try {
            // Actualizar el estado de la comanda a "ReadyToServe"
            const updatedComanda = {
                ...comanda,
                ComandaPrepStatus: "ReadyToServe"
            };
            await comandasApi.updateComanda(updatedComanda);
            
            // Emitir evento de socket para actualizar en tiempo real
            socket.emit('UpdateComandaDesdeCliente', { msg: `Update-${comanda.OrderID}-${comanda.Platillo}` });
            socket.emit('OrdenActualizadaDesdeCliente', { msg: comanda.OrderID });
            
            // Actualizar estado local inmediatamente (remover de la vista de cocina)
            setActiveComandas(prev => prev.filter(c => c.ComandaId !== comanda.ComandaId));
            closeContextMenu();
        } catch (error) {
            console.error("Error al marcar como entregado:", error);
            alert("Error al marcar como entregado");
        }
    };

    // Cerrar menú al hacer clic fuera (con delay para evitar cierre inmediato)
    useEffect(() => {
        if (!contextMenu.visible) return;
        
        const handleClickOutside = (e) => {
            // No cerrar si el clic es dentro del menú
            const menu = document.querySelector('.context-menu');
            if (menu && menu.contains(e.target)) return;
            closeContextMenu();
        };
        
        // Agregar listeners con un pequeño delay para evitar que el evento original los dispare
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

    // ========== MENÚ CONTEXTUAL PARA ÓRDENES COMPLETAS ==========
    
    // Manejar clic derecho sobre una orden en el banner
    const handleOrderContextMenu = (e, order) => {
        e.preventDefault();
        e.stopPropagation();
        setOrderContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            order
        });
    };

    // Cerrar menú contextual de orden
    const closeOrderContextMenu = () => {
        setOrderContextMenu({ visible: false, x: 0, y: 0, order: null });
    };

    // Eliminar orden completa
    const handleDeleteOrder = async () => {
        if (!orderContextMenu.order) return;
        
        const order = orderContextMenu.order;
        const orderId = order.orderId;
        
        try {
            // Usar ordersApi.deleteOrder que elimina comandas + orden
            await ordersApi.deleteOrder(orderId);
            
            // Emitir eventos de socket para actualizar en tiempo real
            socket.emit('OrdenEliminadaDesdeCliente', { msg: orderId });
            socket.emit('OrdenActualizadaDesdeCliente', { msg: orderId });
            
            // Actualizar estado local inmediatamente
            setActiveComandas(prev => prev.filter(c => c.OrderID !== orderId));
            closeOrderContextMenu();
        } catch (error) {
            console.error("Error al eliminar orden:", error);
            alert("Error al eliminar la orden");
        }
    };

    // Cerrar menú de orden al hacer clic fuera
    useEffect(() => {
        if (!orderContextMenu.visible) return;
        
        const handleClickOutside = (e) => {
            const menu = document.querySelector('.order-context-menu');
            if (menu && menu.contains(e.target)) return;
            closeOrderContextMenu();
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
    }, [orderContextMenu.visible]);

    const fetchComandasFromOrders = () => {
        console.log("fetchComandasFromOrders using the next Orders:", Orders)
        setNumOrders(Orders.length); // Just fill the const
        let localOrders = Orders;
        let localActiveComandas = [];// Transforma cada 'Order' en una promesa que resuelve sus 'comandas'

        let comandasPromises = localOrders.map(order => {
            return comandasApi.getComandasByOrderId(order.OrderID)
                .then(response => {
                    const res_comandas = response.map(comanda => {
                        return {
                            ...comanda, // Esto copia todas las propiedades existentes del postre
                            Customer: order.Customer // Esto agrega el nuevo elemento Customer
                        };
                    });
                    return res_comandas; // Devuelve la respuesta para su uso posterior
                })
                .catch(e => {
                    console.log(e);
                    return []; // En caso de error, devuelve un array vacío para mantener la estructura
                });
        });
        
        // Espera a que todas las promesas se resuelvan
        Promise.all(comandasPromises).then(comandasResults => {
            // Concatena todas las respuestas en 'localActiveComandas'
            localActiveComandas = comandasResults.flat(); // 'flat()' es útil si cada 'response' es un array
            // NO filtrar ReadyToServe aquí - las necesitamos para el banner con transparencia
            // El filtro se hace en fetchCategorias para las tarjetas
            console.log("Todas las comandas activas (incluyendo ReadyToServe): ", localActiveComandas);
            setActiveComandas(prevActiveComandas => {
                console.log("Comandas to setActiveComandas: ", localActiveComandas);
                return (localActiveComandas);
            });
            
        }).catch(e => {
            console.log("Error al recuperar comandas: ", e);
        });

    };

    useEffect(() => {
        fetchComandasFromOrders();
    }, [Orders]);

    const fetchCategorias = () => {
        // Removing all localArrayBebidas objects whos localActiveComanda[i].ComandaPrepStatus === Preparing
        let localComandasForCategorize = [...activeComandas].filter(c => c.ComandaPrepStatus !== "ReadyToServe");
        // Copy to arrayPostres all localArrayBebidas objects whos Platillo is in the Postres category
        const localArrayPostres = localComandasForCategorize.filter(c => c.Categoria === "Postres");
        // Copy to arrayBebidas all localArrayBebidas objects whos Platillo is in the Bebidas category
        const localArrayBebidas = localComandasForCategorize.filter(c => c.Categoria === "Bebidas");
        // Copy to arrayBotanas all localArrayBebidas objects whos Platillo is in the Botanas category
        const localArrayBotanas = localComandasForCategorize.filter(c => c.Categoria === "Botanas");
        // Copy to arrayComidas all localArrayBebidas objects whos Platillo is in the Comidas category
        const localArrayComidas = localComandasForCategorize.filter(c => c.Categoria === "Comida");
        // Copy to arrayWaffles all localArrayBebidas objects whos Platillo is in the Waffles category
        const localArrayWaffles = localComandasForCategorize.filter(c => c.Categoria === "Waffles");

        setArrayPostres(localArrayPostres);
        setArrayBebidas(localArrayBebidas);
        setArrayBotanas(localArrayBotanas);
        setArrayComidas(localArrayComidas);
        setArrayWaffles(localArrayWaffles);
        console.log("## Orders: ", Orders);
        console.log("## Comandas: ", localComandasForCategorize);
        console.log("# Postres: ", localArrayPostres);
        console.log("# Bebidas: ", localArrayBebidas);
        console.log("# Botanas: ", localArrayBotanas);
        console.log("# Comida: ", localArrayComidas);
        console.log("# Waffles: ", localArrayWaffles);
    }

    useEffect(() => { 
        fetchCategorias();
    }, [activeComandas]);

    const renderSixFirstPostres = () => {
        let localArrayPostres = arrayPostres;
        let localNumPostres = localArrayPostres.length;
        let localSixFirstPostres = [];
        for (let i = 0; i < 6; i++) {
            if (i < localNumPostres) {
                const comanda = localArrayPostres[i];
                localSixFirstPostres.push(
                    <div 
                        key={comanda.ComandaId} 
                        className="col-3"
                        onContextMenu={(e) => handleContextMenu(e, comanda)}
                    >
                        <ResumeComanda Comanda={comanda} compact />
                    </div>
                );
            }
        }
        return localSixFirstPostres;
    };

    
    const renderSixFirstBebidas = () => {
        let localArrayBebidas = arrayBebidas;
        let localNumBebidas = localArrayBebidas.length;
        let localSixFirstBebidas = [];
        for (let i = 0; i < 6; i++) {
            if (i < localNumBebidas) {
                localSixFirstBebidas.push(
                    <div key={localArrayBebidas[i].ComandaId} className="col-2">
                        <ResumeComanda Comanda={localArrayBebidas[i]} />
                    </div>
                );
            }
        }
        return localSixFirstBebidas;
    };

    const renderSixFirstBotanas = () => {
        let localArrayBotanas = arrayBotanas;
        let localNumBotanas = localArrayBotanas.length;
        let localSixFirstBotanas = [];
        for (let i = 0; i < 6; i++) {
            if (i < localNumBotanas) {
                const comanda = localArrayBotanas[i];
                localSixFirstBotanas.push(
                    <div 
                        key={comanda.ComandaId} 
                        className="col-3"
                        onContextMenu={(e) => handleContextMenu(e, comanda)}
                    >
                        <ResumeComanda Comanda={comanda} compact />
                    </div>
                );
            }
        }
        return localSixFirstBotanas;
    };

    const renderAllComidas = () => {
        return arrayComidas.map((comanda) => (
            <div 
                key={comanda.ComandaId} 
                className="col-3"
                onContextMenu={(e) => handleContextMenu(e, comanda)}
            >
                <ResumeComanda Comanda={comanda} compact />
                    </div>
        ));
    };

    // Renderizar waffles en la columna lateral (similar a bebidas)
    const renderWafflesColumn = () => {
        if (arrayWaffles.length === 0) {
            return null;
        }

        return arrayWaffles.map((comanda) => (
            <div 
                key={comanda.ComandaId} 
                className="bebida-item"
                onContextMenu={(e) => handleContextMenu(e, comanda)}
                style={{ cursor: 'context-menu' }}
            >
                <div className="bebida-icons-stack">
                    <div className="bebida-deliver-icon">
                        <img 
                            src={comanda.ComandaDeliverMode === "Delivery" ? "Ideogram/llevare.png" : "Ideogram/aquie.png"}
                            alt={comanda.ComandaDeliverMode === "Delivery" ? "Para llevar" : "Comer aquí"}
                            title={comanda.ComandaDeliverMode === "Delivery" ? "Para llevar" : "Comer aquí"}
                        />
                    </div>
                    <div className="bebida-thumb">
                        {comanda.Imagen ? (
                            <img
                                src={comanda.Imagen}
                                alt={comanda.Platillo}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
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
                    <div className={`bebida-status bebida-status-preparing`}>Preparando</div>
                </div>

                <div className="bebida-right">
                    <div className="bebida-price">${Number(comanda.Precio || 0).toFixed(0)}</div>
                </div>
            </div>
        ));
    }

    // Calcular cuáles comandas están visibles en pantalla (activas)
    const visibleComandaIds = useMemo(() => {
        const ids = new Set();
        // Primeras 6 bebidas
        arrayBebidas.slice(0, 6).forEach(c => ids.add(c.ComandaId));
        // Primeras 6 botanas
        arrayBotanas.slice(0, 6).forEach(c => ids.add(c.ComandaId));
        // Todas las comidas
        arrayComidas.forEach(c => ids.add(c.ComandaId));
        // Primeras 6 waffles
        arrayWaffles.slice(0, 6).forEach(c => ids.add(c.ComandaId));
        return ids;
    }, [arrayBebidas, arrayBotanas, arrayComidas, arrayWaffles]);

    // Agrupar comandas por OrderID para el banner
    const ordersWithComandas = useMemo(() => {
        // Agrupar todas las comandas por orden
        const orderMap = new Map();
        
        activeComandas.forEach(comanda => {
            const orderId = comanda.OrderID;
            if (!orderMap.has(orderId)) {
                orderMap.set(orderId, {
                    orderId,
                    customer: comanda.Customer,
                    comandas: [],
                    total: 0
                });
            }
            const order = orderMap.get(orderId);
            // isVisible = está en tarjetas (no es ReadyToServe)
            // Las ReadyToServe tendrán isVisible: false y se mostrarán con transparencia
            const isInTarjetas = visibleComandaIds.has(comanda.ComandaId);
            const isReadyToServe = comanda.ComandaPrepStatus === "ReadyToServe";
            order.comandas.push({
                ...comanda,
                isVisible: isInTarjetas && !isReadyToServe // Solo visible si está en tarjetas Y no está entregado
            });
            // Sumar el precio de cada comanda al total
            order.total += comanda.Precio || 0;
        });

        // Mostrar órdenes que tengan al menos una comanda NO entregada (pendiente)
        return Array.from(orderMap.values()).filter(order => 
            order.comandas.some(c => c.ComandaPrepStatus !== "ReadyToServe")
        );
    }, [activeComandas, visibleComandaIds]);

    // Renderizar el banner de órdenes
    const renderOrdersBanner = () => {
        if (ordersWithComandas.length === 0) return null;

        return (
            <div className="orders-banner">
                {ordersWithComandas.map(order => (
                    <div 
                        key={order.orderId} 
                        className="order-group"
                        data-order={`#${order.orderId}`}
                        onContextMenu={(e) => handleOrderContextMenu(e, order)}
                        tabIndex={0}
                    >
                        {order.comandas.map(comanda => (
                            <div 
                                key={comanda.ComandaId}
                                className={`platillo-bubble-container ${comanda.isVisible ? 'active' : 'inactive'}`}
                            >
                                <div 
                                    className={`platillo-bubble ${comanda.isVisible ? 'active' : 'inactive'}`}
                                    title={comanda.Platillo}
                                >
                                    <img 
                                        src={comanda.Imagen} 
                                        alt={comanda.Platillo}
                                        onError={(e) => { e.target.src = 'placeholder.png'; }}
                                    />
                                </div>
                                <span className="platillo-price">${comanda.Precio || 0}</span>
                            </div>
                        ))}
                        <span className="order-total-label">
                            ${order.total.toFixed(0)}
                        </span>
                    </div>
                ))}
                    </div>
                );
    }

    
    // Función helper para reproducir audio solo si está habilitado
    const playAudioIfEnabled = (audioPath) => {
        if (audioEnabled && !modeInterface) {
            const audio = new Audio(audioPath);
            audio.play().catch(err => {
                console.error("Error al reproducir audio:", err);
            });
        }
    };

    useEffect(() => { // NewComanda
        socket.on('NuevaComandaDesdeServidor', (data) => {
            if (!modeInterface) {
                const audioMsg = `${data.msg.split('-')[0]}-${data.msg.split('-')[2]}`;
                console.log("MSG_Audio: ", audioMsg);
                if (audioMsg === "Add-Hamburguesa") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Hamburguesa.wav");
                }
                else if (audioMsg === "Add-Vaso de Postre") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-VasoDePostre.wav");
                }
                else if (audioMsg === "Add-Pay de Limón") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Pay-de-Limon.wav");
                }
                else if (audioMsg === "Add-Cheese Cake") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Cheese-Cake.wav");
                }
                else if (audioMsg === "Add-Maruchan Loca") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Maruchan-Loca.wav");
                }
                else if (audioMsg === "Add-Vaso de Esquites") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Esquites.wav");
                }
                else if (audioMsg === "Add-Doriesquites") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Doriesquites.wav");
                }
                else if (audioMsg === "Add-Maruchan con Suadero") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Maruchan-Suadero.wav");
                }
                else if (audioMsg === "Add-Alitas a la BBQ") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Alitas.wav");
                }
                else if (audioMsg === "Add-Rebanada de Pizza") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Rebanada-Pizza.wav");
                }
                else if (audioMsg === "Add-Papas a la Francesa") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Papas.wav");
                }
                else if (audioMsg === "Add-Hot Dog") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Hotdog.wav");
                }
                else if (audioMsg === "Add-Salchipulpos") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Salchipulpos.wav");
                }
                else if (audioMsg === "Add-Sincronizadas") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Sincronizadas.wav");
                }
                else if (audioMsg === "Add-Donitas") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Donitas.wav");
                }
                else if (audioMsg === "Add-Bubble Waffle") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Waffle.wav");
                }
                else if (audioMsg === "Add-Café") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Cafe.wav");
                }
                else if (audioMsg === "Add-Frappé") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Frappe.wav");
                }
                else if (audioMsg === "Add-Malteada") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Malteada.wav");
                }
                else if (audioMsg === "Add-Esquimo") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Esquimo.wav");
                }
                else if (audioMsg === "Add-Bubble Soda") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Bubble-Soda.wav");
                }
                else if (audioMsg === "Add-Agua Fresca") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Agua-Fresca.wav");
                }
                else if (audioMsg === "Add-Refresco") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Refresco.wav");
                }
                else if (audioMsg === "Add-Ensalada") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Ensalada.wav");
                }
                else if (audioMsg === "Add-Platanos Fritos") {
                    playAudioIfEnabled("ComandaAudios/Solicitan--PlatanosFritos.wav");
                }
                else if (audioMsg === "Add-Nuggets con Papas") {
                    playAudioIfEnabled("ComandaAudios/Solicitan--Nuggets.wav");
                }
                else if (audioMsg === "Add-Pastel") {
                    playAudioIfEnabled("ComandaAudios/Solicitan-Pastel.wav");
                }
                else if (audioMsg === "Add-Combo 1 Donitas") {
                    playAudioIfEnabled("ComandaAudios/Combo1.wav");
                }
                else if (audioMsg === "Add-Combo 2 Burguer") {
                    playAudioIfEnabled("ComandaAudios/Combo2.wav");
                }
                else if (audioMsg === "Add-Combo 3 Alitas") {
                    playAudioIfEnabled("ComandaAudios/Combo3.wav");
                }
                else if (audioMsg === "Add-Nachos") {
                    playAudioIfEnabled("ComandaAudios/nachos.wav");
                }
                else if (audioMsg === "Add-Banana Split") {
                    playAudioIfEnabled("ComandaAudios/bananasplit.wav");
                }
                else if (audioMsg === "Add-Avena") {
                    playAudioIfEnabled("ComandaAudios/avena.wav");
                }
                else if (audioMsg === "Add-Sangria") {
                    playAudioIfEnabled("ComandaAudios/sangria.wav");
                }
                else if (audioMsg === "Add-Esquites con Suadero") {
                    playAudioIfEnabled("ComandaAudios/esquitessuadero.wav");
                }
                else if (audioMsg === "Add-Tortas") {
                    playAudioIfEnabled("ComandaAudios/tortas.wav");
                } // ----------------------
                else if (audioMsg === "Add-PROMO hamburguesa sencilla") {
                    playAudioIfEnabled("ComandaAudios/PROMO1.wav");
                }
                else if (audioMsg === "Add-PROMO hamburguesas suizas") {
                    playAudioIfEnabled("ComandaAudios/PROMO2.wav");
                }
                else if (audioMsg === "Add-PROMO Salchipulpos") {
                    playAudioIfEnabled("ComandaAudios/PROMO3.wav");
                }
                else if (audioMsg === "Add-PROMO Frappes") {
                    playAudioIfEnabled("ComandaAudios/PROMO4.wav");
                }
                else if (audioMsg === "Add-PROMO Salchi Nuggets") {
                    playAudioIfEnabled("ComandaAudios/PROMO5.wav");
                }
                else if (audioMsg === "Add-PROMO Dos Nuggets") {
                    playAudioIfEnabled("ComandaAudios/PROMO6.wav");
                }
            }
            // ✅ CORREGIDO: Actualizar comandas inmediatamente cuando llega una nueva
            fetchComandasFromOrders();
        });
        return () => {
            socket.off('NuevaComandaDesdeServidor');
        };
    }, [Orders]);

    // ✅ AGREGADO: Listener para cuando se actualiza una comanda desde otro cliente
    useEffect(() => {
        socket.on('UpdateComandaDesdeServidor', (data) => {
            console.log("UpdateComandaDesdeServidor: ", data.msg);
            fetchComandasFromOrders();
        });
        return () => {
            socket.off('UpdateComandaDesdeServidor');
        };
    }, [Orders]);

    // ✅ AGREGADO: Listener para cuando se elimina una comanda desde otro cliente
    useEffect(() => {
        socket.on('DeleteComandaDesdeServidor', (data) => {
            console.log("DeleteComandaDesdeServidor: ", data.msg);
            fetchComandasFromOrders();
        });
        return () => {
            socket.off('DeleteComandaDesdeServidor');
        };
    }, [Orders]);

    const getBebidaDescriptor = (comanda) => {
        const sel = comanda?.Details?.SelectedVariant;
        const variant = sel !== undefined ? comanda?.Details?.Variants?.[sel] : undefined;
        const variantName = variant?.VariantName ? String(variant.VariantName) : '';

        const opciones = Array.isArray(variant?.Opciones) ? variant.Opciones : [];
        const selectedOptions = opciones
            .map(op => {
                const selected = op?.Items?.[op?.SelectedItem];
                const name = selected?.Name ? String(selected.Name) : '';
                return name && name !== 'No aplica' ? name : '';
            })
            .filter(Boolean);

        const parts = [variantName, ...selectedOptions].filter(Boolean);
        return parts.join('\n');
    };

    const getBebidaAggregateStatus = (items) => {
        // Priorizamos estados “más urgentes”
        if (items.some(c => c?.ComandaPaidStatus === 'Editing')) return { key: 'editing', label: 'Editando' };
        if (items.some(c => c?.ComandaPrepStatus === 'Preparing')) return { key: 'preparing', label: 'Preparando' };
        return { key: 'pending', label: 'Pendiente' };
    };

    const bebidasByOrder = useMemo(() => {
        const orderMap = new Map();

        arrayBebidas.forEach(comanda => {
            const orderId = comanda?.OrderID;
            if (orderId === undefined || orderId === null) return;

            if (!orderMap.has(orderId)) {
                orderMap.set(orderId, {
                    orderId,
                    customer: comanda?.Customer,
                    itemsRaw: [],
                    total: 0
                });
            }

            const order = orderMap.get(orderId);
            order.itemsRaw.push(comanda);
            order.total += comanda?.Precio || 0;
        });

        const orders = Array.from(orderMap.values()).map(order => {
            const agg = new Map();

            order.itemsRaw.forEach(c => {
                const descriptor = getBebidaDescriptor(c);
                const key = `${c?.Platillo || ''}__${descriptor}`;

                if (!agg.has(key)) {
                    agg.set(key, {
                        key,
                        platillo: c?.Platillo || 'Bebida',
                        descriptor,
                        imagen: c?.Imagen,
                        unitPrice: c?.Precio || 0,
                        count: 0,
                        comandas: [],
                        deliverMode: c?.ComandaDeliverMode // "Delivery" = para llevar
                    });
                }
                const item = agg.get(key);
                item.count += 1;
                item.comandas.push(c);
            });

            const items = Array.from(agg.values()).sort((a, b) => {
                // Primero los que estén “Preparando” y luego por nombre
                const aStatus = getBebidaAggregateStatus(a.comandas).key;
                const bStatus = getBebidaAggregateStatus(b.comandas).key;
                const prio = { editing: 0, preparing: 1, pending: 2 };
                if (prio[aStatus] !== prio[bStatus]) return prio[aStatus] - prio[bStatus];
                return String(a.platillo).localeCompare(String(b.platillo));
            });

            return {
                ...order,
                items,
                count: order.itemsRaw.length
            };
        });

        return orders.sort((a, b) => Number(a.orderId) - Number(b.orderId));
    }, [arrayBebidas]);

    // Renderizar bebidas en columna (agrupadas por pedido)
    const renderBebidasColumn = () => {
        if (bebidasByOrder.length === 0) {
            return <div className="bebidas-empty">Sin bebidas pendientes</div>;
        }

        return bebidasByOrder.map(order => (
            <div key={order.orderId} className="bebidas-order-card">
                <div className="bebidas-order-header">
                    <div className="bebidas-order-title">
                        <div className="bebidas-order-number">{`#${order.orderId}`}</div>
                        <div className="bebidas-order-subtitle">
                            {order.customer ? String(order.customer) : '—'}
                        </div>
                    </div>
                    <div className="bebidas-order-metrics">
                        <span className="bebidas-pill bebidas-pill-count">{order.count} bebidas</span>
                        <span className="bebidas-pill bebidas-pill-total">${Number(order.total).toFixed(0)}</span>
                    </div>
                </div>

                <div className="bebidas-items">
                    {order.items.map(item => {
                        const status = getBebidaAggregateStatus(item.comandas);
                        return (
                            <div 
                                key={item.key} 
                                className="bebida-item"
                                onContextMenu={(e) => {
                                    // Usar la primera comanda del grupo para el menú contextual
                                    if (item.comandas && item.comandas.length > 0) {
                                        handleContextMenu(e, item.comandas[0]);
                                    }
                                }}
                                style={{ cursor: 'context-menu' }}
                            >
                                <div className="bebida-icons-stack">
                                    <div className="bebida-deliver-icon">
                                        <img 
                                            src={item.deliverMode === "Delivery" ? "Ideogram/llevare.png" : "Ideogram/aquie.png"}
                                            alt={item.deliverMode === "Delivery" ? "Para llevar" : "Comer aquí"}
                                            title={item.deliverMode === "Delivery" ? "Para llevar" : "Comer aquí"}
                                        />
                                    </div>
                                    <div className="bebida-thumb">
                                        {item.imagen ? (
                                            <img
                                                src={item.imagen}
                                                alt={item.platillo}
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="bebida-thumb-fallback" />
                                        )}
                                    </div>
                                </div>

                                <div className="bebida-meta">
                                    <div className="bebida-name-row">
                                        <div className="bebida-name">{item.platillo}</div>
                                        {item.count > 1 && <div className="bebida-qty">{`x${item.count}`}</div>}
                                    </div>
                                    {item.descriptor && <div className="bebida-descriptor">{item.descriptor}</div>}
                                    <div className={`bebida-status bebida-status-${status.key}`}>{status.label}</div>
            </div>
        
                                <div className="bebida-right">
                                    <div className="bebida-price">${Number(item.unitPrice).toFixed(0)}</div>
                                    {item.count > 1 && (
                                        <div className="bebida-subtotal">
                                            ${Number(item.unitPrice * item.count).toFixed(0)}
                    </div>
                                    )}
                        </div>
                    </div>
                        );
                    })}
                </div>
            </div>
        ));
    };

    // DEBUG: Log para verificar el layout combinado
    const numEsquites = arrayBotanas.length;
    const numComidas = arrayComidas.length;
    const esquitesEnFila1 = Math.min(numEsquites, 4);
    const espacioParaComida = 4 - esquitesEnFila1;
    const comidasEnFila1 = Math.min(numComidas, espacioParaComida);
    const comidasRestantes = numComidas - comidasEnFila1;
    
    console.log('=== DEBUG LAYOUT COMBINADO ===');
    console.log(`Esquites total: ${numEsquites}`);
    console.log(`Comidas total: ${numComidas}`);
    console.log(`Esquites en fila 1: ${esquitesEnFila1} (col-${esquitesEnFila1 * 3})`);
    console.log(`Espacio para comida: ${espacioParaComida}`);
    console.log(`Comidas en fila 1: ${comidasEnFila1} (col-${espacioParaComida * 3})`);
    console.log(`Comidas restantes (fila 2+): ${comidasRestantes}`);
    console.log(`Condición esquites visible: ${numEsquites > 0}`);
    console.log(`Condición comidas fila 1 visible: ${numComidas > 0 && espacioParaComida > 0}`);
    console.log(`Condición comidas fila 2+ visible: ${comidasRestantes > 0}`);
    console.log('==============================');

    // Verificar si hay comandas pendientes
    const hasAnyComandas = arrayBebidas.length > 0 || arrayWaffles.length > 0 || arrayBotanas.length > 0 || arrayComidas.length > 0 || arrayPostres.length > 0;

    return (
        <div className="contenedor-elementos">
            {/* Banner de órdenes con burbujas */}
            {renderOrdersBanner()}
            
            {/* Mensaje cuando no hay comandas pendientes */}
            {!hasAnyComandas && (
                <div className="fila-elemento">
                    <div style={{ textAlign: 'center', padding: '50px', fontSize: '24px', color: '#666' }}>
                        No hay comandas pendientes
                    </div>
                </div>
            )}
            
            {/* Layout principal: Bebidas a la izquierda (si hay), resto a la derecha */}
            {hasAnyComandas && (
            <div className="main-layout">
                {/* Columna fija de bebidas y waffles - solo si hay alguno */}
                {(arrayBebidas.length > 0 || arrayWaffles.length > 0) && (
                    <div className="bebidas-column">
                        {/* Sección de Bebidas */}
                        {arrayBebidas.length > 0 && (
                            <>
                                <div className="bebidas-header">
                                    <span>BEBIDAS</span>
                                    <span className="bebidas-header-count">{arrayBebidas.length}</span>
                                </div>
                                <div className="bebidas-list">
                                    {renderBebidasColumn()}
                                </div>
                            </>
                        )}
                        
                        {/* Sección de Waffles */}
                        {arrayWaffles.length > 0 && (
                            <>
                                <div className="bebidas-header waffles-header">
                                    <span>WAFFLES</span>
                                    <span className="bebidas-header-count">{arrayWaffles.length}</span>
                                </div>
                                <div className="bebidas-list waffles-list">
                                    {renderWafflesColumn()}
                                </div>
                            </>
                        )}
                    </div>
                )}
                
                {/* Contenido principal a la derecha */}
                <div className="content-right">
                    {/* Primera fila: Esquites + Comidas (máximo 4 en total) */}
                    <div className="fila-elemento fila-combinada">
                        <div className="row">
                            {/* Sección Esquites (toma solo lo que necesita) */}
                            {arrayBotanas.length > 0 && (
                                <div className={`col-${Math.min(arrayBotanas.length, 4) * 3}`}>
                                    <div className="category-banner category-banner-inline">ESQUITES</div>
                                    <div className="row">
                                        {arrayBotanas.slice(0, 4).map((comanda) => (
                                            <div 
                                                key={comanda.ComandaId} 
                                                className={`col-${12 / Math.min(arrayBotanas.length, 4)}`}
                                                onContextMenu={(e) => handleContextMenu(e, comanda)}
                                            >
                                                <ResumeComanda Comanda={comanda} compact />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Sección Comida (llena el espacio restante de la primera fila) */}
                            {arrayComidas.length > 0 && (4 - Math.min(arrayBotanas.length, 4)) > 0 && (
                                <div className={`col-${(4 - Math.min(arrayBotanas.length, 4)) * 3}`}>
                                    <div className="category-banner category-banner-inline">COMIDA</div>
                                    <div className="row">
                                        {arrayComidas.slice(0, 4 - Math.min(arrayBotanas.length, 4)).map((comanda) => (
                                            <div 
                                                key={comanda.ComandaId} 
                                                className={`col-${12 / (4 - Math.min(arrayBotanas.length, 4))}`}
                                                onContextMenu={(e) => handleContextMenu(e, comanda)}
                                            >
                                                <ResumeComanda Comanda={comanda} compact />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Filas adicionales de Comida (el resto) */}
                    {arrayComidas.length > (4 - Math.min(arrayBotanas.length, 4)) && (
                        <div className="fila-elemento">
                            <div className="category-banner">COMIDA</div>
                            <div className="row">
                                {arrayComidas.slice(4 - Math.min(arrayBotanas.length, 4)).map((comanda) => (
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

            {/* Menú contextual para eliminar ORDEN COMPLETA */}
            {orderContextMenu.visible && (
                <div 
                    className="context-menu-overlay"
                    onClick={closeOrderContextMenu}
                >
                    <div 
                        className="context-menu order-context-menu"
                        style={{ left: orderContextMenu.x, top: orderContextMenu.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="context-menu-header context-menu-header-order">
                            <span className="context-menu-title">
                                Orden #{orderContextMenu.order?.orderId}
                            </span>
                            <span className="context-menu-subtitle">
                                {orderContextMenu.order?.customer || 'Sin nombre'} • {orderContextMenu.order?.comandas?.length || 0} platillos
                            </span>
                            <span className="context-menu-total">
                                Total: ${orderContextMenu.order?.total?.toFixed(0) || 0}
                            </span>
                        </div>
                        
                        {/* Lista de comandas para eliminar individualmente */}
                        {orderContextMenu.order?.comandas && orderContextMenu.order.comandas.length > 0 && (
                            <div className="context-menu-comandas-list">
                                <div className="context-menu-section-title">Eliminar comanda:</div>
                                {orderContextMenu.order.comandas
                                    .filter(c => c.ComandaPrepStatus !== "ReadyToServe") // Solo mostrar las que no están entregadas
                                    .map((comanda) => (
                                        <button 
                                            key={comanda.ComandaId}
                                            className="context-menu-btn context-menu-btn-delete-comanda"
                                            onClick={async () => {
                                                const comandaId = comanda._id || comanda.ComandaId;
                                                const platillo = comanda.Platillo;
                                                
                                                try {
                                                    await comandasApi.deleteComanda(comandaId);
                                                    socket.emit('DeleteComandaDesdeCliente', { msg: `Delete-${comanda.OrderID}-${platillo}` });
                                                    socket.emit('OrdenActualizadaDesdeCliente', { msg: comanda.OrderID });
                                                    setActiveComandas(prev => prev.filter(c => c.ComandaId !== comanda.ComandaId));
                                                    closeOrderContextMenu();
                                                } catch (error) {
                                                    console.error("Error al eliminar comanda:", error);
                                                    alert("Error al eliminar la comanda");
                                                }
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                            <span>{comanda.Platillo}</span>
                                            <span className="context-menu-comanda-price">${(comanda.Precio || 0).toFixed(0)}</span>
                                        </button>
                                    ))}
                            </div>
                        )}
                        
                        <div className="context-menu-divider"></div>
                        
                        <button 
                            className="context-menu-btn context-menu-btn-delete-order"
                            onClick={handleDeleteOrder}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Eliminar Orden Completa
                        </button>
                        <button 
                            className="context-menu-btn context-menu-btn-cancel"
                            onClick={closeOrderContextMenu}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
};

export default OrdenesCocina;