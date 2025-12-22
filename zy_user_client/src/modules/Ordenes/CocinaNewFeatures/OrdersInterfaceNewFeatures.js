import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import './../MeseroPage/OrdersInterface.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ordersApi from './../../../api/ordersApi';

import OrdenesCocinaNewFeatures from './OrdenesCocinaNewFeatures';

import io from 'socket.io-client';
const socket = io(`${process.env.REACT_APP_API_URL}`);

const OrdersInterfaceNewFeatures = () => {
    const notify = (message) => toast(message);
    const [orders, setOrders] = useState([]);
    const [numOrders, setNumOrders] = useState(0);

    const fetchOrders = () => {
        ordersApi.getOrdersByOrderCustStatus("InPlace")
        .then(data => {
            setOrders(prevOrders => {return (data);});
            setNumOrders(prevNumOrders => {return data.length;});
        })
        .catch(err => {
            console.log(err);
            notify(`Error al cargar las comandas: ${err}`);
        });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { // fetchOrders
        fetchOrders();
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const hacerAlgo = () => {
            fetchOrders();
        };
        const intervalo = setInterval(hacerAlgo, 5000);
        return () => clearInterval(intervalo);
    }, []); // El array vacío asegura que el efecto se ejecute solo una vez al montar el componente

    const renderOrders = () => {
        return (<OrdenesCocinaNewFeatures modeInterface={false} Orders={orders} />)
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { //Socket NewOrder
        socket.on('NuevaOrdenDesdeServidor', (data) => {
            console.log("Mensaje: ", data)
            fetchOrders();
            const audio = new Audio("ComandaAudios/Pedido.wav");
            audio.play();
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

    return (
        <div style={{ height: '100%', overflow: 'hidden' }}>
            {/* ToastContainer siempre visible para notificaciones */}
            <ToastContainer />
            {renderOrders()}
        </div>
    )
}

export default OrdersInterfaceNewFeatures

