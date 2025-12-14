import React, { useState, useEffect, useRef } from 'react';
import Orden from './OrdenComponent';
import Button from 'react-bootstrap/Button';
import './OrdersInterface.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ordersApi from './../../../api/ordersApi';
import platillosApi from './../../../api/platillosApi';

import OrdenesCocina from './OrdenesCocinaComponent';
import Counter30To0 from '../Global/CounterComponent';
import Calendar from 'react-calendar/dist/esm/Calendar.js';
import 'react-calendar/dist/Calendar.css';

import io from 'socket.io-client';
const socket = io(`${process.env.REACT_APP_API_URL}`);

const OrdersInterface = ({ modeInterface }) => {
    const notify = (message) => toast(message);
    const bodyScrollLockRef = useRef({ overflow: '', paddingRight: '' });
    const [orders, setOrders] = useState([]);
    const [numOrders, setNumOrders] = useState(0);
    const [platillos, setPlatillos] = useState([]);
    const [numPlatillos, setNumPlatillos] = useState(0);
    const fetchOrders = () => {
        if (modeInterface) {
            let orders = [];
            ordersApi.getOrdersByOrderCustStatus("Done")
            .then(data => {
                orders = [...orders, ...data];
                ordersApi.getOrdersByOrderCustStatus("InPlace")
                .then(data2 => {
                    orders = [...orders, ...data2];
                    setOrders(prevOrders => {return (orders);});
                    setNumOrders(prevNumOrders => {return orders.length;});
                })
                .catch(err => {
                    console.log(err);
                    notify(`Error al cargar las comandas: ${err}`);
                    // alert("Error al cargar las comandas");
                });
            })
            .catch(err => {
                console.log(err);
                notify(`Error al cargar las comandas: ${err}`);
                // alert("Error al cargar las comandas");
            });
        }
        else {
            ordersApi.getOrdersByOrderCustStatus("InPlace")
            .then(data => {
                if (data.length <= 3) {
                    setComandasPerScreen(3);
                }
                else if (data.length === 4) {
                    setComandasPerScreen(4);
                }
                else if (data.length > 4) {
                    setComandasPerScreen(6);
                }
                setOrders(prevOrders => {return (data);});
                setNumOrders(prevNumOrders => {return data.length;});
            })
            .catch(err => {
                console.log(err);
                notify(`Error al cargar las comandas: ${err}`);
                // alert("Error al cargar las comandas");
            });
        }
    };
    
    const fetchPlatillos = () => {
        platillosApi.getPlatillos()
        .then(data => {
            setPlatillos(prevPlatillos => {return (data);});
            setNumPlatillos(prevNumPlatillos => {return data.length;});
        })
        .catch(err => {
            console.log(err);
            notify(`Error al cargar las comandas: ${err}`);
            // alert("Error al cargar las comandas");
        });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { // fetchOrders
        fetchOrders();
        fetchPlatillos();
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!modeInterface) {
            const hacerAlgo = () => {
                fetchOrders();
            };
            const intervalo = setInterval(hacerAlgo, 5000);
            return () => clearInterval(intervalo);
        }
    }, []); // El array vacío asegura que el efecto se ejecute solo una vez al montar el componente

    const [ComandasPerScreen, setComandasPerScreen] = useState(3);
    const [slide, setSlide] = useState(1);
    const handleSlideChange = (newSlide) => {
        const maxSlide = numOrders;
        if (newSlide > 0 && newSlide <= maxSlide) {
            setSlide(prevSlide => {return(newSlide);})
        }
    };
    
    const handleOrderCustStatus = (OrderID, Status) => {
        const newOrder = {...orders.find(order => order.OrderID === OrderID)}
        newOrder.OrderCustStatus = Status;
        ordersApi.updateOrder(newOrder)
        .then(() => {
            fetchOrders();
            SocketUpdateOrder(OrderID);
        })
        .catch(err => {
            console.log(err);
            notify(`Error al actualizar una comanda: ${err}`);
            // alert("Error al actualizar una comanda");
        });
    }
    const renderOrders = () => {
        const OrdersArray = [];
        if (modeInterface) {
            const start = (numOrders - (slide - 1));
            const end = Math.max((numOrders - (slide + (modeInterface ? 100 : ComandasPerScreen) - 1)), 0);
            for (let i = start - 1; i >= end; i--) {
                let iInterfaceFlag = false;
                if (i === start - 1) {
                    iInterfaceFlag = true
                }
                OrdersArray.push(
                <div key={orders[i].OrderID} className={`col-xl-${12/ComandasPerScreen} d-flex justify-content-center`}>
                    <Orden modeInterface={modeInterface} iInterface={iInterfaceFlag} OrderID={orders[i].OrderID}
                    DeleteOrder={handleDeleteOrder}
                    handleOrderCustStatus={handleOrderCustStatus}
                    platillos={platillos}
                    numPlatillos={numPlatillos}
                    />
                </div>
                )
            }
            return (
                <div class="row">
                    {OrdersArray}
                </div>
                );
        }
        else {
            return (<OrdenesCocina modeInterface={modeInterface} Orders={orders} />)
        }
    };

    const handleNewOrderClick = () => {
        ordersApi.getLastOrderID()
        .then(data => {
            const newOrderId = data + 1;
            let newOrder = {
                OrderID: newOrderId,
                OrderPaidStatus: "Pending", // Partial-Paid
                OrderPrepStatus: "Preparing", // Served-Done
                OrderCustStatus: "InPlace", // BeBack-Done
                Customer: "",
                CuentaTotal: 0,
                ComandasList: []
            };
            ordersApi.addOrder(newOrder)
            .then(() => {
                setOrders(prevOrders => [...prevOrders, newOrder]);
                setNumOrders(prevNumOrders => prevNumOrders + 1);
                SocketNewOrder();
                const audio = new Audio("ComandaAudios/Pedido.wav");
                audio.play();
            })
            .catch(err => {
                console.log(err);
                notify(`Error al agregar una nueva comanda: ${err}`);
                // alert("Error al agregar una nueva comanda");
            });
        })
        .catch(err => {
            console.log(err);
            notify(`Error  de comunicación con la base de datos para 'Ordenes': ${err}`);
            // alert("Error de comunicación con la base de datos para 'Ordenes'");
        });
    };
    const handleDeleteOrder = (OrderID) => {
        const confirm = window.confirm("Eliminar Platillo");
            if (confirm) {
                ordersApi.deleteOrder(OrderID)
                .then(() => {
                    setOrders(prevOrders => prevOrders.filter(order => order.OrderID !== OrderID));
                    setNumOrders(prevNumOrders => prevNumOrders - 1);
                    SocketDeleteOrder();
                })
                .catch(err => {
                    console.log(err);
                    notify(`Error al eliminar una comanda: ${err}`);
                    // alert("Error al eliminar una comanda");
                });
            }
    };
    
    const SocketNewOrder = () => {
        socket.emit('NuevaOrdenDesdeCliente', {});
    };
    const SocketDeleteOrder = () => {
        socket.emit('OrdenEliminadaDesdeCliente', {});
    };
    const SocketUpdateOrder = (OrderID) => {
        socket.emit('OrdenActualizadaDesdeCliente', {msg: OrderID});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { //Socket NewOrder
        socket.on('NuevaOrdenDesdeServidor', (data) => {
            console.log("Mensaje: ", data)
            fetchOrders();
            if (!modeInterface) {
                const audio = new Audio("ComandaAudios/Pedido.wav");
                audio.play();
            }
        });

        return () => {
            socket.off('NuevaOrdenDesdeServidor');
        };
    }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { // Socket DelOrder
        socket.on('OrdenEliminadaDesdeServidor', (data) => {
            console.log("Mensaje: ", data)
            fetchOrders();
        });

        return () => {
            socket.off('OrdenEliminadaDesdeServidor');
        };
    }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { // Socket Actualizada
        socket.on('OrdenActualizadaDesdeServidor', (data) => {
            console.log("OrdenActualizadaDesdeServidor Mensaje: ", data)
            fetchOrders();
        });

        return () => {
            socket.off('OrdenActualizadaDesdeServidor');
        };
    }, []);

    const [reloadFlag, setReloadFlag] = useState(false);

    const handleReloadFlag = () => {
        setReloadFlag(true);
    }

    // NUEVA FUNCIONALIDAD: Estados y funciones para el input de password
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const passwordInputRef = useRef(null);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [monthlyActiveStartDate, setMonthlyActiveStartDate] = useState(new Date());
    const [dailySums, setDailySums] = useState({});
    const [sumsLoading, setSumsLoading] = useState(false);
    const [sumsProgress, setSumsProgress] = useState({ done: 0, total: 0 });
    const [dailySalesRows, setDailySalesRows] = useState([]); // [{ date, cash, card, transfer, total }]
    const [itemCountsLoading, setItemCountsLoading] = useState(false);
    const [itemCounts, setItemCounts] = useState([]); // [{ platillo, variante, qty }]
    const [calendarTab, setCalendarTab] = useState('cashier'); // 'cashier' | 'items'
    const [showDayPickerModal, setShowDayPickerModal] = useState(false);
    const [expandedItems, setExpandedItems] = useState(() => new Set()); // Set<string> platillo

    // Agrupar por semana con inicio en miércoles
    const getWeekStartWednesday = (dateStr) => {
        // dateStr: 'YYYY-MM-DD'
        const d = new Date(`${dateStr}T00:00:00Z`);
        const dow = d.getUTCDay(); // 0..6 (Dom..Sáb)
        const WED = 3;
        const diff = (dow - WED + 7) % 7;
        const start = new Date(d);
        start.setUTCDate(d.getUTCDate() - diff);
        return start.toISOString().slice(0, 10);
    };
    const addDays = (dateStr, days) => {
        const d = new Date(`${dateStr}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().slice(0, 10);
    };
    const weeklyGroups = (() => {
        const map = new Map(); // weekStart -> group
        for (const r of dailySalesRows) {
            const ws = getWeekStartWednesday(r.date);
            if (!map.has(ws)) {
                map.set(ws, {
                    weekStart: ws,
                    weekEnd: addDays(ws, 6), // Mié..Mar
                    rows: [],
                    totals: { cash: 0, card: 0, transfer: 0, total: 0 }
                });
            }
            const g = map.get(ws);
            g.rows.push(r);
            g.totals.cash += r.cash || 0;
            g.totals.card += r.card || 0;
            g.totals.transfer += r.transfer || 0;
            g.totals.total += r.total || 0;
        }
        // ordenar grupos por semana más reciente -> más antigua
        const groups = Array.from(map.values()).sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
        // y dentro de cada grupo, días más recientes -> más antiguos
        groups.forEach(g => g.rows.sort((a, b) => (a.date < b.date ? 1 : -1)));
        return groups;
    })();

    const formatShortDateEs = (dateStr) => {
        // dateStr: YYYY-MM-DD -> "13-Dic"
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const [y, m, d] = (dateStr || '').split('-').map(n => parseInt(n, 10));
        if (!y || !m || !d) return dateStr;
        return `${d}-${months[m - 1]}`;
    };

    // Evita problemas de UTC (toISOString) que pueden mover el día (ej. "mañana")
    const toLocalYMD = (dt) => {
        const d = dt instanceof Date ? dt : new Date(dt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const groupedItemCounts = (() => {
        const map = new Map(); // platillo -> { platillo, totalQty, variants: Map(variante -> qty) }
        for (const it of itemCounts) {
            const platillo = it?.platillo || '';
            const variante = it?.variante || '';
            const qty = it?.qty || 0;
            if (!map.has(platillo)) map.set(platillo, { platillo, totalQty: 0, variants: new Map() });
            const g = map.get(platillo);
            g.totalQty += qty;
            g.variants.set(variante, (g.variants.get(variante) || 0) + qty);
        }
        return Array.from(map.values())
            .sort((a, b) => (b.totalQty - a.totalQty))
            .map(g => ({
                platillo: g.platillo,
                totalQty: g.totalQty,
                variants: Array.from(g.variants.entries())
                    .map(([variante, qty]) => ({ variante, qty }))
                    .sort((a, b) => b.qty - a.qty)
            }));
    })();

    const handleDoubleClick = () => {
        setShowPasswordModal(true);
    };

    // Enfocar automáticamente el input al abrir el modal
    useEffect(() => {
        if (showPasswordModal) {
            // Espera a que el input exista en el DOM
            setTimeout(() => {
                passwordInputRef.current?.focus();
                passwordInputRef.current?.select?.();
            }, 0);
        }
    }, [showPasswordModal]);

    const handlePasswordAccept = () => {
        if (passwordInput === "2on4") {
            // Mostrar modal de calendario de ventas
            setShowCalendarModal(true);
            setSelectedDate(new Date());
            setMonthlyActiveStartDate(new Date());
        }
        setShowPasswordModal(false);
        setPasswordInput("");
    };

    const handlePasswordCancel = () => {
        setShowPasswordModal(false);
        setPasswordInput("");
    };

    const closeCalendarModal = () => {
        setShowCalendarModal(false);
        setSumsLoading(false);
        setSumsProgress({ done: 0, total: 0 });
        setDailySalesRows([]);
        setItemCounts([]);
        setItemCountsLoading(false);
        setCalendarTab('cashier');
        setShowDayPickerModal(false);
        setExpandedItems(new Set());
    };

    // Evitar "scroll chaining" hacia la pantalla principal cuando el modal llega a su límite
    useEffect(() => {
        const anyModalOpen = showCalendarModal || showPasswordModal || showDayPickerModal;
        if (anyModalOpen) {
            // Guardar estado previo solo la primera vez que bloqueamos
            if (document.body.style.overflow !== 'hidden') {
                bodyScrollLockRef.current = {
                    overflow: document.body.style.overflow || '',
                    paddingRight: document.body.style.paddingRight || ''
                };
            }
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }
            return;
        }

        // Restaurar
        document.body.style.overflow = bodyScrollLockRef.current.overflow;
        document.body.style.paddingRight = bodyScrollLockRef.current.paddingRight;
    }, [showCalendarModal, showPasswordModal, showDayPickerModal]);

    // Estado para detectar dispositivo móvil y actualizar al redimensionar
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // useEffect para obtener sumas diarias al cambiar mes en calendario
    useEffect(() => {
        if (!showCalendarModal) return;
        let cancelled = false;

            const fetchSums = async () => {
                const year = monthlyActiveStartDate.getFullYear();
                const month = monthlyActiveStartDate.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const offset = -new Date().getTimezoneOffset() / 60;

            setSumsLoading(true);
            setSumsProgress({ done: 0, total: daysInMonth });
            setDailySums({});
            setDailySalesRows([]);

                const sums = {};
            const rows = [];

                for (let d = 1; d <= daysInMonth; d++) {
                if (cancelled) return;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    try {
                    const res = await ordersApi.getSumByDateV2Breakdown(dateStr, offset);
                    const total = res?.total || 0;
                    sums[dateStr] = total;
                    if (total > 0) {
                        rows.push({
                            date: res.date || dateStr,
                            cash: res.cash || 0,
                            card: res.card || 0,
                            transfer: res.transfer || 0,
                            total
                        });
                    }
                    } catch (err) {
                        console.error(err);
                        sums[dateStr] = 0;
                } finally {
                    if (!cancelled) {
                        setSumsProgress(prev => ({ done: prev.done + 1, total: daysInMonth }));
                    }
                }
            }

            if (!cancelled) {
                setDailySums(sums);
                // Más reciente -> más antiguo
                rows.sort((a, b) => (a.date < b.date ? 1 : -1));
                setDailySalesRows(rows);
                setSumsLoading(false);
            }
            };

            fetchSums();
        return () => { cancelled = true; };
    }, [monthlyActiveStartDate, showCalendarModal]);

    // Debajo del calendario: conteo de platillos/variantes del día seleccionado
    useEffect(() => {
        if (!showCalendarModal) return;
        let cancelled = false;

        const fetchCounts = async () => {
            try {
                setItemCountsLoading(true);
                const offset = -new Date().getTimezoneOffset() / 60;
                const dateStr = toLocalYMD(selectedDate);
                const res = await ordersApi.getItemCountsByDate(dateStr, offset);
                if (!cancelled) setItemCounts(res?.items || []);
            } catch (err) {
                console.error(err);
                if (!cancelled) setItemCounts([]);
            } finally {
                if (!cancelled) setItemCountsLoading(false);
            }
        };

        if (calendarTab === 'items') fetchCounts();
        return () => { cancelled = true; };
    }, [selectedDate, showCalendarModal, calendarTab]);

    return (
        <div className="container-fluid" style={{background: (reloadFlag && modeInterface) ? 'linear-gradient(to right, #e0f7fa, #b2ebf2)' : 'none'}}>
            {/* Header solo visible en vista de mesero */}
            {modeInterface && (
                <>
            <div className="row">
                <div className="col-4">
                    <div style={{color: '#000000', textAlign:'left'}}>
                        <Counter30To0 handleReloadFlag={handleReloadFlag}/>
                    </div>
                </div>
                <div className="col-8">
                    <h1 style={{ color: "#000000" }} onDoubleClick={handleDoubleClick}>Comandas</h1><ToastContainer />
                </div>
            </div>
            <hr style={{backgroundColor:"white"}}/>
                </>
            )}
            {/* ToastContainer siempre visible para notificaciones */}
            {!modeInterface && <ToastContainer />}
            {modeInterface && (
                <div>
                    <div className="row">
                        {/* Botón para navegar entre comandas */}
                        <div className="col-2">
                            <Button variant="success" size="lg" onClick={() => handleSlideChange(slide - 1)} disabled={isMobile}>←</Button>
                        </div>
                        {/* Botón para agregar una nueva comanda */}
                        <div className="col-8">
                            <Button variant="success" size="lg" onClick={handleNewOrderClick}>Nueva Orden</Button>
                        </div>
                        {/* Botón para navegar entre comandas */}
                        <div className="col-2">
                            <Button variant="success" size="lg" onClick={() => handleSlideChange(slide + 1)} disabled={isMobile}>→</Button>
                        </div>
                    </div>
                </div>
            )}
            {renderOrders()}
            {showPasswordModal && (
                <div 
                    className="password-modal-overlay" 
                    style={{
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        backgroundColor: 'rgba(0,0,0,0.5)', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        zIndex: 1000
                    }}
                >
                    <div 
                        className="password-modal" 
                        style={{
                            backgroundColor: '#fff', 
                            padding: '20px', 
                            borderRadius: '5px', 
                            textAlign: 'center'
                        }}
                    >
                        <h2>Ingrese contraseña</h2>
                        <input 
                            ref={passwordInputRef}
                            type="password" 
                            value={passwordInput} 
                            onChange={(e) => setPasswordInput(e.target.value)} 
                            style={{ marginBottom: '10px', width: '100%', padding: '5px' }}
                        />
                        <div>
                            <button onClick={handlePasswordAccept} style={{ marginRight: '10px' }}>Aceptar</button>
                            <button onClick={handlePasswordCancel}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
            {showCalendarModal && (
                <div className="zy-modal-overlay">
                    <div className="zy-modal zy-calendar-modal">
                        <div className="zy-modal__header">
                            <div>
                                <div className="zy-modal__title">Ventas diarias</div>
                                <div className="zy-modal__subtitle">
                                    {monthlyActiveStartDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <button className="zy-modal__close" onClick={closeCalendarModal} title="Cerrar">✕</button>
                        </div>
                        <div className="zy-modal__body">
                            {sumsLoading && (
                                <div className="zy-progress">
                                    <div className="zy-progress__row">
                                        <div className="zy-progress__label">Calculando sumas del mes…</div>
                                        <div className="zy-progress__count">{sumsProgress.done}/{sumsProgress.total}</div>
                                    </div>
                                    <div className="zy-progress__bar">
                                        <div
                                            className="zy-progress__fill"
                                            style={{ width: `${sumsProgress.total > 0 ? Math.round((sumsProgress.done / sumsProgress.total) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="zy-tabs">
                                <button
                                    className={`zy-tab ${calendarTab === 'cashier' ? 'active' : ''}`}
                                    onClick={() => setCalendarTab('cashier')}
                                    type="button"
                                >
                                    Corte de caja
                                </button>
                                <button
                                    className={`zy-tab ${calendarTab === 'items' ? 'active' : ''}`}
                                    onClick={() => setCalendarTab('items')}
                                    type="button"
                                >
                                    Platillos vendidos
                                </button>
                            </div>

                            {calendarTab === 'cashier' && (
                                <div className="zy-sales">
                                    <div className="zy-sales__header">
                                        <div className="zy-sales__title">Resumen por semana (inicio: miércoles)</div>
                                    </div>
                                    <div className="zy-sales__list">
                                        {!sumsLoading && weeklyGroups.length === 0 && (
                                            <div className="zy-sales__empty">No hay ventas en este mes.</div>
                                        )}
                                        {weeklyGroups.map((g) => (
                                            <div key={g.weekStart} className="zy-week">
                                                <div className="zy-week__header">
                                                    <div className="zy-week__left">
                                                        <div className="zy-week__title">Semana</div>
                                                    </div>
                                                    <div className="zy-week__right">
                                                        <div className="zy-week__cols">
                                                            <div className="zy-week__col">💵</div>
                                                            <div className="zy-week__col">💳</div>
                                                            <div className="zy-week__col">📱</div>
                                                            <div className="zy-week__col zy-week__col--total">Σ</div>
                                                        </div>
                                                        <div className="zy-week__totals">
                                                            <div className="zy-week__cell tag--cash">${g.totals.cash.toFixed(2)}</div>
                                                            <div className="zy-week__cell tag--card">${g.totals.card.toFixed(2)}</div>
                                                            <div className="zy-week__cell tag--transfer">${g.totals.transfer.toFixed(2)}</div>
                                                            <div className="zy-week__cell tag--total">${g.totals.total.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {g.rows.map((r) => (
                                                    <div key={r.date} className="zy-week__row">
                                                        <div className="zy-week__date">{formatShortDateEs(r.date)}</div>
                                                        <div className="zy-week__grid">
                                                            <div className="zy-week__cell tag--cash">${(r.cash || 0).toFixed(2)}</div>
                                                            <div className="zy-week__cell tag--card">${(r.card || 0).toFixed(2)}</div>
                                                            <div className="zy-week__cell tag--transfer">${(r.transfer || 0).toFixed(2)}</div>
                                                            <div className="zy-week__cell tag--total">${(r.total || 0).toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {calendarTab === 'cashier' && (
                            <div className={sumsLoading ? 'zy-calendar-disabled' : ''}>
                        <Calendar
                            onChange={setSelectedDate}
                            value={selectedDate}
                            onActiveStartDateChange={({ activeStartDate }) => setMonthlyActiveStartDate(activeStartDate)}
                            tileContent={({ date, view }) => {
                                if (view === 'month') {
                                    const dateStr = toLocalYMD(date);
                                    const sum = dailySums[dateStr] !== undefined ? dailySums[dateStr] : null;
                                    return sum !== null ? <div style={{ fontSize: '0.75em', marginTop: '4px' }}>${sum}</div> : null;
                                }
                            }}
                        />
                            </div>
                            )}

                            {calendarTab === 'items' && (
                                <div className="zy-items">
                                    <div className="zy-items__header">
                                        <div className="zy-items__title">Platillos vendidos</div>
                                        <button
                                            type="button"
                                            className="zy-date-btn"
                                            onClick={() => setShowDayPickerModal(true)}
                                            title="Seleccionar día"
                                        >
                                            {formatShortDateEs(toLocalYMD(selectedDate))} ▾
                                        </button>
                                    </div>
                                    <div className="zy-items__list">
                                        {itemCountsLoading && (
                                            <div className="zy-items__empty">Cargando…</div>
                                        )}
                                        {!itemCountsLoading && groupedItemCounts.length === 0 && (
                                            <div className="zy-items__empty">Sin ventas registradas en este día.</div>
                                        )}
                                        {!itemCountsLoading && groupedItemCounts.map((g, idx) => {
                                            const isOpen = expandedItems.has(g.platillo);
                                            return (
                                                <div key={`${g.platillo}-${idx}`} className="zy-items__group">
                                                    <div className="zy-items__groupHeader">
                                                        <button
                                                            type="button"
                                                            className="zy-items__expandBtn"
                                                            onClick={() => {
                                                                setExpandedItems(prev => {
                                                                    const next = new Set(prev);
                                                                    if (next.has(g.platillo)) next.delete(g.platillo);
                                                                    else next.add(g.platillo);
                                                                    return next;
                                                                });
                                                            }}
                                                            title={isOpen ? 'Contraer' : 'Expandir'}
                                                        >
                                                            {isOpen ? '▾' : '▸'}
                                                        </button>
                                                        <div className="zy-items__groupTitle">{g.platillo}</div>
                                                        <div className="zy-items__qty">x{g.totalQty}</div>
                                                    </div>
                                                    {isOpen && g.variants.map((v, j) => (
                                                        <div key={`${g.platillo}-${v.variante || 'base'}-${j}`} className="zy-items__row">
                                                            <div className="zy-items__name">
                                                                <div className="zy-items__variant zy-items__variant--indented">{v.variante || 'Base'}</div>
                                                            </div>
                                                            <div className="zy-items__qty">x{v.qty}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Modal de selección de día (encima del modal principal) */}
                            {showDayPickerModal && (
                                <div className="zy-modal-overlay zy-modal-overlay--nested">
                                    <div className="zy-modal zy-date-modal">
                                        <div className="zy-modal__header">
                                            <div>
                                                <div className="zy-modal__title">Seleccionar día</div>
                                                <div className="zy-modal__subtitle">
                                                    {toLocalYMD(selectedDate)}
                                                </div>
                                            </div>
                                            <button className="zy-modal__close" onClick={() => setShowDayPickerModal(false)} title="Cerrar">✕</button>
                                        </div>
                                        <div className="zy-modal__body">
                                            <Calendar
                                                onChange={(d) => { setSelectedDate(d); setShowDayPickerModal(false); }}
                                                value={selectedDate}
                                            />
                                        </div>
                                        <div className="zy-modal__footer">
                                            <button className="zy-btn zy-btn--secondary" onClick={() => setShowDayPickerModal(false)}>Cancelar</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="zy-modal__footer">
                            <button className="zy-btn zy-btn--secondary" onClick={closeCalendarModal}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OrdersInterface
