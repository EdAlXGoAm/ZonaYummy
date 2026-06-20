import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import ordersApi from '../../../api/ordersApi';
import MeseroOrderJsonTreeEditor from './MeseroOrderJsonTreeEditor';
import './MeseroOrderJsonModal.css';

const socket = io(`${process.env.REACT_APP_API_URL}`);

const buildOrderSnapshot = (cachedOrder, serverOrder, comandas) => ({
    ...(cachedOrder || {}),
    ...(serverOrder || {}),
    ComandasList: comandas ?? cachedOrder?.ComandasList ?? [],
});

const MeseroOrderJsonModal = ({
    orderId,
    cachedOrder,
    comandas,
    onClose,
    onSaved,
}) => {
    const notify = (message) => toast(message);
    const [orderData, setOrderData] = useState(null);
    const [rawDraft, setRawDraft] = useState('');
    const [viewMode, setViewMode] = useState('tree');
    const [jsonError, setJsonError] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setJsonError('');

        ordersApi.getOrderV2(orderId)
            .then((data) => {
                if (cancelled) return;
                const snapshot = buildOrderSnapshot(cachedOrder, data, comandas);
                setOrderData(snapshot);
                setRawDraft(JSON.stringify(snapshot, null, 2));
            })
            .catch((err) => {
                if (cancelled) return;
                const snapshot = buildOrderSnapshot(cachedOrder, null, comandas);
                setOrderData(snapshot);
                setRawDraft(JSON.stringify(snapshot, null, 2));
                setJsonError(`No se pudo cargar desde el servidor: ${err?.message || String(err)}`);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [orderId, cachedOrder, comandas]);

    const switchToRawView = () => {
        if (orderData) {
            setRawDraft(JSON.stringify(orderData, null, 2));
        }
        setViewMode('raw');
        setJsonError('');
    };

    const switchToTreeView = () => {
        try {
            const parsed = JSON.parse(rawDraft);
            setOrderData(parsed);
            setViewMode('tree');
            setJsonError('');
        } catch (err) {
            setJsonError(`JSON inválido: ${err.message}`);
        }
    };

    const handleSave = async () => {
        let parsedOrder = orderData;

        if (viewMode === 'raw') {
            try {
                parsedOrder = JSON.parse(rawDraft);
            } catch (err) {
                setJsonError(`JSON inválido: ${err.message}`);
                return;
            }
        }

        if (!parsedOrder?.OrderID) {
            setJsonError('El JSON debe incluir "OrderID".');
            return;
        }

        setSaving(true);
        setJsonError('');

        try {
            await ordersApi.updateOrder(parsedOrder);
            socket.emit('OrdenActualizadaDesdeCliente', { msg: parsedOrder.OrderID });
            notify('Orden actualizada desde JSON');
            onSaved?.(parsedOrder);
            onClose();
        } catch (err) {
            const msg = err?.response?.data?.error || err?.message || String(err);
            setJsonError(msg);
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div
            className="mesero-order-json-fondo"
            role="presentation"
            onClick={onClose}
        >
            <div
                className="mesero-order-json-contenedor"
                role="dialog"
                aria-labelledby="mesero-order-json-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mesero-order-json-header">
                    <h3 id="mesero-order-json-title">
                        JSON de orden · #{orderId}
                    </h3>
                    <button
                        type="button"
                        className="mesero-order-json-close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <p className="mesero-order-json-hint">
                    Usa ▾ para colapsar objetos y listas. Origen usa formato{' '}
                    <code>WhatsApp-domicilio</code>, <code>mostrador-mostrador</code>, etc.
                </p>

                {!loading && (
                    <div className="mesero-order-json-view-toggle">
                        <button
                            type="button"
                            className={`mesero-order-json-view-btn${viewMode === 'tree' ? ' mesero-order-json-view-btn--active' : ''}`}
                            onClick={switchToTreeView}
                        >
                            Árbol
                        </button>
                        <button
                            type="button"
                            className={`mesero-order-json-view-btn${viewMode === 'raw' ? ' mesero-order-json-view-btn--active' : ''}`}
                            onClick={switchToRawView}
                        >
                            Texto
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="mesero-order-json-loading">Cargando…</div>
                ) : viewMode === 'tree' && orderData ? (
                    <MeseroOrderJsonTreeEditor
                        key={orderId}
                        value={orderData}
                        onChange={(next) => {
                            setOrderData(next);
                            setRawDraft(JSON.stringify(next, null, 2));
                            setJsonError('');
                        }}
                    />
                ) : (
                    <textarea
                        id="mesero-order-json-editor"
                        className="mesero-order-json-textarea"
                        value={rawDraft}
                        onChange={(e) => {
                            setRawDraft(e.target.value);
                            setJsonError('');
                        }}
                        spellCheck={false}
                    />
                )}

                {jsonError && (
                    <div className="mesero-order-json-error">{jsonError}</div>
                )}

                <div className="mesero-order-json-actions">
                    <button
                        type="button"
                        className="mesero-order-json-btn mesero-order-json-btn--ghost"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="mesero-order-json-btn mesero-order-json-btn--primary"
                        onClick={handleSave}
                        disabled={saving || loading}
                    >
                        {saving ? 'Guardando…' : 'Guardar JSON'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default MeseroOrderJsonModal;
