import React, { useState, useEffect } from 'react';
import Orden from './OrdenComponent';
import Button from 'react-bootstrap/Button';
import './OrdersInterface.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ordersApi from './../../../api/ordersApi';
import platillosApi from './../../../api/platillosApi';

import OrdenesCocina from './OrdenesCocinaComponent';
import Counter30_to_0 from '../Global/CounterComponent'

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

    useEffect(() => { // fetchOrders
        fetchOrders();
        fetchPlatillos();
    }, []);

    useEffect(() => {
        if (!modeInterface) {
            // Define la función que quieres ejecutar
            const hacerAlgo = () => {
                fetchOrders();
            };
        
            // Crea un intervalo que ejecuta hacerAlgo cada 5 segundos (5000 milisegundos)
            const intervalo = setInterval(hacerAlgo, 5000);
        
            // Limpia el intervalo cuando el componente se desmonta
            // para evitar efectos secundarios no deseados
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
    
    const [TotalDia, setTotalDia] = useState(0);
    useEffect(() => { // Total Dia calculation
        let newTotal = 0;
        for (let order of orders) {
            newTotal += order.CuentaTotal;
        }
        setTotalDia(newTotal);
    },[orders]);

    const SocketNewOrder = () => {
        socket.emit('NuevaOrdenDesdeCliente', {});
    };
    const SocketDeleteOrder = () => {
        socket.emit('OrdenEliminadaDesdeCliente', {});
    };
    const SocketUpdateOrder = (OrderID) => {
        socket.emit('OrdenActualizadaDesdeCliente', {msg: OrderID});
    };
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
    useEffect(() => { // Socket DelOrder
        socket.on('OrdenEliminadaDesdeServidor', (data) => {
            console.log("Mensaje: ", data)
            fetchOrders();
        });

        return () => {
            socket.off('OrdenEliminadaDesdeServidor');
        };
    }, []);
    useEffect(() => { // Socket DelOrder
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

    return (
        <div className="container-fluid" style={{backgroundColor: (reloadFlag && modeInterface) && ('#ff6d6d')}}>
            <div className="row">
                <div className="col-4">
                    <div style={{color: '#fff', textAlign:'left'}}>
                        <Counter30_to_0 handleReloadFlag={handleReloadFlag}/>
                    </div>
                </div>
                <div className="col-8">
                    <h1 style={{ color: "#ffffff" }}>Comandas {modeInterface && `$${TotalDia}`}</h1><ToastContainer />
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
                            <Button variant="success" size="lg" onClick={() => handleSlideChange(slide - 1)}>←</Button>
                        </div>
                        {/* Botón para agregar una nueva comanda */}
                        <div className="col-8">
                            <Button variant="success" size="lg" onClick={handleNewOrderClick}>Nueva Orden</Button>
                        </div>
                        {/* Botón para navegar entre comandas */}
                        <div className="col-2">
                            <Button variant="success" size="lg" onClick={() => handleSlideChange(slide + 1)}>→</Button>
                        </div>
                    </div>
                </div>
            )}
            {renderOrders()}
        </div>
    )
}

export default OrdersInterface
