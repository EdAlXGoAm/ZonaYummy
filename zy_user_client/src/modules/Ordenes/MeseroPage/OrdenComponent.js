import './OrdenComponent.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleUp, faAngleDown, faHandHoldingUsd } from '@fortawesome/free-solid-svg-icons';
import { faTrash, faCashRegister } from '@fortawesome/free-solid-svg-icons';
import PlatilloSelector from './PlatilloSelectorComponent';
import ComandaCard from './ComandaCardComponent'
import comandasApi from './../../../api/comandasApi';
import ordersApi from './../../../api/ordersApi';
import io from 'socket.io-client';
import { faCheck, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

import { ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ========== LOGGING DE RENDIMIENTO CENTRALIZADO ==========
import performanceLogger from '../../../utils/performanceLogger';
// Para activar DEBUG temporal: cambiar ENABLE_DEV_MODE a true en ../../../utils/performanceLogger.js
// ========== FIN LOGGING ==========

const socket = io(`${process.env.REACT_APP_API_URL}`);

const Orden = ({modeInterface, iInterface, OrderID, DeleteOrder, handleOrderCustStatus, platillos, numPlatillos, handleOrderClient, preloadedOrder, preloadedComandas, isOptimized }) => {
    const notify = (message) => toast(message);
    const [Order, setOrder] = useState({});
    const [comandas, setComandas] = useState([])
    const [toggleArrowStatus, setToggleArrowStatus] = useState(true); // false: plegado, true: desplegado
    const [colorOrder, setColorOrder] = useState("#ffffff")
    const skipNextFetch = useRef(false);
    const [expandedComandas, setExpandedComandas] = useState([]);
    const [modalPagoVisible, setModalPagoVisible] = useState(false);
    const [montoEspecifico, setMontoEspecifico] = useState(0);
    const [itemsSeleccionadosPago, setItemsSeleccionadosPago] = useState(new Set());
    const [orderV2, setOrderV2] = useState({ pagos: [], pagado: 0, pendiente: 0 });
    // Método de pago para EL PRÓXIMO cobro (compat: si no viene, backend asume 'cash')
    const [metodoPago, setMetodoPago] = useState('cash'); // 'cash' | 'card' | 'transfer'
    // Edición de método de pago por cobro ya registrado (historial)
    const [paymentMethodEdits, setPaymentMethodEdits] = useState({}); // { [pagoId]: 'cash'|'card'|'transfer' }
    const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Bloquea botón de confirmar
    // Flags para controles de cobro
    const hasMontoPago = orderV2.pagos.some(p => p.tipoPago === 'monto');
    // Calcular pagado REAL desde array de pagos (más confiable que orderV2.pagado)
    const realPagado = (orderV2?.pagos || []).reduce((sum, p) => sum + (p?.monto || 0), 0);
    // Calcular pendiente: suma de precios de comandas menos lo ya cobrado REAL
    const computedPending = comandas.reduce((sum, c) => sum + (c.Precio || 0), 0) - realPagado;
    const isFullyPaid = computedPending <= 0 && computedPending === 0;
    const isExceeded = computedPending < 0; // Se cobró de más
    const excesoMonto = isExceeded ? Math.abs(computedPending) : 0;
    const isEmptyOrder = (comandas?.length || 0) === 0;

    const getMetodoPagoEmoji = (m) => {
      if (m === 'card') return '💳';
      if (m === 'transfer') return '📱';
      return '💵';
    };
    const toggleMetodoPago = () => {
      setMetodoPago(prev => prev === 'cash' ? 'card' : (prev === 'card' ? 'transfer' : 'cash'));
    };

    const toggleMetodoPagoValue = (prev) => (prev === 'cash' ? 'card' : (prev === 'card' ? 'transfer' : 'cash'));
    const hasPaymentEdits = Object.keys(paymentMethodEdits).length > 0;
    const handleTogglePaymentHistoryMethod = (pago) => {
      const pagoId = pago?._id;
      if (!pagoId) return;
      const current = (paymentMethodEdits[pagoId] || pago.metodoPago || 'cash');
      const next = toggleMetodoPagoValue(current);
      setPaymentMethodEdits(prev => ({ ...prev, [pagoId]: next }));
    };
    const cancelPaymentHistoryEdits = () => {
      setPaymentMethodEdits({});
    };
    const savePaymentHistoryEdits = async () => {
      try {
        const edits = paymentMethodEdits;
        const entries = Object.entries(edits);
        if (entries.length === 0) return;

        await Promise.all(entries.map(([pagoId, m]) => ordersApi.updatePaymentMethod(OrderID, pagoId, m)));
        const fresh = await ordersApi.getOrderV2(OrderID);
        setOrderV2(fresh);
        setPaymentMethodEdits({});
        notify('Cambios guardados');
        setModalPagoVisible(false);
      } catch (err) {
        notify(`Error al guardar cambios: ${err}`);
      }
    };

    // ==== Resumen compacto para tarjeta (usa Order local; no depende del modal/orderV2) ====
    const cardTotal = Order?.CuentaTotal || 0;
    // Calcular pagado REAL desde el array de pagos (más confiable que el campo pagado)
    const cardPagadoFromPagos = (Order?.pagos || []).reduce((sum, p) => sum + (p?.monto || 0), 0);
    const cardPagado = cardPagadoFromPagos > 0 ? cardPagadoFromPagos : (Order?.pagado || 0);
    // Calcular pendiente real (puede ser negativo si se excedió)
    const cardPendienteReal = cardTotal - cardPagado;
    // Para mostrar, usamos el valor absoluto si es negativo (muestra el exceso)
    const cardPendiente = Math.max(0, cardPendienteReal);
    // Detectar exceso: pendiente negativo O pagado > total
    const cardIsExceeded = cardTotal > 0 && (cardPendienteReal < 0 || cardPagado > cardTotal);
    const cardExcesoMonto = cardIsExceeded ? Math.abs(cardPendienteReal) : 0;
    const cardIsPaid = !cardIsExceeded && cardTotal > 0 && cardPendiente <= 0;
    const cardPercentPaid = cardTotal > 0
      ? Math.min(100, Math.max(0, (cardPagado / cardTotal) * 100))
      : (cardIsPaid ? 100 : 0);

    const fetchOrder = () => {
        const fetchOrderStartTime = performance.now();
        const fetchOrderId = `fetchOrder_${OrderID}_${Date.now()}`;
        performanceLogger.time(fetchOrderId);
        
        // Verificar si tenemos datos pre-cargados (OPTIMIZACIÓN)
        if (isOptimized && preloadedOrder && preloadedComandas) {
            performanceLogger.critical(`⚡ USANDO DATOS PRE-CARGADOS para OrderID: ${OrderID} (${preloadedComandas.length} comandas)`);
            
            setOrder(preloadedOrder);
            setComandas(preloadedComandas);
            updateCuentaTotalOrder(preloadedComandas, preloadedOrder);
            
            performanceLogger.timeEnd(fetchOrderId);
            const optimizedTime = performance.now() - fetchOrderStartTime;
            performanceLogger.log(`🚀 fetchOrder OPTIMIZADO completado en ${optimizedTime.toFixed(2)}ms (sin API calls)`);
            return;
        }
        
        // Fallback al método original si no hay datos pre-cargados
        performanceLogger.log(`🏁 [${new Date().toISOString()}] ========== INICIANDO CICLO COMPLETO fetchOrder para OrderID: ${OrderID} ==========`);
        
        // Cronómetro para la API de orders
        const orderApiCallId = `orderApiCall_${fetchOrderId}`;
        performanceLogger.time(orderApiCallId);
        
        ordersApi.getOrder(OrderID)
        .then((res) => {
            performanceLogger.timeEnd(orderApiCallId);
            const orderApiTime = performance.now() - fetchOrderStartTime;
            performanceLogger.log(`📋 Order API Call completada en ${orderApiTime.toFixed(2)}ms`);
            
            setOrder(res);
            
            // El fetchComandas ya tiene su propio monitoreo
            fetchComandas(res);
            
            // Solo medimos el tiempo hasta que se dispara fetchComandas
            performanceLogger.timeEnd(fetchOrderId);
            const totalFetchOrderTime = performance.now() - fetchOrderStartTime;
            performanceLogger.log(`🎯 fetchOrder (sin esperar comandas) completado en ${totalFetchOrderTime.toFixed(2)}ms`);
            performanceLogger.log(`🏁 ========== CONTINUANDO CON fetchComandas... ==========`);
        })
        .catch((err) => {
            performanceLogger.timeEnd(orderApiCallId);
            performanceLogger.timeEnd(fetchOrderId);
            const errorTime = performance.now() - fetchOrderStartTime;
            performanceLogger.error(`❌ Error en fetchOrder después de ${errorTime.toFixed(2)}ms:`, err);
        });
    };

    useEffect(() => {
        if (!modeInterface) {
            // Define la función que quieres ejecutar
            const hacerAlgo = () => {
                fetchOrder();
            };
        
            // Crea un intervalo que ejecuta hacerAlgo cada 5 segundos (5000 milisegundos)
            const intervalo = setInterval(hacerAlgo, 5000);
        
            // Limpia el intervalo cuando el componente se desmonta
            // para evitar efectos secundarios no deseados
            return () => clearInterval(intervalo);
        }
      }, []); // El array vacío asegura que el efecto se ejecute solo una vez al montar el componente

    const fetchColorOrder = () => {
        if (!Order) return; // Verificación de seguridad
        if (Order.OrderCustStatus === "Done") {
            setColorOrder("#5d5d5d");
        } else if (Order.OrderCustStatus === "InPlace") {
            setColorOrder("#ffffff");
        }
    }
    
    const updateCuentaTotalOrder = (comandasDB, order) => {
        const updateStartTime = performance.now();
        const updateId = `updateCuentaTotal_Order_${OrderID}_${Date.now()}`;
        performanceLogger.time(updateId);
        performanceLogger.log(`🔄 [${new Date().toISOString()}] Iniciando updateCuentaTotalOrder para OrderID: ${OrderID}`);
        
        // Medición del cálculo local
        const calcStartTime = performance.now();
        let cuentaTotal = 0;
        if (comandasDB) {
            comandasDB.forEach((comanda) => {
                cuentaTotal = cuentaTotal + comanda.Precio;
            })
        }
        // Calcular el nuevo pendiente basado en la nueva cuenta total y lo ya pagado
        const newPendiente = cuentaTotal - (order.pagado || 0);
        const newOrder = {...order, CuentaTotal: cuentaTotal, pendiente: newPendiente}; // Actualizar también pendiente
        
        const calcTime = performance.now() - calcStartTime;
        performanceLogger.log(`🧮 Cálculo de totales: ${calcTime.toFixed(2)}ms - Comandas procesadas: ${comandasDB ? comandasDB.length : 0}, Total: $${cuentaTotal}`);
        
        // Medición de la actualización en BD
        const dbUpdateStartTime = performance.now();
        const dbUpdateId = `dbUpdate_${updateId}`;
        performanceLogger.time(dbUpdateId);
        
        ordersApi.updateOrder(newOrder)
        .then(() => {
            performanceLogger.timeEnd(dbUpdateId);
            performanceLogger.timeEnd(updateId);
            
            const dbUpdateTime = performance.now() - dbUpdateStartTime;
            const totalUpdateTime = performance.now() - updateStartTime;
            
            performanceLogger.log(`💾 Actualización BD: ${dbUpdateTime.toFixed(2)}ms`);
            performanceLogger.log(`✅ updateCuentaTotalOrder COMPLETADO - Tiempo total: ${totalUpdateTime.toFixed(2)}ms`);
            performanceLogger.log(`📊 Desglose Update - Cálculo: ${calcTime.toFixed(2)}ms (${(calcTime/totalUpdateTime*100).toFixed(1)}%) | BD: ${dbUpdateTime.toFixed(2)}ms (${(dbUpdateTime/totalUpdateTime*100).toFixed(1)}%)`);
            
            setOrder(newOrder); // Actualizar estado local con ambos valores
        })
        .catch(err => {
            performanceLogger.timeEnd(dbUpdateId);
            performanceLogger.timeEnd(updateId);
            
            const errorTime = performance.now() - updateStartTime;
            performanceLogger.error(`❌ Error en updateCuentaTotalOrder después de ${errorTime.toFixed(2)}ms:`, err);
            notify(`Error al actualizar CuentaTotal/Pendiente de orden: ${err}`); // Mensaje actualizado
            // alert("Error al actualizar una comanda");
        });
    }

    const fetchComandas = (order) => {
        // Inicia el cronómetro para el proceso completo
        const startTime = performance.now();
        const fetchId = `fetchComandas_Order_${OrderID}_${Date.now()}`;
        performanceLogger.time(fetchId);
        performanceLogger.log(`🚀 [${new Date().toISOString()}] Iniciando fetchComandas para OrderID: ${OrderID}`);
        
        // Cronómetro específico para la llamada a la API
        const apiCallId = `apiCall_${fetchId}`;
        performanceLogger.time(apiCallId);
        
        comandasApi.getComandasByOrderId(OrderID)
        .then((res) => {
            // Finaliza el cronómetro de la llamada a la API
            performanceLogger.timeEnd(apiCallId);
            const apiCallTime = performance.now() - startTime;
            performanceLogger.log(`📡 API Call completada en ${apiCallTime.toFixed(2)}ms - Comandas recibidas: ${res.length}`);
            
            // Inicia cronómetro para el procesamiento local
            const processingStart = performance.now();
            const processingId = `processing_${fetchId}`;
            performanceLogger.time(processingId);
            
            setComandas(res);
            updateCuentaTotalOrder(res, order);
            
            // Finaliza cronómetros
            performanceLogger.timeEnd(processingId);
            performanceLogger.timeEnd(fetchId);
            
            const processingTime = performance.now() - processingStart;
            const totalTime = performance.now() - startTime;
            
            performanceLogger.log(`⚡ Procesamiento local: ${processingTime.toFixed(2)}ms`);
            performanceLogger.log(`✅ fetchComandas COMPLETADO - Tiempo total: ${totalTime.toFixed(2)}ms`);
            performanceLogger.log(`📊 Desglose - API: ${apiCallTime.toFixed(2)}ms (${(apiCallTime/totalTime*100).toFixed(1)}%) | Procesamiento: ${processingTime.toFixed(2)}ms (${(processingTime/totalTime*100).toFixed(1)}%)`);
        })
        .catch((err) => {
            performanceLogger.timeEnd(apiCallId);
            performanceLogger.timeEnd(fetchId);
            const errorTime = performance.now() - startTime;
            performanceLogger.error(`❌ Error en fetchComandas después de ${errorTime.toFixed(2)}ms:`, err);
        });
    };

    useEffect(() => {
        fetchOrder();
    },[]);

    useEffect(() => { // Socket DelOrder
        socket.on('OrdenActualizadaDesdeServidor', (data) => {
            if (data.msg.toString() === OrderID.toString()) {
                console.log("OrdenActualizadaDesdeServidor Mensaje: ", data)
                fetchOrder();
            }
        });

        return () => {
            socket.off('OrdenActualizadaDesdeServidor');
        };
    }, []);

    useEffect(() => {
        if (!Order || !Order.OrderID) return; // Verificación de seguridad
        fetchColorOrder();
        fetchToggleArrowStatus();
    }, [Order])

    const fetchToggleArrowStatus = () => {
        if (!Order) return; // Verificación de seguridad
        if (modeInterface) {
            if (Order.OrderCustStatus === "Done") {
                setToggleArrowStatus(false);
            }
            else {
                setToggleArrowStatus(true);
            }
        }
        else {
            setToggleArrowStatus(true);
        }
    };

    const handleComandas = (Action) => {
        console.log(`Action: ${Action}`);
        // Evaluar si Action split('-')[0] es igual a Add
        if (Action.split('-')[0] === "Add") {
            socket.emit('NuevaComandaDesdeCliente', {msg: Action});
        }
        else if (Action.split('-')[0] === "Update") {
            console.log("Se Editó");
            socket.emit('UpdateComandaDesdeCliente', {msg: Action});
        }
        else if (Action.split('-')[0] === "Del") {
            console.log("Se Eliminó");
            socket.emit('DeleteComandaDesdeCliente', {msg: Action});
        }
    };

    useEffect(() => { // AddComanda
        socket.on('NuevaComandaDesdeServidor', (data) => {
            if (data.msg.split('-')[1] === OrderID.toString()) {
                if (skipNextFetch.current) { skipNextFetch.current = false; return; }
                fetchOrder();
            }
        });
        return () => {
            socket.off('NuevaComandaDesdeServidor');
        };
    }, []);
    useEffect(() => { // UpdateComanda
        socket.on('UpdateComandaDesdeServidor', (data) => {
            console.log("Mensaje: ", data.msg)
            if (data.msg.split('-')[1] === OrderID.toString()) {
                if (skipNextFetch.current) { skipNextFetch.current = false; return; }
                fetchOrder();
            }
        });
        return () => {
            socket.off('UpdateComandaDesdeServidor');
        };
    }, []);
    useEffect(() => { // DeleteComanda
        socket.on('DeleteComandaDesdeServidor', (data) => {
            console.log("Mensaje: ", data.msg)
            if (data.msg.split('-')[1] === OrderID.toString()) {
                if (skipNextFetch.current) { skipNextFetch.current = false; return; }
                fetchOrder();
            }
        });
        return () => {
            socket.off('DeleteComandaDesdeServidor');
        };
    }, []);
    const addComanda = useCallback((platillo) => {
        const newComanda = {
            OrderID: Order.OrderID,
            ComandaId: comandas.length > 0 ? comandas[comandas.length - 1].ComandaId + 1 : 1,
            Platillo: platillo.NombrePlatillo,
            Precio: platillo.Variants[0].Precio,
            Imagen: platillo.Imagen,
            Categoria: platillo.Categoria,
            ComandaPaidStatus: "Editing",
            ComandaPrepStatus: "Preparing",
            ComandaDeliverMode: "Delivery",
            ComandaSwitchNota: false,
            Notas: "",
            Details: platillo
        };
        setComandas(prev => [...prev, newComanda]);
        handleComandas("Add-" + Order.OrderID + "-" + newComanda.Platillo);
        comandasApi.addComanda(newComanda)
            .then(() => {
                skipNextFetch.current = true;
                fetchComandas(Order);
            })
            .catch(err => {
                console.log(err);
                notify(`Error al agregar comanda: ${err}`);
            });
    }, [Order, handleComandas, updateCuentaTotalOrder, comandas.length]);

    const updateComanda = useCallback((comanda) => {
        setComandas(prev => {
            const updated = prev.map(c => c.ComandaId === comanda.ComandaId ? comanda : c);
            updateCuentaTotalOrder(updated, Order);
            skipNextFetch.current = true;
            return updated;
        });
        handleComandas("Update-" + Order.OrderID);
        if (!comanda._id) {
            return;
        }
        comandasApi.updateComanda(comanda)
            .catch(err => {
                console.log(err);
                notify(`Error al actualizar comanda: ${err}`);
            });
    }, [Order, handleComandas, updateCuentaTotalOrder]);

    const removeComanda = useCallback((comanda) => {
        const confirmDel = window.confirm("Eliminar Platillo");
        if (!confirmDel) return;
        setComandas(prev => {
            const updated = prev.filter(c => c._id !== comanda._id);
            updateCuentaTotalOrder(updated, Order);
            skipNextFetch.current = true;
            return updated;
        });
        handleComandas("Del-" + Order.OrderID);
        comandasApi.deleteComanda(comanda._id)
            .catch(err => {
                console.log(err);
                notify(`Error al eliminar comanda: ${err}`);
            });
    }, [Order, handleComandas, updateCuentaTotalOrder]);

    const handleOrderCustStatusButton = () => {
        if (Order.OrderCustStatus === "InPlace") {
            const confirm = window.confirm("La ORDEN ha sido COMPLETADA?");
                if (confirm) {
                    setColorOrder("#5d5d5d");
                    const newOrder = { ...Order };
                    newOrder.OrderCustStatus = "Done";
                    setOrder(newOrder);
                    handleOrderCustStatus(Order.OrderID, "Done");
                }
        } else if (Order.OrderCustStatus === "Done") {
            const confirm = window.confirm("Deseas regresar la orden a PREPARANDO?");
                if (confirm) {
                    setColorOrder("#ffffff");
                    const newOrder = { ...Order };
                    newOrder.OrderCustStatus = "InPlace";
                    setOrder(newOrder);
                    handleOrderCustStatus(Order.OrderID, "InPlace");
                }
        }
    }

    const [cliente, setCliente] = useState('');
    // Colores fijos para clientes según OrderID mod 5
    const customerColors = ['#ff5382', '#39c5ff', '#ec1cff', '#80ff10', '#fbdd31'];
    const getCustomerBgColor = id => customerColors[id % customerColors.length];
    const [clientIcon, setClientIcon] = useState(false);
    
    // Estado para origen WhatsApp
    const [origenWhatsapp, setOrigenWhatsapp] = useState(false);

    const handleCliente = (e) => {
        setCliente(e.target.value);
        setClientIcon(false);
    }
    
    // Manejar doble click en icono WhatsApp
    const handleWhatsappDoubleClick = () => {
        const newOrigen = !origenWhatsapp;
        setOrigenWhatsapp(newOrigen);
        
        // Actualizar la orden con el nuevo origen
        const newOrder = { ...Order };
        newOrder.Origen = newOrigen ? 'Whatsapp' : '';
        setOrder(newOrder);
        ordersApi.updateOrder(newOrder)
            .then((res) => {
                console.log("Origen actualizado:", newOrigen ? 'Whatsapp' : '');
                socket.emit('OrdenActualizadaDesdeCliente', {msg: Order.OrderID});
            })
            .catch((err) => {
                console.log(err);
            });
    };

    useEffect(() => {
        if (!Order) return; // Verificación de seguridad
        const savedCliente = Order.Customer || '';
        console.log("CARGANDO CLIENTE", savedCliente);
        setCliente(savedCliente);
        setClientIcon(savedCliente !== '');
        // Cargar origen WhatsApp
        setOrigenWhatsapp(Order.Origen === 'Whatsapp');
    }, [Order?.Customer, Order?.Origen]);

    const updateCliente = () => {
        const newOrder = { ...Order };
            newOrder.Customer = document.getElementById(`textAreaClient_${Order.OrderID}`).value;
            console.log("Adding cliente: ", newOrder.Customer);
            setOrder(newOrder);
            ordersApi.updateOrder(newOrder)
            .then((res) => {
                console.log(res);
                setClientIcon(true);
                socket.emit('OrdenActualizadaDesdeCliente', {msg: Order.OrderID});
            })
            .catch((err) => {
                console.log(err);
            });
    }

    const handleBubbleToggle = (comandaId) => {
        setExpandedComandas(prev =>
            prev.includes(comandaId)
                ? prev.filter(id => id !== comandaId)
                : [...prev, comandaId]
        );
    };

    // Agrego lógica para determinar dinámicamente el ícono y su color según estado
    const savedCliente = Order?.Customer || '';
    const isEditing = cliente !== savedCliente;
    const iconType = clientIcon ? faCheck : faFloppyDisk;
    let iconColor;
    if (clientIcon) {
        iconColor = '#28a745';           // verde cuando ya está guardado
    } else if (isEditing && cliente !== '') {
        iconColor = '#007bff';           // azul cuando hay cambios sin guardar
    } else {
        iconColor = '#dc3545';           // rojo cuando está vacío y sin guardar
    }

    const confirmarCobroParcial = () => {
        // Bloquear inmediatamente para evitar doble click
        if (isProcessingPayment) return;
        setIsProcessingPayment(true);

        const pending = computedPending;
        const items = Array.from(itemsSeleccionadosPago);
        const montoItems = comandas
          .filter(c => itemsSeleccionadosPago.has(c.ComandaId))
          .reduce((sum, c) => sum + c.Precio, 0);

        const hasAmount = (montoEspecifico || 0) > 0;
        const hasItems = items.length > 0;

        if (!hasAmount && !hasItems) {
          notify('Selecciona ítems o ingresa un monto');
          setIsProcessingPayment(false);
          return;
        }
        // Seguridad extra: evitamos mezclar (aunque la UI intenta hacerlo mutuamente excluyente)
        if (hasAmount && hasItems) {
          notify('Elige solo una opción: ítems o monto');
          setIsProcessingPayment(false);
          return;
        }

        const monto = hasAmount ? montoEspecifico : montoItems;
        if (monto <= 0 || monto > pending) {
          notify('Monto inválido');
          setIsProcessingPayment(false);
          return;
        }
        ordersApi.addPayment(Order.OrderID, { monto, tipoPago: hasAmount ? 'monto' : 'items', itemsPagados: hasAmount ? [] : items, metodoPago })
          .then((updated) => {
            setOrder(updated);
            // Refrescar orden completa para recalcular pendiente (puede ser negativo si hay exceso)
            fetchOrder();
            setModalPagoVisible(false);
            setIsProcessingPayment(false);
          })
          .catch(err => {
            notify(`Error al cobrar: ${err}`);
            setIsProcessingPayment(false);
          });
    };

    // Al abrir modal, limpiar selección previa y monto, y obtener la orden v2
    useEffect(() => {
      if (modalPagoVisible) {
        setItemsSeleccionadosPago(new Set());
        setMontoEspecifico(0);
        setMetodoPago('cash');
        setPaymentMethodEdits({});
        ordersApi.getOrderV2(OrderID)
          .then(data => {
            setOrderV2(data);
          })
          .catch(err => console.error(err));
      }
    }, [modalPagoVisible, OrderID]); // Add OrderID dependency

    const cobrarTodo = () => {
      // Calcular pendiente a cobrar siempre como computedPending
      const pending = computedPending;
      if (pending <= 0) {
        notify('No hay monto pendiente');
        return;
      }
      ordersApi.addPayment(OrderID, { monto: pending, tipoPago: 'monto', itemsPagados: [], metodoPago })
        .then(updated => {
          setOrder(updated);
          setOrderV2(updated);
          // Refrescar orden completa para recalcular pendiente
          fetchOrder();
          setModalPagoVisible(false);
        })
        .catch(err => notify(`Error al cobrar todo: ${err}`));
    };

    // Helper para formatear la hora en 12h (HH:mm AM/PM)
    const format12Hour = dateStr => {
      const d = new Date(dateStr);
      let h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h %= 12;
      h = h || 12;
      const hh = h < 10 ? '0' + h : h;
      const mm = m < 10 ? '0' + m : m;
      return `${hh}:${mm} ${ampm}`;
    };

    // IDs de items ya cobrados en pagos tipo 'items'
    const paidItemIds = new Set(orderV2.pagos
      .filter(p => p.tipoPago === 'items')
      .flatMap(p => p.itemsPagados || [])
    );

    // ==== UI helpers para resumen de cobro (barra de progreso) ====
    const totalOrden = Order?.CuentaTotal || 0;
    const pagadoActual = realPagado; // Usar suma real de pagos
    const pendienteActual = Math.max(0, computedPending || 0);
    const percentPaid = totalOrden > 0
      ? Math.min(100, Math.max(0, (pagadoActual / totalOrden) * 100))
      : (isFullyPaid ? 100 : 0);

    const totalCobradoHistorial = realPagado; // Ya calculado arriba

    // Función para seleccionar todos los ítems disponibles
    const handleSelectAllItems = () => {
      const availableIds = comandas
        .filter(c => !paidItemIds.has(c.ComandaId))
        .map(c => c.ComandaId);
      setItemsSeleccionadosPago(new Set(availableIds));
    };

    // Verificación de seguridad: si Order no existe o fue eliminada, no renderizar
    if (!Order || !Order.OrderID) {
      return null;
    }

    return (
        <>
        <div className="card" style={{backgroundColor: colorOrder}}>
        {/* Text box editable backgroudn red and text blanco BOLD */}
            <div className='row'>
                <div className='col-10'>
                    <textarea className="form-control" id={`textAreaClient_${Order.OrderID}`} rows="1" placeholder="Cliente"
                    onChange={handleCliente}
                    value={cliente}
                    style={{
                        backgroundColor: getCustomerBgColor(Order.OrderID),
                        color: '#000',
                        fontWeight: 'bold',
                        fontSize: '20px',
                        paddingRight: '40px',
                        textShadow: '-0.2px -0.2px 0 #000, 0.2px -0.2px 0 #000, -0.2px 0.2px 0 #000, 0.2px 0.2px 0 #000'
                    }}
                    ></textarea>
                </div>
                <div className='col-2' style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {/* Icono WhatsApp - doble click para activar/desactivar */}
                    <img 
                        src="icons/whatsapp.png" 
                        alt="WhatsApp"
                        onDoubleClick={handleWhatsappDoubleClick}
                        style={{
                            width: '36px',
                            height: '36px',
                            cursor: 'pointer',
                            opacity: origenWhatsapp ? 1 : 0.3,
                            transition: 'opacity 0.2s ease',
                            filter: origenWhatsapp ? 'none' : 'grayscale(50%)'
                        }}
                        title={origenWhatsapp ? 'Origen: WhatsApp (doble click para quitar)' : 'Doble click para marcar como WhatsApp'}
                    />
                    {/* Botón guardar cliente */}
                    <div className="form-group">
                        <button type="button" className="btn btn-primary" style={{backgroundColor: iconColor}} onClick={updateCliente}>
                            <FontAwesomeIcon icon={iconType} size="2x" style={{ color: '#fff' }} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-2 d-flex align-items-center justify-content-center pe-0">
                    <div className="toggleArrowButtons">
                        <button style={{backgroundColor:  toggleArrowStatus ? "#ffffff" : "#7ed65b"}} onClick={() => setToggleArrowStatus(!toggleArrowStatus)}>
                            <FontAwesomeIcon style={{color: toggleArrowStatus ? "#5d5d5d" : "#ffffff"}} icon={toggleArrowStatus ? faAngleUp : faAngleDown} size="2x" />
                        </button>
                    </div>
                </div>
                <div className="col-4 d-flex align-items-center orderNum ps-0 pe-0">
                    <div className="orderNumText">{`Pedido: ${Order.OrderID}`}</div>
                </div>
                <div className="col-6 d-flex align-items-center orderTotal ps-0">
                    <div className="orderPayMini">
                        <div className="orderPayMini__row">
                            <div className={`orderPayMini__title ${cardIsExceeded ? 'isExceeded' : (cardIsPaid ? 'isPaid' : 'isPending')}`}>
                                {cardIsExceeded ? 'Exced' : (cardIsPaid ? 'OK' : 'Pend.')}
                            </div>
                            <div className={`orderPayMini__amount ${cardIsExceeded ? 'isExceeded' : (cardIsPaid ? 'isPaid' : 'isPending')}`}>
                                ${cardIsExceeded ? cardExcesoMonto.toFixed(2) : cardPendiente.toFixed(2)}
                            </div>
                        </div>
                        <div className={`orderPayMini__bar ${cardIsExceeded ? 'isExceeded' : (cardIsPaid ? 'isPaid' : 'isPending')}`}>
                            <div className="orderPayMini__fill" style={{ width: `${cardPercentPaid}%` }} />
                        </div>
                    </div>
                    <button onClick={() => setModalPagoVisible(true)} style={{ marginRight: '8px' }}>
                        <FontAwesomeIcon icon={faHandHoldingUsd} size='2x' />
                    </button>
                    <button onClick={handleOrderCustStatusButton}> {/* Will allow change Paid Prep and Cust Status */}
                        <FontAwesomeIcon icon={faCashRegister} size='2x' />
                    </button>
                </div>
            </div>
            {modeInterface && isEmptyOrder && (
                <div className="row mt-2">
                    <div className="col-12 d-flex justify-content-center">
                        <button
                            type="button"
                            className="btn btn-danger empty-order-delete-btn"
                            onClick={() => DeleteOrder(Order.OrderID)}
                            title="Eliminar orden vacía"
                        >
                            <FontAwesomeIcon icon={faTrash} style={{ marginRight: '8px' }} />
                            Eliminar orden vacía
                        </button>
                    </div>
                </div>
            )}
            {toggleArrowStatus && (
            <div>
                {modeInterface && (
                    <PlatilloSelector addPlatilloToOrder={addComanda} platillos={platillos} numPlatillos={numPlatillos}/>
                )}
                {/* Burbujas para comandas ReadyToServe no expandidas */}
                <div className="bubbles-container" style={{display: 'flex', gap: '8px', margin:'8px 0'}}>
                    {comandas
                        .filter(c => c.ComandaPrepStatus === 'ReadyToServe' && !expandedComandas.includes(c._id))
                        .map(c => (
                            <div
                                key={c._id}
                                className="comanda-bubble"
                                style={{
                                    width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '2px solid #00ff5e'
                                }}
                                onClick={() => handleBubbleToggle(c._id)}
                            >
                                <img
                                    src={c.Imagen}
                                    alt={c.Platillo}
                                    style={{width:'100%', height:'100%', objectFit:'cover'}}
                                />
                            </div>
                        ))}
                </div>
                {/* Tarjetas para comandas no ReadyToServe o expandidas */}
                {comandas
                    .filter(c => c.ComandaPrepStatus !== 'ReadyToServe' || expandedComandas.includes(c._id))
                    .map((comanda) => (
                        <div key={comanda._id}>
                            <ComandaCard
                                order={Order}
                                modeInterface={modeInterface}
                                Comanda={comanda}
                                updateComanda={updateComanda}
                                removeComanda={removeComanda}
                                onBubbleToggle={handleBubbleToggle}
                            />
                        </div>
                ))}
            </div>
            )}
        </div>
        {/* Cobro Parcial Modal */}
        {modalPagoVisible && (
          <div className='modal-pago-fondo'>
            <div className='modal-pago-contenedor'>
              <div className='modal-header'>
                <button onClick={() => setModalPagoVisible(false)} className='text-white'>
                  <i className='fas fa-arrow-left'></i>
                </button>
                <h3 className='font-bold'>Cobro Parcial</h3>
                <div style={{ width: '1.5rem' }}></div>
              </div>
              <div className='modal-body'>
                <div className='modal-summary'>
                  <div className='flex justify-between items-end mb-3'>
                    <div>
                      <div className='text-sm text-gray-600'>Total de la orden</div>
                      <div className='text-xl font-bold'>${totalOrden.toFixed(2)}</div>
                    </div>
                    <div className={`payment-badge ${isExceeded ? 'payment-badge--exceeded' : (isFullyPaid ? 'payment-badge--paid' : 'payment-badge--pending')}`}>
                      {isExceeded ? (
                        <>
                          <span>⚠️ Excedido: </span><b>${excesoMonto.toFixed(2)}</b>
                        </>
                      ) : isFullyPaid ? (
                        <>
                          <FontAwesomeIcon icon={faCheck} /> <span>Orden saldada</span>
                        </>
                      ) : (
                        <>
                          <span>Falta: </span><b>${pendienteActual.toFixed(2)}</b>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={`payment-progress ${isExceeded ? 'payment-progress--exceeded' : (isFullyPaid ? 'payment-progress--paid' : 'payment-progress--pending')}`}>
                    <div className='payment-progress__meta'>
                      <span className='text-sm text-gray-600'>Progreso de cobro</span>
                      <span className='text-sm font-bold'>{isExceeded ? `${Math.round(percentPaid)}% ⚠️` : `${Math.round(percentPaid)}%`}</span>
                    </div>
                    <div
                      className='payment-progress__bar'
                      role='progressbar'
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(percentPaid)}
                      aria-label='Progreso de cobro'
                    >
                      <div className='payment-progress__fill' style={{ width: `${percentPaid}%` }} />
                      {percentPaid > 0 && <div className='payment-progress__dot' style={{ left: `calc(${percentPaid}% - 6px)` }} />}
                    </div>
                    <div className='payment-progress__numbers'>
                      <div className='payment-progress__num payment-progress__num--paid'>
                        <div className='label'>Pagado</div>
                        <div className='value'>${pagadoActual.toFixed(2)}</div>
                      </div>
                      <div className={`payment-progress__num ${isExceeded ? 'payment-progress__num--exceeded' : 'payment-progress__num--pending'}`}>
                        <div className='label'>{isExceeded ? 'Exceso' : 'Pendiente'}</div>
                        <div className='value'>${isExceeded ? excesoMonto.toFixed(2) : pendienteActual.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Historial de pagos */}
                {orderV2.pagos.length > 0 && (
                  <div className='mb-4'>
                    <h5 className='font-medium mb-2'>Historial de cobros</h5>
                    <div className='overflow-auto scrollbar-hide mb-1' style={{ maxHeight: '6rem' }}>
                      {orderV2.pagos.map((p, i) => (
                        <div key={p?._id || i} className='payment-history-item'>
                          <div className='payment-history-left'>
                            <div className='payment-history-desc'>
                              <button
                                type="button"
                                className="payment-method-inline"
                                onClick={() => handleTogglePaymentHistoryMethod(p)}
                                title="Cambiar método de este cobro"
                              >
                                {getMetodoPagoEmoji(paymentMethodEdits[p._id] || p.metodoPago || 'cash')}
                              </button>
                              <span>
                                {p.tipoPago === 'items'
                                  ? `Items: ${p.itemsPagados.map(id => {
                                      const item = comandas.find(c => c.ComandaId === id);
                                      return item ? item.Platillo : id;
                                    }).join(', ')}`
                                  : 'Pago monto fijo'}
                              </span>
                            </div>
                          </div>
                          <div className='payment-history-right'>
                            <div className='payment-time-badge'>{format12Hour(p.fecha)}</div>
                            <div className='payment-amount'>${p.monto.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className='payment-history-total'>
                      <span className='payment-history-total__label'>Total cobrado</span>
                      <span className='payment-history-total__value'>${totalCobradoHistorial.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {!isFullyPaid && (
                  <>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='text-sm text-gray-600'>
                        Método para este cobro:
                      </div>
                      <button
                        type='button'
                        className='payment-method-toggle'
                        onClick={toggleMetodoPago}
                        title='Cambiar método (efectivo / tarjeta / transferencia)'
                      >
                        <span className='payment-method-toggle__emoji'>{getMetodoPagoEmoji(metodoPago)}</span>
                      </button>
                    </div>
                    {/* Selección de ítems + monto en una sola vista */}
                    {hasMontoPago && (
                      <div className='mb-3 text-sm text-gray-600'>
                        Ya existe un cobro por <b>monto fijo</b>. Por consistencia, la selección de ítems queda deshabilitada; puedes ingresar un monto adicional abajo.
                      </div>
                    )}

                    <div className='flex justify-end mb-2'>
                      {!hasMontoPago && (
                        <button
                          className='text-sm text-blue-600 underline'
                          onClick={() => {
                            setMontoEspecifico(0);
                            handleSelectAllItems();
                          }}
                        >
                          Seleccionar todos
                        </button>
                      )}
                    </div>

                    <div className='items-content scrollbar-hide mb-4'>
                      {comandas.filter(c => !paidItemIds.has(c.ComandaId)).map(c => (
                        <div key={c.ComandaId} className='relative'>
                          <input
                            type='checkbox'
                            id={`chk_${c.ComandaId}`}
                            className='item-checkbox'
                            disabled={hasMontoPago}
                            checked={itemsSeleccionadosPago.has(c.ComandaId)}
                            onChange={e => {
                              if (hasMontoPago) return;
                              const s = new Set(itemsSeleccionadosPago);
                              e.target.checked ? s.add(c.ComandaId) : s.delete(c.ComandaId);
                              setItemsSeleccionadosPago(s);
                              // Si el usuario selecciona ítems, limpiamos el monto
                              if (s.size > 0) setMontoEspecifico(0);
                            }}
                          />
                          <label htmlFor={`chk_${c.ComandaId}`} className='item-label'>
                            <div className='icon-container'>
                              <FontAwesomeIcon
                                icon={faCheck}
                                className={itemsSeleccionadosPago.has(c.ComandaId) ? 'text-green-600' : 'text-transparent'}
                              />
                            </div>
                            <div className='flex-1'><div className='font-medium'>{c.Platillo}</div></div>
                            <div className='font-bold'>${c.Precio.toFixed(2)}</div>
                          </label>
                        </div>
                      ))}
                    </div>

                    {/* Input de monto al final (mutuamente excluyente con selección de ítems) */}
                    <div className='mb-4'>
                      <div className='text-sm text-gray-600 mb-2'>
                        O ingresa un monto a cobrar (esto limpiará la selección de ítems):
                      </div>
                      <div className='relative'>
                        <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500'>$</span>
                        <span className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500' title='Método de pago seleccionado'>
                          {getMetodoPagoEmoji(metodoPago)}
                        </span>
                        <input
                          type='number'
                          className='w-full pl-8 pr-10 py-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500'
                          placeholder='0.00'
                          max={computedPending}
                          min='0'
                          step='0.01'
                          value={montoEspecifico}
                          onChange={e => {
                            const next = parseFloat(e.target.value);
                            const safe = Number.isFinite(next) ? next : 0;
                            setMontoEspecifico(safe);
                            if (safe > 0) setItemsSeleccionadosPago(new Set());
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
                {/* Acciones */}
                <div className='flex justify-end space-x-3'>
                  {hasPaymentEdits ? (
                    <>
                      <button
                        className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center'
                        onClick={savePaymentHistoryEdits}
                      >
                        <i className='fas fa-save mr-2'></i>Guardar
                      </button>
                      <button
                        className='bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition flex items-center'
                        onClick={() => { cancelPaymentHistoryEdits(); setModalPagoVisible(false); }}
                      >
                        <i className='fas fa-times mr-2'></i>Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      {!isFullyPaid && (
                        <button
                          className={`${isProcessingPayment ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-lg transition flex items-center`}
                          onClick={confirmarCobroParcial}
                          disabled={isProcessingPayment}
                        >
                          <i className={`fas ${isProcessingPayment ? 'fa-spinner fa-spin' : 'fa-check-circle'} mr-2`}></i>
                          {isProcessingPayment ? 'Procesando...' : 'Confirmar'}
                        </button>
                      )}
                      <button
                        className='bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition flex items-center'
                        onClick={() => setModalPagoVisible(false)}
                      >
                        <i className='fas fa-times mr-2'></i>Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </>
    );
}

export default Orden;