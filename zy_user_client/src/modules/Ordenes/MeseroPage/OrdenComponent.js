import './OrdenComponent.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faTrash, faCashRegister } from '@fortawesome/free-solid-svg-icons';
import PlatilloSelector from './PlatilloSelectorComponent';
import ComandaCard from './ComandaCardComponent'
import comandasApi from './../../../api/comandasApi';
import ordersApi from './../../../api/ordersApi';
import io from 'socket.io-client';
import { faCheck, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

import { ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const socket = io(`${process.env.REACT_APP_API_URL}`);

const Orden = ({modeInterface, iInterface, OrderID, DeleteOrder, handleOrderCustStatus, platillos, numPlatillos, handleOrderClient }) => {
    const notify = (message) => toast(message);
    const [Order, setOrder] = useState({});
    const [comandas, setComandas] = useState([])
    const [toggleArrowStatus, setToggleArrowStatus] = useState(true); // false: plegado, true: desplegado
    const [colorOrder, setColorOrder] = useState("#ffffff")
    const skipNextFetch = useRef(false);
    const [expandedComandas, setExpandedComandas] = useState([]);

    const fetchOrder = () => {
        ordersApi.getOrder(OrderID)
        .then((res) => {
            setOrder(res);
            fetchComandas(res);
        })
        .catch((err) => {
            console.log(err);
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
        if (Order.OrderCustStatus === "Done") {
            setColorOrder("#5d5d5d");
        } else if (Order.OrderCustStatus === "InPlace") {
            setColorOrder("#ffffff");
        }
    }
    
    const updateCuentaTotalOrder = (comandasDB, order) => {
        let cuentaTotal = 0;
        if (comandasDB) {
            comandasDB.forEach((comanda) => {
                cuentaTotal = cuentaTotal + comanda.Precio;
            })
        }
        const newOrder = {...order, CuentaTotal: cuentaTotal};
        ordersApi.updateOrder(newOrder)
        .then(() => {
            console.log("CuentaTotal Actualizada");
            setOrder(newOrder);
        })
        .catch(err => {
            console.log(err);
            notify(`Error al actualizar CuentaTotal de orden: ${err}`);
            // alert("Error al actualizar una comanda");
        });
    }

    const fetchComandas = (order) => {
        comandasApi.getComandasByOrderId(OrderID)
        .then((res) => {
            setComandas(res);
            updateCuentaTotalOrder(res, order);
        })
        .catch((err) => {
            console.log(err);
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
        fetchColorOrder();
        fetchToggleArrowStatus();
    }, [Order])

    const fetchToggleArrowStatus = () => {
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

    const handleCliente = (e) => {
        setCliente(e.target.value);
        setClientIcon(false);
    }

    useEffect(() => {
        const savedCliente = Order.Customer || '';
        console.log("CARGANDO CLIENTE", savedCliente);
        setCliente(savedCliente);
        setClientIcon(savedCliente !== '');
    }, [Order.Customer]);

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
    const savedCliente = Order.Customer || '';
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

    return (
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
                <div className='col-2'>
                    {/* Add Variant at Level 1 */}
                    <div className="form-group">
                        <button type="button" className="btn btn-primary" style={{backgroundColor: iconColor}} onClick={updateCliente}>
                            <FontAwesomeIcon icon={iconType} size="2x" style={{ color: '#fff' }} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-2 d-flex align-items-center">
                    <div className="toggleArrowButtons">
                        <button style={{backgroundColor:  toggleArrowStatus ? "#ffffff" : "#7ed65b"}} onClick={() => setToggleArrowStatus(!toggleArrowStatus)}>
                            <FontAwesomeIcon style={{color: toggleArrowStatus ? "#5d5d5d" : "#ffffff"}} icon={toggleArrowStatus ? faAngleUp : faAngleDown} size="2x" />
                        </button>
                    </div>
                </div>
                <div className="col-5 d-flex align-items-center orderNum">
                    <div className="orderNumText">{`Pedido: ${Order.OrderID}`}</div>
                    <button onClick={() => DeleteOrder(Order.OrderID)}>
                        <FontAwesomeIcon icon={faTrash} size="2x" />
                    </button>
                </div>
                <div className="col-5 d-flex align-items-center orderTotal">
                    <div className="orderTotalText">{`Total: $${Order.CuentaTotal}`}</div>
                    <button onClick={() => handleOrderCustStatusButton(Order)}> {/* Will allow change Paid Prep and Cust Status */}
                        <FontAwesomeIcon icon={faCashRegister} size="2x" />
                    </button>
                </div>
            </div>
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
    )
}

export default Orden;