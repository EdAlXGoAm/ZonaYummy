import './MeseroCustomerField.css';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faFloppyDisk, faGear } from '@fortawesome/free-solid-svg-icons';
import ordersApi from './../../../api/ordersApi';
import io from 'socket.io-client';
import MeseroOrigenModal from './MeseroOrigenModal';
import { getOrigenSummary } from './meseroOrigenUtils';

const socket = io(`${process.env.REACT_APP_API_URL}`);

const CUSTOMER_COLORS = ['#ff5382', '#39c5ff', '#ec1cff', '#80ff10', '#fbdd31'];
const getCustomerBgColor = (id) => CUSTOMER_COLORS[id % CUSTOMER_COLORS.length];

const MeseroCustomerField = ({ order, onOrderUpdated, compact = false }) => {
    const [cliente, setCliente] = useState('');
    const [clientIcon, setClientIcon] = useState(false);
    const [origenModalOpen, setOrigenModalOpen] = useState(false);
    const [origenSaving, setOrigenSaving] = useState(false);

    useEffect(() => {
        if (!order?.OrderID) return;
        const savedCliente = order.Customer || '';
        setCliente(savedCliente);
        setClientIcon(savedCliente !== '');
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

    const handleOrigenSave = (nextOrigen) => {
        setOrigenSaving(true);
        const newOrder = { ...order, Origen: nextOrigen };
        ordersApi.updateOrder(newOrder)
            .then(() => {
                onOrderUpdated?.(newOrder);
                socket.emit('OrdenActualizadaDesdeCliente', { msg: order.OrderID });
                setOrigenModalOpen(false);
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setOrigenSaving(false);
            });
    };

    return (
        <>
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
                    <button
                        type="button"
                        className="mesero-customer-field__settings-btn"
                        onClick={() => setOrigenModalOpen(true)}
                        title={`Origen: ${getOrigenSummary(order.Origen)} (clic para editar)`}
                        aria-label="Ajustes de origen del pedido"
                    >
                        <FontAwesomeIcon
                            icon={faGear}
                            className="mesero-customer-field__settings-icon"
                            size={compact ? 'lg' : 'xl'}
                        />
                    </button>
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
            {origenModalOpen && (
                <MeseroOrigenModal
                    order={order}
                    onClose={() => setOrigenModalOpen(false)}
                    onSave={handleOrigenSave}
                    saving={origenSaving}
                />
            )}
        </>
    );
};

export default MeseroCustomerField;
