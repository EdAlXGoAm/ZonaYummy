import './MeseroOrderPanel.css';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getPaymentSummary, sumPagosMonto } from './meseroPaymentUtils';
import { normalizeComandasList, getNextComandaId, isPendingComandaDoc } from './meseroComandasUtils';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleUp, faAngleDown, faHandHoldingUsd } from '@fortawesome/free-solid-svg-icons';
import { faTrash, faCashRegister } from '@fortawesome/free-solid-svg-icons';
import MeseroPlatilloSelector from './MeseroPlatilloSelector';
import MeseroCustomerField from './MeseroCustomerField';
import MeseroComandaSlot from './MeseroComandaSlot';
import MeseroCobroJsonModal from './MeseroCobroJsonModal';
import comandasApi from './../../../api/comandasApi';
import borradosApi from './../../../api/borradosApi';
import ordersApi from './../../../api/ordersApi';
import io from 'socket.io-client';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ========== LOGGING DE RENDIMIENTO CENTRALIZADO ==========
import performanceLogger from '../../../utils/performanceLogger';
import { bindTouchAxisScroll } from './meseroTouchAxisScroll';
// Para activar DEBUG temporal: cambiar ENABLE_DEV_MODE a true en ../../../utils/performanceLogger.js
// ========== FIN LOGGING ==========

const socket = io(`${process.env.REACT_APP_API_URL}`);

const isComandaInEditingMode = (comanda) => comanda.ComandaPaidStatus === 'Editing';

const sortComandasForDisplay = (list) => [...list].sort((a, b) => {
    const editingRank = (comanda) => (isComandaInEditingMode(comanda) ? 0 : 1);
    const rankDiff = editingRank(a) - editingRank(b);
    if (rankDiff !== 0) {
        return rankDiff;
    }
    return Number(a.ComandaId) - Number(b.ComandaId);
});

const buildOrderCachePatch = (order) => {
    if (!order?.OrderID) {
        return null;
    }
    const { Customer, Origen, ...rest } = order;
    return rest;
};

