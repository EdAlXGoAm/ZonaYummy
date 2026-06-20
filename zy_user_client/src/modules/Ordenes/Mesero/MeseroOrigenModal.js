import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TwoOptionSwitch } from './two_option_switch/TwoOptionSwitch';
import {
    CHANNEL_MOSTRADOR,
    CHANNEL_WHATSAPP,
    FULFILLMENT_DOMICILIO,
    FULFILLMENT_MOSTRADOR,
    formatOrigen,
    getOrigenSummary,
    parseOrigen,
} from './meseroOrigenUtils';
import './MeseroOrigenModal.css';

const MeseroOrigenModal = ({
    order,
    onClose,
    onSave,
    saving = false,
}) => {
    const [channel, setChannel] = useState(CHANNEL_MOSTRADOR);
    const [fulfillment, setFulfillment] = useState(FULFILLMENT_MOSTRADOR);

    useEffect(() => {
        const parsed = parseOrigen(order?.Origen);
        setChannel(parsed.channel);
        setFulfillment(parsed.fulfillment);
    }, [order?.OrderID, order?.Origen]);

    const handleSave = () => {
        onSave?.(formatOrigen({ channel, fulfillment }));
    };

    const previewOrigen = formatOrigen({ channel, fulfillment });

    return createPortal(
        <div
            className="mesero-origen-modal-fondo"
            role="presentation"
            onClick={onClose}
        >
            <div
                className="mesero-origen-modal"
                role="dialog"
                aria-labelledby="mesero-origen-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mesero-origen-modal__header">
                    <h3 id="mesero-origen-modal-title">
                        Origen del pedido · #{order?.OrderID}
                    </h3>
                    <button
                        type="button"
                        className="mesero-origen-modal__close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <div className="mesero-origen-modal__body">
                    <div className="mesero-origen-modal__section">
                        <span className="mesero-origen-modal__label">Canal</span>
                        <TwoOptionSwitch
                            value={channel === CHANNEL_WHATSAPP ? 'right' : 'left'}
                            onChange={(side) => {
                                setChannel(side === 'right' ? CHANNEL_WHATSAPP : CHANNEL_MOSTRADOR);
                            }}
                            leftLabel="Mostrador"
                            rightLabel="WhatsApp"
                            ariaLabel="Canal del pedido"
                            className="mesero-origen-modal__switch"
                        />
                    </div>

                    <div className="mesero-origen-modal__section">
                        <span className="mesero-origen-modal__label">Entrega</span>
                        <TwoOptionSwitch
                            value={fulfillment === FULFILLMENT_DOMICILIO ? 'right' : 'left'}
                            onChange={(side) => {
                                setFulfillment(side === 'right'
                                    ? FULFILLMENT_DOMICILIO
                                    : FULFILLMENT_MOSTRADOR);
                            }}
                            leftLabel="Recoger en mostrador"
                            rightLabel="Envío a domicilio"
                            ariaLabel="Tipo de entrega"
                            className="mesero-origen-modal__switch"
                        />
                    </div>

                    <p className="mesero-origen-modal__summary">
                        {getOrigenSummary(previewOrigen)}
                    </p>
                    <p className="mesero-origen-modal__code">
                        Se guardará como <code>{previewOrigen}</code>
                    </p>
                </div>

                <div className="mesero-origen-modal__actions">
                    <button
                        type="button"
                        className="mesero-origen-modal__btn mesero-origen-modal__btn--ghost"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="mesero-origen-modal__btn mesero-origen-modal__btn--primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default MeseroOrigenModal;
