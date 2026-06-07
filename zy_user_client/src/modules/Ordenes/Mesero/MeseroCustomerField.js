import './MeseroCustomerField.css';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import ordersApi from './../../../api/ordersApi';
import io from 'socket.io-client';

const socket = io(`${process.env.REACT_APP_API_URL}`);

const CUSTOMER_COLORS = ['#ff5382', '#39c5ff', '#ec1cff', '#80ff10', '#fbdd31'];
const getCustomerBgColor = (id) => CUSTOMER_COLORS[id % CUSTOMER_COLORS.length];

const MeseroCustomerField = ({ order, onOrderUpdated, compact = false }) => {
    const [cliente, setCliente] = useState('');
    const [clientIcon, setClientIcon] = useState(false);
    const [origenWhatsapp, setOrigenWhatsapp] = useState(false);

    useEffect(() => {
        if (!order?.OrderID) return;
        const savedCliente = order.Customer || '';
        setCliente(savedCliente);
        setClientIcon(savedCliente !== '');
        setOrigenWhatsapp(order.Origen === 'Whatsapp');
    }, [order?.OrderID, order?.Customer, order?.Origen]);

    if (!order?.OrderID) {
        return null;
    }

    const savedCliente = order.Customer || '';
    const isEditing = cliente !== savedCliente;
    const iconType = clientIcon ? faCheck : faFloppyDisk;
    let iconColor;
    if (clientIcon) {
        iconColor = '#28a745';
    } else if (isEditing && cliente !== '') {
        iconColor = '#007bff';
    } else {
        iconColor = '#dc3545';
    }

    const handleCliente = (e) => {
        setCliente(e.target.value);
        setClientIcon(false);
    };

    const updateCliente = () => {
        const trimmedCustomer = cliente.trim();
        setCliente(trimmedCustomer);
        const newOrder = { ...order, Customer: trimmedCustomer };
        ordersApi.updateOrder(newOrder)
            .then(() => {
                setClientIcon(trimmedCustomer !== '');
                onOrderUpdated?.(newOrder);
                socket.emit('OrdenActualizadaDesdeCliente', { msg: order.OrderID });
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleWhatsappDoubleClick = () => {
        const newOrigen = !origenWhatsapp;
        setOrigenWhatsapp(newOrigen);
        const newOrder = { ...order, Origen: newOrigen ? 'Whatsapp' : '' };
        ordersApi.updateOrder(newOrder)
            .then(() => {
                onOrderUpdated?.(newOrder);
                socket.emit('OrdenActualizadaDesdeCliente', { msg: order.OrderID });
            })
            .catch((err) => {
                console.log(err);
            });
    };

    return (
        <div className={`mesero-customer-field${compact ? ' mesero-customer-field--compact' : ''}`}>
            <textarea
                className="form-control mesero-customer-field__input"
                id={`textAreaClient_${order.OrderID}`}
                rows="1"
                placeholder="Cliente"
                onChange={handleCliente}
                value={cliente}
                style={{
                    backgroundColor: getCustomerBgColor(order.OrderID),
                    color: '#000',
                    fontWeight: 'bold',
                    textShadow: '-0.2px -0.2px 0 #000, 0.2px -0.2px 0 #000, -0.2px 0.2px 0 #000, 0.2px 0.2px 0 #000',
                }}
            />
            <div className="mesero-customer-field__actions">
                <img
                    src="icons/whatsapp.png"
                    alt="WhatsApp"
                    className="mesero-customer-field__whatsapp"
                    onDoubleClick={handleWhatsappDoubleClick}
                    style={{
                        opacity: origenWhatsapp ? 1 : 0.3,
                        filter: origenWhatsapp ? 'none' : 'grayscale(50%)',
                    }}
                    title={origenWhatsapp ? 'Origen: WhatsApp (doble click para quitar)' : 'Doble click para marcar como WhatsApp'}
                />
                <button
                    type="button"
                    className={`btn btn-primary mesero-customer-field__save${compact ? ' mesero-customer-field__save--compact' : ''}`}
                    style={{ backgroundColor: iconColor }}
                    onClick={updateCliente}
                >
                    <FontAwesomeIcon icon={iconType} style={{ color: '#fff' }} size={compact ? 'lg' : '2x'} />
                </button>
            </div>
        </div>
    );
};

export default MeseroCustomerField;
