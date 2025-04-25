import React, { useState, useEffect } from 'react';
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
                fetchOrders();
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
                    fetchOrders();
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
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [monthlyActiveStartDate, setMonthlyActiveStartDate] = useState(new Date());
    const [dailySums, setDailySums] = useState({});

    const handleDoubleClick = () => {
        setShowPasswordModal(true);
    };

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

    // Estado para detectar dispositivo móvil y actualizar al redimensionar
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // useEffect para obtener sumas diarias al cambiar mes en calendario
    useEffect(() => {
        if (showCalendarModal) {
            const fetchSums = async () => {
                const year = monthlyActiveStartDate.getFullYear();
                const month = monthlyActiveStartDate.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const offset = -new Date().getTimezoneOffset() / 60;
                const sums = {};
                for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    try {
                        const res = await ordersApi.getSumByDate(dateStr, offset);
                        sums[dateStr] = res.totalSum;
                    } catch (err) {
                        console.error(err);
                        sums[dateStr] = 0;
                    }
                }
                setDailySums(sums);
            };
            fetchSums();
        }
    }, [monthlyActiveStartDate, showCalendarModal]);

    return (
        <div className="container-fluid" style={{background: (reloadFlag && modeInterface) ? 'linear-gradient(to right, #e0f7fa, #b2ebf2)' : 'none'}}>
            <div className="row">
                <div className="col-4">
                    <div style={{color: '#000000', textAlign:'left'}}>
                        <Counter30To0 handleReloadFlag={handleReloadFlag}/>
                    </div>
                </div>
                <div className="col-8">
                    <h1 style={{ color: "#000000" }} onDoubleClick={handleDoubleClick}>Comandas</h1><ToastContainer />
                    {/* {modeInterface && (
                        <div>
                            <Button variant="primary" onClick={() => setComandasPerScreen(6)}>6</Button>
                            <Button variant="primary" onClick={() => setComandasPerScreen(4)}>4</Button>
                            <Button variant="primary" onClick={() => setComandasPerScreen(3)}>3</Button>
                        </div>
                    )} */}
                </div>
            </div>
            <hr style={{backgroundColor:"white"}}/>
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
                <div className="calendar-modal-overlay" style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="calendar-modal" style={{
                        backgroundColor: '#fff',
                        padding: '20px',
                        borderRadius: '5px',
                        textAlign: 'center'
                    }}>
                        <h2>Ventas diarias</h2>
                        <Calendar
                            onChange={setSelectedDate}
                            value={selectedDate}
                            onActiveStartDateChange={({ activeStartDate }) => setMonthlyActiveStartDate(activeStartDate)}
                            tileContent={({ date, view }) => {
                                if (view === 'month') {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const sum = dailySums[dateStr] !== undefined ? dailySums[dateStr] : null;
                                    return sum !== null ? <div style={{ fontSize: '0.75em', marginTop: '4px' }}>${sum}</div> : null;
                                }
                            }}
                        />
                        <button onClick={() => setShowCalendarModal(false)} style={{ marginTop: '10px' }}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OrdersInterface
