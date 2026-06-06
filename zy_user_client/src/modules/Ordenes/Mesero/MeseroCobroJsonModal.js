import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ordersApi from '../../../api/ordersApi';
import './MeseroCobroJsonModal.css';

const buildCobroSnapshot = (orderV2, liveTotal) => ({
    OrderID: orderV2?.OrderID,
    CuentaTotal: liveTotal ?? orderV2?.CuentaTotal ?? 0,
    pagado: orderV2?.pagado ?? 0,
    pendiente: orderV2?.pendiente ?? 0,
    pagos: orderV2?.pagos ?? [],
});

const MeseroCobroJsonModal = ({
    orderId,
    liveTotal,
    onClose,
    onSaved,
    notify,
}) => {
    const [jsonDraft, setJsonDraft] = useState('');
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
                setJsonDraft(JSON.stringify(buildCobroSnapshot(data, liveTotal), null, 2));
            })
            .catch((err) => {
                if (!cancelled) {
                    setJsonError(err?.message || String(err));
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [orderId, liveTotal]);

    const handleSave = async () => {
        let parsed;
        try {
            parsed = JSON.parse(jsonDraft);
        } catch (err) {
            setJsonError(`JSON inválido: ${err.message}`);
            return;
        }

        if (!Array.isArray(parsed.pagos)) {
            setJsonError('El JSON debe incluir un array "pagos".');
            return;
        }

        setSaving(true);
        setJsonError('');

        try {
            const updated = await ordersApi.replaceOrderCobro(orderId, parsed);
            notify?.('Cobro actualizado desde JSON');
            onSaved?.(updated);
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
            className="mesero-cobro-json-fondo"
            role="presentation"
            onClick={onClose}
        >
            <div
                className="mesero-cobro-json-contenedor"
                role="dialog"
                aria-labelledby="mesero-cobro-json-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mesero-cobro-json-header">
                    <h3 id="mesero-cobro-json-title">
                        JSON de cobro · Orden {orderId}
                    </h3>
                    <button
                        type="button"
                        className="mesero-cobro-json-close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <p className="mesero-cobro-json-hint">
                    Edita <code>CuentaTotal</code>, <code>pagado</code>, <code>pendiente</code> y el array <code>pagos</code>.
                </p>

                {loading ? (
                    <div className="mesero-cobro-json-loading">Cargando…</div>
                ) : (
                    <textarea
                        className="mesero-cobro-json-textarea"
                        value={jsonDraft}
                        onChange={(e) => {
                            setJsonDraft(e.target.value);
                            setJsonError('');
                        }}
                        spellCheck={false}
                    />
                )}

                {jsonError && (
                    <div className="mesero-cobro-json-error">{jsonError}</div>
                )}

                <div className="mesero-cobro-json-actions">
                    <button
                        type="button"
                        className="mesero-cobro-json-btn mesero-cobro-json-btn--ghost"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="mesero-cobro-json-btn mesero-cobro-json-btn--primary"
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

export default MeseroCobroJsonModal;
