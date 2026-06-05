import React, { useState, useEffect } from 'react';
import './../Mesero/MeseroOrdersShell.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ordersApi from './../../../api/ordersApi';
import CocinaBebidasDrinksBoard from './CocinaBebidasDrinksBoard';

import io from 'socket.io-client';
const socket = io(`${process.env.REACT_APP_API_URL}`);

const CocinaBebidasOrdersShell = () => {
    const notify = (message) => toast(message);
    const [orders, setOrders] = useState([]);

    const fetchOrders = () => {
        ordersApi.getOrdersByOrderCustStatus("InPlace")
        .then(data => {
            setOrders(data);
        })
        .catch(err => {
            console.log(err);
            notify(`Error al cargar las comandas: ${err}`);
        });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchOrders();
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const intervalo = setInterval(fetchOrders, 5000);
        return () => clearInterval(intervalo);
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        socket.on('NuevaComandaDesdeServidor', () => fetchOrders());
        socket.on('UpdateComandaDesdeServidor', () => fetchOrders());
        socket.on('DeleteComandaDesdeServidor', () => fetchOrders());
        socket.on('OrdenActualizadaDesdeServidor', () => fetchOrders());

        return () => {
            socket.off('NuevaComandaDesdeServidor');
            socket.off('UpdateComandaDesdeServidor');
            socket.off('DeleteComandaDesdeServidor');
            socket.off('OrdenActualizadaDesdeServidor');
        };
    }, []);

    return (
        <div style={{ height: '100%', overflow: 'hidden' }}>
            <ToastContainer />
            <CocinaBebidasDrinksBoard Orders={orders} />
        </div>
    );
};

export default CocinaBebidasOrdersShell;