const MeseroOrderPanel = ({modeInterface, iInterface, OrderID, DeleteOrder, handleOrderCustStatus, platillos, numPlatillos, handleOrderClient, preloadedOrder, preloadedComandas, isOptimized, galleryLayout = false, onRegisterAddPlatillo, onComandasCacheSync, onOrderCacheSync }) => {
    const notify = (message) => toast(message);
    const [Order, setOrder] = useState({});
    const orderRef = useRef(Order);
    orderRef.current = Order;
    const preloadedOrderRef = useRef(preloadedOrder);
    preloadedOrderRef.current = preloadedOrder;
    const preloadedComandasRef = useRef(preloadedComandas);
    preloadedComandasRef.current = preloadedComandas;
    const isOptimizedRef = useRef(isOptimized);
    isOptimizedRef.current = isOptimized;
    const [comandas, setComandas] = useState([])
    const [toggleArrowStatus, setToggleArrowStatus] = useState(true); // false: plegado, true: desplegado
    const [colorOrder, setColorOrder] = useState("#ffffff")
    const pendingSkipFetchesRef = useRef(0);
    const pendingSkipOrderStatusFetchRef = useRef(0);
    const comandasHydratedRef = useRef(false);
    const initialComandasLoadRef = useRef(!(isOptimized && preloadedComandas !== undefined));
    const [comandasLoading, setComandasLoading] = useState(
        () => galleryLayout && !(isOptimized && preloadedComandas !== undefined),
    );
    const fetchOrderTimerRef = useRef(null);
    const fetchComandasTimerRef = useRef(null);
    const [expandedComandas, setExpandedComandas] = useState([]);
    const [modalPagoVisible, setModalPagoVisible] = useState(false);
    const [modalCobroJsonVisible, setModalCobroJsonVisible] = useState(false);
    const cobroLongPressTimerRef = useRef(null);
    const cobroLongPressTriggeredRef = useRef(false);
    const COBRO_LONG_PRESS_MS = 550;
    const [montoEspecifico, setMontoEspecifico] = useState(0);
    const [itemsSeleccionadosPago, setItemsSeleccionadosPago] = useState(new Set());
    const [orderV2, setOrderV2] = useState({ pagos: [], pagado: 0, pendiente: 0 });
    // Método de pago para EL PRÓXIMO cobro (compat: si no viene, backend asume 'cash')
    const [metodoPago, setMetodoPago] = useState('cash'); // 'cash' | 'card' | 'transfer'
    // Edición de método de pago por cobro ya registrado (historial)
    const [paymentMethodEdits, setPaymentMethodEdits] = useState({}); // { [pagoId]: 'cash'|'card'|'transfer' }
    const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Bloquea botón de confirmar
    const pagosSource = useMemo(
        () => (Order?.pagos?.length > 0 ? Order.pagos : orderV2?.pagos) || [],
        [Order?.pagos, orderV2?.pagos],
    );

    const paymentSummary = useMemo(
        () => getPaymentSummary(comandas, pagosSource),
        [comandas, pagosSource],
    );

    const {
        liveTotal,
        pagado: realPagado,
        pending: computedPending,
        pendingDisplay: pendienteActual,
        isExceeded,
        excesoMonto,
        isFullyPaid,
        unpaidComandas,
        paidItemIds,
    } = paymentSummary;

    const hasMontoPagoHistorial = pagosSource.some((p) => p.tipoPago === 'monto');
    const hasMontoEnSesion = (montoEspecifico || 0) > 0;
    const hasItemsEnSesion = itemsSeleccionadosPago.size > 0;
    const isEmptyOrder = (comandas?.length || 0) === 0;

    const resolveGalleryCustomerFields = (mergedBase = {}) => {
        const latest = orderRef.current;
        const cached = preloadedOrderRef.current;
        return {
            Customer: (latest.Customer || cached?.Customer || mergedBase.Customer || ''),
            Origen: (latest.Origen || cached?.Origen || mergedBase.Origen || ''),
        };
    };

    const applyLocalOrderTotals = (newOrder, pagadoBase, newPendiente) => {
        const pagosMerged = newOrder.pagos?.length ? newOrder.pagos : (orderRef.current.pagos ?? []);
        const { Customer, Origen } = galleryLayout
            ? resolveGalleryCustomerFields(newOrder)
            : {
                Customer: newOrder.Customer ?? orderRef.current.Customer ?? '',
                Origen: newOrder.Origen ?? orderRef.current.Origen ?? '',
            };

        setOrder((prev) => ({
            ...newOrder,
            OrderCustStatus: prev.OrderCustStatus ?? newOrder.OrderCustStatus,
            Customer,
            Origen,
            pagos: pagosMerged,
            pagado: pagadoBase,
            pendiente: newPendiente,
        }));
        setOrderV2((prev) => ({
            ...prev,
            ...newOrder,
            pagos: pagosMerged,
            pagado: pagadoBase,
            pendiente: newPendiente,
        }));
    };

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
        setOrder(fresh);
        setOrderV2(fresh);
        setPaymentMethodEdits({});
        notify('Cambios guardados');
        setModalPagoVisible(false);
      } catch (err) {
        notify(`Error al guardar cambios: ${err}`);
      }
    };

    // ==== Resumen compacto para tarjeta (totales en vivo desde comandas) ====
    const cardTotal = liveTotal || Order?.CuentaTotal || 0;
    const cardPagado = realPagado;
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
        const cachedOrder = preloadedOrderRef.current;
        const cachedComandas = preloadedComandasRef.current;
        if (isOptimizedRef.current && cachedOrder && cachedComandas !== undefined) {
            performanceLogger.critical(`⚡ USANDO DATOS PRE-CARGADOS para OrderID: ${OrderID} (${cachedComandas.length} comandas)`);
            
            comandasHydratedRef.current = true;
            initialComandasLoadRef.current = false;
            setComandasLoading(false);
            setOrder((prev) => {
                const { Customer, Origen } = galleryLayout
                    ? resolveGalleryCustomerFields({ ...cachedOrder, ...prev })
                    : {
                        Customer: prev.Customer || cachedOrder.Customer || '',
                        Origen: prev.Origen || cachedOrder.Origen || '',
                    };
                return {
                    ...cachedOrder,
                    OrderCustStatus: prev.OrderCustStatus ?? cachedOrder.OrderCustStatus,
                    Customer,
                    Origen,
                };
            });
            setComandas(normalizeComandasList(cachedComandas));
            updateCuentaTotalOrder(cachedComandas, cachedOrder);
            ordersApi.getOrderV2(OrderID)
                .then((data) => {
                    setOrderV2(data);
                    setOrder((prev) => ({
                        ...prev,
                        pagos: data.pagos ?? [],
                        pagado: data.pagado ?? 0,
                        pendiente: data.pendiente ?? prev.pendiente,
                    }));
                })
                .catch((err) => console.log(err));
            
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

    const scheduleFetchOrder = () => {
        if (fetchOrderTimerRef.current) {
            clearTimeout(fetchOrderTimerRef.current);
        }
        fetchOrderTimerRef.current = setTimeout(() => {
            fetchOrderTimerRef.current = null;
            fetchOrder();
        }, 120);
    };

    useEffect(() => {
        return () => {
            if (fetchOrderTimerRef.current) {
                clearTimeout(fetchOrderTimerRef.current);
            }
            if (fetchComandasTimerRef.current) {
                clearTimeout(fetchComandasTimerRef.current);
            }
        };
    }, []);

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
        const latest = orderRef.current;
        const mergedBase = { ...order, ...latest };
        const pagosForCalc = mergedBase.pagos?.length ? mergedBase.pagos : (latest.pagos ?? []);
        const pagadoFromPagos = sumPagosMonto(pagosForCalc);
        const pagadoBase = pagadoFromPagos > 0 ? pagadoFromPagos : (mergedBase.pagado || 0);
        const newPendiente = cuentaTotal - pagadoBase;
        const newOrder = {
            ...mergedBase,
            CuentaTotal: cuentaTotal,
            pagado: pagadoBase,
            pendiente: newPendiente,
        };
        const { Customer, Origen } = galleryLayout
            ? resolveGalleryCustomerFields(mergedBase)
            : {
                Customer: mergedBase.Customer ?? '',
                Origen: mergedBase.Origen ?? '',
            };
        newOrder.Customer = Customer;
        newOrder.Origen = Origen;

        const totalsUnchanged = galleryLayout
            && Number(mergedBase.CuentaTotal || 0) === Number(cuentaTotal)
            && Number(pagadoBase) === Number(mergedBase.pagado || 0);
        
        const calcTime = performance.now() - calcStartTime;
        performanceLogger.log(`🧮 Cálculo de totales: ${calcTime.toFixed(2)}ms - Comandas procesadas: ${comandasDB ? comandasDB.length : 0}, Total: $${cuentaTotal}`);

        if (totalsUnchanged) {
            performanceLogger.timeEnd(updateId);
            performanceLogger.log(`⏭️ updateCuentaTotalOrder omitido (totales sin cambio) para OrderID: ${OrderID}`);
            applyLocalOrderTotals(newOrder, pagadoBase, newPendiente);
            return;
        }
        
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
            
            const pagosMerged = newOrder.pagos?.length ? newOrder.pagos : (orderRef.current.pagos ?? []);
            const resolvedFields = galleryLayout
                ? resolveGalleryCustomerFields(newOrder)
                : {
                    Customer: newOrder.Customer ?? orderRef.current.Customer ?? '',
                    Origen: newOrder.Origen ?? orderRef.current.Origen ?? '',
                };
            setOrder((prev) => ({
                ...newOrder,
                OrderCustStatus: prev.OrderCustStatus ?? newOrder.OrderCustStatus,
                Customer: resolvedFields.Customer,
                Origen: resolvedFields.Origen,
                pagos: pagosMerged,
                pagado: pagadoBase,
                pendiente: newPendiente,
            }));
            setOrderV2((prev) => ({
                ...prev,
                ...newOrder,
                pagos: pagosMerged,
                pagado: pagadoBase,
                pendiente: newPendiente,
            }));
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

    useEffect(() => {
        comandasHydratedRef.current = false;
        lastOrderCacheSyncRef.current = '';
        lastComandasCacheSyncRef.current = '';
    }, [OrderID]);

    useEffect(() => {
        if (
            !galleryLayout
            || !Order?.OrderID
            || !comandasHydratedRef.current
            || typeof onComandasCacheSync !== 'function'
        ) {
            return;
        }
        const syncKey = `${Order.OrderID}:${comandas.length}:${comandas.map((c) => c._id ?? c.ComandaId).join(',')}`;
        if (syncKey === lastComandasCacheSyncRef.current) {
            return;
        }
        lastComandasCacheSyncRef.current = syncKey;
        onComandasCacheSync(Order.OrderID, comandas);
    }, [galleryLayout, Order?.OrderID, comandas, onComandasCacheSync]);

    useEffect(() => {
        if (!galleryLayout || !Order?.OrderID || typeof onOrderCacheSync !== 'function') {
            return;
        }
        const patch = buildOrderCachePatch(Order);
        if (!patch) {
            return;
        }
        const patchSignature = JSON.stringify(patch);
        if (patchSignature === lastOrderCacheSyncRef.current) {
            return;
        }
        lastOrderCacheSyncRef.current = patchSignature;
        onOrderCacheSync(patch);
    }, [galleryLayout, Order, onOrderCacheSync]);

    useEffect(() => {
        if (!galleryLayout || !preloadedOrder?.OrderID) {
            return;
        }
        setOrder((prev) => {
            if (Number(prev.OrderID) !== Number(preloadedOrder.OrderID)) {
                return prev;
            }
            const nextCustomer = preloadedOrder.Customer ?? prev.Customer ?? '';
            const nextOrigen = preloadedOrder.Origen ?? prev.Origen ?? '';
            if (prev.Customer === nextCustomer && prev.Origen === nextOrigen) {
                return prev;
            }
            return {
                ...prev,
                Customer: nextCustomer,
                Origen: nextOrigen,
            };
        });
    }, [galleryLayout, preloadedOrder?.OrderID, preloadedOrder?.Customer, preloadedOrder?.Origen]);

    const finishComandasLoad = () => {
        if (initialComandasLoadRef.current) {
            initialComandasLoadRef.current = false;
            setComandasLoading(false);
        }
    };

    const fetchComandas = (order) => {
        // Inicia el cronómetro para el proceso completo
        const startTime = performance.now();
        const fetchId = `fetchComandas_Order_${OrderID}_${Date.now()}`;
        performanceLogger.time(fetchId);
        performanceLogger.log(`🚀 [${new Date().toISOString()}] Iniciando fetchComandas para OrderID: ${OrderID}`);

        if (initialComandasLoadRef.current && galleryLayout) {
            setComandasLoading(true);
        }
        
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
            
            comandasHydratedRef.current = true;
            const normalized = normalizeComandasList(res);
            setComandas(normalized);
            updateCuentaTotalOrder(normalized, order);
            
            // Finaliza cronómetros
            performanceLogger.timeEnd(processingId);
            performanceLogger.timeEnd(fetchId);
            
            const processingTime = performance.now() - processingStart;
            const totalTime = performance.now() - startTime;
            
            performanceLogger.log(`⚡ Procesamiento local: ${processingTime.toFixed(2)}ms`);
            performanceLogger.log(`✅ fetchComandas COMPLETADO - Tiempo total: ${totalTime.toFixed(2)}ms`);
            performanceLogger.log(`📊 Desglose - API: ${apiCallTime.toFixed(2)}ms (${(apiCallTime/totalTime*100).toFixed(1)}%) | Procesamiento: ${processingTime.toFixed(2)}ms (${(processingTime/totalTime*100).toFixed(1)}%)`);
            finishComandasLoad();
        })
        .catch((err) => {
            performanceLogger.timeEnd(apiCallId);
            performanceLogger.timeEnd(fetchId);
            const errorTime = performance.now() - startTime;
            performanceLogger.error(`❌ Error en fetchComandas después de ${errorTime.toFixed(2)}ms:`, err);
            finishComandasLoad();
        });
    };

    useEffect(() => {
        fetchOrder();
    },[]);

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

    useEffect(() => {
        const orderIdStr = OrderID.toString();
        const matchesOrderMsg = (msg) => msg != null && String(msg) === orderIdStr;
        const matchesComandaMsg = (msg) => {
            if (typeof msg !== 'string') return false;
            return msg.split('-')[1] === orderIdStr;
        };

        const onOrdenActualizada = (data) => {
            if (matchesOrderMsg(data?.msg)) {
                if (pendingSkipOrderStatusFetchRef.current > 0) {
                    pendingSkipOrderStatusFetchRef.current -= 1;
                    return;
                }
                scheduleFetchOrder();
            }
        };
        const shouldSkipRemoteFetch = () => {
            if (pendingSkipFetchesRef.current > 0) {
                pendingSkipFetchesRef.current -= 1;
                return true;
            }
            return false;
        };
        const onNuevaComanda = (data) => {
            if (matchesComandaMsg(data?.msg)) {
                if (shouldSkipRemoteFetch()) return;
                scheduleFetchOrder();
            }
        };
        const onUpdateComanda = (data) => {
            if (matchesComandaMsg(data?.msg)) {
                if (shouldSkipRemoteFetch()) return;
                scheduleFetchOrder();
            }
        };
        const onDeleteComanda = (data) => {
            if (matchesComandaMsg(data?.msg)) {
                if (shouldSkipRemoteFetch()) return;
                scheduleFetchOrder();
            }
        };

        socket.on('OrdenActualizadaDesdeServidor', onOrdenActualizada);
        socket.on('NuevaComandaDesdeServidor', onNuevaComanda);
        socket.on('UpdateComandaDesdeServidor', onUpdateComanda);
        socket.on('DeleteComandaDesdeServidor', onDeleteComanda);

        return () => {
            socket.off('OrdenActualizadaDesdeServidor', onOrdenActualizada);
            socket.off('NuevaComandaDesdeServidor', onNuevaComanda);
            socket.off('UpdateComandaDesdeServidor', onUpdateComanda);
            socket.off('DeleteComandaDesdeServidor', onDeleteComanda);
        };
    }, [OrderID]);

    const buildNewComanda = (platillo, orderId, comandaId) => ({
        _id: `pending-${orderId}-${comandaId}`,
        OrderID: orderId,
        ComandaId: comandaId,
        Platillo: platillo.NombrePlatillo,
        Precio: platillo.Variants[0].Precio,
        Imagen: platillo.Imagen,
        Categoria: platillo.Categoria,
        ComandaPaidStatus: "Editing",
        ComandaPrepStatus: "Preparing",
        ComandaDeliverMode: "Delivery",
        ComandaSwitchNota: false,
        Notas: "",
        Details: platillo,
    });

    const scheduleFetchComandas = useCallback((order) => {
        if (fetchComandasTimerRef.current) {
            clearTimeout(fetchComandasTimerRef.current);
        }
        fetchComandasTimerRef.current = setTimeout(() => {
            fetchComandasTimerRef.current = null;
            fetchComandas(order);
        }, 200);
    }, []);

    const persistNewComandas = useCallback((newComandas) => {
        if (!newComandas.length) return;

        pendingSkipFetchesRef.current += newComandas.length;

        newComandas.forEach((comanda) => {
            handleComandas(`Add-${comanda.OrderID}-${comanda.Platillo}`);
        });

        Promise.all(newComandas.map((comanda) => comandasApi.addComanda(comanda)))
            .then((createdList) => {
                setComandas((prev) => normalizeComandasList(
                    prev.map((local) => {
                        const saved = createdList.find((c) => c.ComandaId === local.ComandaId);
                        if (!saved || !isPendingComandaDoc(local)) return local;
                        return {
                            ...saved,
                            ComandaPaidStatus: local.ComandaPaidStatus ?? saved.ComandaPaidStatus,
                            ComandaPrepStatus: local.ComandaPrepStatus ?? saved.ComandaPrepStatus,
                            Notas: local.Notas ?? saved.Notas,
                            ComandaDeliverMode: local.ComandaDeliverMode ?? saved.ComandaDeliverMode,
                        };
                    }),
                ));
                scheduleFetchComandas(Order);
            })
            .catch((err) => {
                console.log(err);
                notify(`Error al agregar comandas: ${err}`);
                scheduleFetchComandas(Order);
            });
    }, [Order, handleComandas, scheduleFetchComandas, notify]);

    const addComanda = useCallback((platillo) => {
        comandasHydratedRef.current = true;
        let newComanda;
        setComandas((prev) => {
            const nextId = getNextComandaId(prev);
            newComanda = buildNewComanda(platillo, Order.OrderID, nextId);
            return normalizeComandasList([...prev, newComanda]);
        });
        persistNewComandas([newComanda]);
    }, [Order.OrderID, persistNewComandas]);

    const addComandasBatch = useCallback((items) => {
        if (!items?.length) return;

        comandasHydratedRef.current = true;
        let newComandas = [];
        setComandas((prev) => {
            let nextId = getNextComandaId(prev);
            const batch = [];
            items.forEach(({ platillo, quantity }) => {
                const qty = Math.max(0, Number(quantity) || 0);
                for (let i = 0; i < qty; i++) {
                    batch.push(buildNewComanda(platillo, Order.OrderID, nextId));
                    nextId += 1;
                }
            });
            newComandas = batch;
            return batch.length ? normalizeComandasList([...prev, ...batch]) : prev;
        });

        if (newComandas.length) {
            persistNewComandas(newComandas);
        }
    }, [Order.OrderID, persistNewComandas]);

    const addPlatillosToOrder = useCallback((input) => {
        if (Array.isArray(input)) {
            addComandasBatch(input);
            return;
        }
        addComanda(input);
    }, [addComanda, addComandasBatch]);

    const addPlatillosToOrderRef = useRef(addPlatillosToOrder);
    addPlatillosToOrderRef.current = addPlatillosToOrder;

    const comandasGridRef = useRef(null);
    const bubblesContainerRef = useRef(null);
    const lastOrderCacheSyncRef = useRef('');
    const lastComandasCacheSyncRef = useRef('');

    useEffect(() => {
        if (!galleryLayout || typeof onRegisterAddPlatillo !== 'function') {
            return undefined;
        }
        const invokeAdd = (input) => addPlatillosToOrderRef.current(input);
        onRegisterAddPlatillo(invokeAdd);
        return () => onRegisterAddPlatillo(null);
    }, [galleryLayout, onRegisterAddPlatillo]);

    useEffect(() => {
        const cleanups = [];
        const bubbles = bubblesContainerRef.current;
        if (bubbles) {
            cleanups.push(bindTouchAxisScroll(bubbles, { axis: 'x' }));
        }

        if (galleryLayout) {
            const track = comandasGridRef.current;
            if (track) {
                cleanups.push(bindTouchAxisScroll(track, { axis: 'x' }));
                track.querySelectorAll('.mesero-order-panel__comanda-scroll').forEach((el) => {
                    cleanups.push(bindTouchAxisScroll(el, { axis: 'y' }));
                });
            }
        }

        return () => {
            cleanups.forEach((cleanup) => cleanup());
        };
    }, [galleryLayout, comandas.length, expandedComandas.length, toggleArrowStatus]);

    const updateComanda = useCallback((comanda, options = {}) => {
        const { notesOnly = false } = options;
        comandasHydratedRef.current = true;
        setComandas(prev => {
            const updated = normalizeComandasList(
                prev.map(c => c.ComandaId === comanda.ComandaId ? comanda : c),
            );
            if (!notesOnly) {
                updateCuentaTotalOrder(updated, Order);
            }
            pendingSkipFetchesRef.current += 1;
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
        const confirmDel = window.confirm(
            '¿Solicitar eliminación de este platillo? Un supervisor debe autorizarla en /eliminar.',
        );
        if (!confirmDel) return;
        if (!comanda._id) {
            notify('No se puede solicitar borrado: comanda sin ID.');
            return;
        }
        borradosApi.solicitarBorrado(comanda)
            .then(() => {
                notify('Solicitud de borrado enviada. Pendiente de autorización.');
                socket.emit('SolicitudBorradoDesdeCliente', {
                    comandaMongoId: comanda._id,
                    OrderID: comanda.OrderID,
                });
            })
            .catch((err) => {
                console.log(err);
                const msg = err.response?.data?.error || err.message;
                notify(`Error al solicitar borrado: ${msg}`);
            });
    }, [notify]);

    const handleOrderCustStatusButton = () => {
        if (Order.OrderCustStatus === "InPlace") {
            const confirm = window.confirm("La ORDEN ha sido COMPLETADA?");
                if (confirm) {
                    pendingSkipOrderStatusFetchRef.current = 2;
                    setColorOrder("#5d5d5d");
                    const newOrder = { ...Order };
                    newOrder.OrderCustStatus = "Done";
                    setOrder(newOrder);
                    handleOrderCustStatus(Order.OrderID, "Done");
                }
        } else if (Order.OrderCustStatus === "Done") {
            const confirm = window.confirm("Deseas regresar la orden a PREPARANDO?");
                if (confirm) {
                    pendingSkipOrderStatusFetchRef.current = 2;
                    setColorOrder("#ffffff");
                    const newOrder = { ...Order };
                    newOrder.OrderCustStatus = "InPlace";
                    setOrder(newOrder);
                    handleOrderCustStatus(Order.OrderID, "InPlace");
                }
        }
    }

    const handleBubbleToggle = (comandaComandaId) => {
        setExpandedComandas(prev =>
            prev.includes(comandaComandaId)
                ? prev.filter(id => id !== comandaComandaId)
                : [...prev, comandaComandaId]
        );
    };

    const clearCobroLongPress = useCallback(() => {
        if (cobroLongPressTimerRef.current) {
            clearTimeout(cobroLongPressTimerRef.current);
            cobroLongPressTimerRef.current = null;
        }
    }, []);

    const handleCobroPressStart = useCallback(() => {
        cobroLongPressTriggeredRef.current = false;
        clearCobroLongPress();
        cobroLongPressTimerRef.current = setTimeout(() => {
            cobroLongPressTriggeredRef.current = true;
            setModalCobroJsonVisible(true);
        }, COBRO_LONG_PRESS_MS);
    }, [clearCobroLongPress]);

    const handleCobroPressEnd = useCallback(() => {
        clearCobroLongPress();
    }, [clearCobroLongPress]);

    const handleCobroClick = useCallback(() => {
        if (cobroLongPressTriggeredRef.current) {
            cobroLongPressTriggeredRef.current = false;
            return;
        }
        setModalPagoVisible(true);
    }, []);

    const handleCobroJsonSaved = useCallback((updated) => {
        setOrderV2(updated);
        setOrder((prev) => ({
            ...prev,
            pagos: updated.pagos ?? [],
            pagado: updated.pagado ?? 0,
            pendiente: updated.pendiente ?? prev.pendiente,
            CuentaTotal: updated.CuentaTotal ?? prev.CuentaTotal,
        }));
        scheduleFetchComandas(Order);
    }, [Order, scheduleFetchComandas]);

    useEffect(() => () => clearCobroLongPress(), [clearCobroLongPress]);

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
            setOrderV2(updated);
            if (hasItems) {
              scheduleFetchComandas(updated);
            }
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
          .then((data) => {
            setOrderV2(data);
            setOrder((prev) => ({
              ...prev,
              pagos: data.pagos ?? [],
              pagado: data.pagado ?? sumPagosMonto(data.pagos),
              pendiente: data.pendiente,
            }));
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

    // ==== UI helpers para resumen de cobro (barra de progreso) ====
    const totalOrden = liveTotal || Order?.CuentaTotal || 0;
    const pagadoActual = realPagado;
    const percentPaid = totalOrden > 0
      ? Math.min(100, Math.max(0, (pagadoActual / totalOrden) * 100))
      : (isFullyPaid ? 100 : 0);

    const totalCobradoHistorial = realPagado;

    const handleSelectAllItems = () => {
      setItemsSeleccionadosPago(new Set(unpaidComandas.map((c) => c.ComandaId)));
    };

    const sortedVisibleComandas = useMemo(() => sortComandasForDisplay(
        comandas.filter((c) => c.ComandaPrepStatus !== 'ReadyToServe' || expandedComandas.includes(c.ComandaId)),
    ), [comandas, expandedComandas]);

    // Verificación de seguridad: si Order no existe o fue eliminada, no renderizar
    if (!Order || !Order.OrderID) {
      return null;
    }

    const renderComandaCard = (comanda) => (
        galleryLayout ? (
            <div className="mesero-order-panel__comanda-cell">
                <div className="mesero-order-panel__comanda-scroll">
                    <MeseroComandaSlot
                        order={Order}
                        modeInterface={modeInterface}
                        Comanda={comanda}
                        updateComanda={updateComanda}
                        removeComanda={removeComanda}
                        onBubbleToggle={handleBubbleToggle}
                        enableFullscreenFab={galleryLayout}
                    />
                </div>
            </div>
        ) : (
            <MeseroComandaSlot
                order={Order}
                modeInterface={modeInterface}
                Comanda={comanda}
                updateComanda={updateComanda}
                removeComanda={removeComanda}
                onBubbleToggle={handleBubbleToggle}
                enableFullscreenFab={galleryLayout}
            />
        )
    );

    const comandaCards = sortedVisibleComandas.map((comanda, index) => {
        const prev = sortedVisibleComandas[index - 1];
        const showGroupDivider = galleryLayout
            && index > 0
            && isComandaInEditingMode(prev)
            && !isComandaInEditingMode(comanda);

        return (
            <React.Fragment key={comanda.ComandaId}>
                {showGroupDivider && (
                    <div className="mesero-order-panel__comanda-group-divider" aria-hidden="true" />
                )}
                {renderComandaCard(comanda)}
            </React.Fragment>
        );
    });

    return (
        <>
        <div className={`card${galleryLayout ? ' mesero-order-panel--gallery' : ''}`} style={{backgroundColor: colorOrder}}>
            {!galleryLayout && (
                <MeseroCustomerField order={Order} onOrderUpdated={setOrder} />
            )}

            <div className="row">
                {!galleryLayout && (
                <div className="col-2 d-flex align-items-center justify-content-center pe-0">
                    <div className="toggleArrowButtons">
                        <button style={{backgroundColor:  toggleArrowStatus ? "#ffffff" : "#7ed65b"}} onClick={() => setToggleArrowStatus(!toggleArrowStatus)}>
                            <FontAwesomeIcon style={{color: toggleArrowStatus ? "#5d5d5d" : "#ffffff"}} icon={toggleArrowStatus ? faAngleUp : faAngleDown} size="2x" />
                        </button>
                    </div>
                </div>
                )}
                <div className={`${galleryLayout ? 'col-5' : 'col-4'} d-flex align-items-center orderNum ps-0 pe-0`}>
                    <div className="orderNumText">{`Pedido: ${Order.OrderID}`}</div>
                </div>
                <div className={`${galleryLayout ? 'col-7' : 'col-6'} d-flex align-items-center orderTotal ps-0`}>
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
                    <button
                        type="button"
                        style={{ marginRight: '8px' }}
                        title="Cobro parcial (mantén presionado para editar JSON)"
                        onPointerDown={handleCobroPressStart}
                        onPointerUp={handleCobroPressEnd}
                        onPointerLeave={handleCobroPressEnd}
                        onPointerCancel={handleCobroPressEnd}
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={handleCobroClick}
                    >
                        <FontAwesomeIcon icon={faHandHoldingUsd} size='2x' />
                    </button>
                    <button onClick={handleOrderCustStatusButton}> {/* Will allow change Paid Prep and Cust Status */}
                        <FontAwesomeIcon icon={faCashRegister} size='2x' />
                    </button>
                </div>
            </div>
            {modeInterface && isEmptyOrder && !comandasLoading && (
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
            {(galleryLayout || toggleArrowStatus) && (
            <div className={galleryLayout ? 'mesero-order-panel__body' : ''}>
                {galleryLayout && comandasLoading ? (
                    <div className="mesero-order-panel__comandas-loading" role="status" aria-live="polite">
                        <span className="mesero-order-panel__comandas-spinner" aria-hidden="true" />
                        <span className="mesero-order-panel__comandas-loading-label">Cargando comandas…</span>
                    </div>
                ) : (
                <>
                {modeInterface && !galleryLayout && (
                    <MeseroPlatilloSelector
                        addPlatilloToOrder={addPlatillosToOrder}
                        platillos={platillos}
                    />
                )}
                {/* Burbujas para comandas ReadyToServe no expandidas */}
                <div ref={bubblesContainerRef} className="bubbles-container">
                    {comandas
                        .filter(c => c.ComandaPrepStatus === 'ReadyToServe' && !expandedComandas.includes(c.ComandaId))
                        .map(c => (
                            <div
                                key={c.ComandaId}
                                className="comanda-bubble"
                                onClick={() => handleBubbleToggle(c.ComandaId)}
                            >
                                <img
                                    src={c.Imagen}
                                    alt={c.Platillo}
                                    className="comanda-bubble__img"
                                />
                            </div>
                        ))}
                </div>
                {/* Tarjetas para comandas no ReadyToServe o expandidas */}
                {galleryLayout ? (
                    <div ref={comandasGridRef} className="mesero-order-panel__comandas-track">
                        <div className="mesero-order-panel__comandas-grid">
                            {comandaCards}
                        </div>
                    </div>
                ) : (
                    comandaCards
                )}
                </>
                )}
            </div>
            )}
        </div>
        {/* Cobro Parcial Modal */}
        {modalPagoVisible && createPortal(
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
                {(computedPending > 0 || unpaidComandas.length > 0) && (
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
                    {hasMontoPagoHistorial && unpaidComandas.length > 0 && (
                      <div className='mb-3 text-sm text-gray-600'>
                        Hay cobros previos por <b>monto</b>. Los platillos ya cubiertos no aparecen abajo; puedes cobrar los pendientes por ítem o por monto.
                      </div>
                    )}

                    <div className='flex justify-end mb-2'>
                      {unpaidComandas.length > 0 && !hasMontoEnSesion && (
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
                      {unpaidComandas.length === 0 ? (
                        <div className='text-sm text-gray-600 py-2'>
                          Todos los platillos actuales están cubiertos por cobros anteriores.
                        </div>
                      ) : unpaidComandas.map(c => (
                        <div key={c.ComandaId} className='relative'>
                          <input
                            type='checkbox'
                            id={`chk_${c.ComandaId}`}
                            className='item-checkbox'
                            disabled={hasMontoEnSesion}
                            checked={itemsSeleccionadosPago.has(c.ComandaId)}
                            onChange={e => {
                              if (hasMontoEnSesion) return;
                              const s = new Set(itemsSeleccionadosPago);
                              e.target.checked ? s.add(c.ComandaId) : s.delete(c.ComandaId);
                              setItemsSeleccionadosPago(s);
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
                          max={Math.max(0, computedPending)}
                          min='0'
                          step='0.01'
                          value={montoEspecifico}
                          disabled={hasItemsEnSesion}
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
                      {(computedPending > 0 || unpaidComandas.length > 0) && (
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
          </div>,
          document.body
        )}
        {modalCobroJsonVisible && (
            <MeseroCobroJsonModal
                orderId={Order.OrderID}
                liveTotal={liveTotal}
                comandas={comandas}
                onClose={() => setModalCobroJsonVisible(false)}
                onSaved={handleCobroJsonSaved}
                notify={notify}
            />
        )}
        </>
    );
}

export default MeseroOrderPanel;