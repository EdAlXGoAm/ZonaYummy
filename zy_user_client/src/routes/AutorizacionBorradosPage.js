import './AutorizacionBorradosPage.css';
import React, { useCallback, useEffect, useState } from 'react';
import io from 'socket.io-client';
import borradosApi from '../api/borradosApi';

const socket = io(`${process.env.REACT_APP_API_URL}`);

const formatFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const AutorizacionBorradosPage = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [procesandoId, setProcesandoId] = useState(null);
    const [error, setError] = useState('');

    const cargarSolicitudes = useCallback(async () => {
        try {
            setError('');
            const data = await borradosApi.getPendientes();
            setSolicitudes(data);
        } catch (err) {
            console.error(err);
            setError('No se pudieron cargar las solicitudes de borrado.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarSolicitudes();
    }, [cargarSolicitudes]);

    useEffect(() => {
        const onNuevaSolicitud = () => cargarSolicitudes();
        socket.on('SolicitudBorradoDesdeServidor', onNuevaSolicitud);
        return () => socket.off('SolicitudBorradoDesdeServidor', onNuevaSolicitud);
    }, [cargarSolicitudes]);

    const handleProceder = async (solicitud) => {
        const confirmar = window.confirm(
            `¿Proceder con el borrado de "${solicitud.Platillo}" del pedido #${solicitud.OrderID}?`,
        );
        if (!confirmar) return;

        setProcesandoId(solicitud._id);
        try {
            const result = await borradosApi.procederBorrado(solicitud._id);
            const deleteMsg = `Delete-${solicitud.OrderID}-${solicitud.Platillo || ''}`;
            socket.emit('DeleteComandaDesdeCliente', { msg: deleteMsg });
            socket.emit('OrdenActualizadaDesdeCliente', { msg: solicitud.OrderID });
            setSolicitudes((prev) => prev.filter((s) => s._id !== solicitud._id));
            if (result?.alreadyDeleted) {
                alert('La comanda ya no existía en la base de datos. Solicitud cerrada.');
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || 'Error al proceder con el borrado.';
            alert(msg);
        } finally {
            setProcesandoId(null);
        }
    };

    const handleRechazar = async (solicitud) => {
        const confirmar = window.confirm(
            `¿Rechazar la solicitud de borrado de "${solicitud.Platillo}"?`,
        );
        if (!confirmar) return;

        setProcesandoId(solicitud._id);
        try {
            await borradosApi.rechazarBorrado(solicitud._id);
            setSolicitudes((prev) => prev.filter((s) => s._id !== solicitud._id));
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || 'Error al rechazar la solicitud.';
            alert(msg);
        } finally {
            setProcesandoId(null);
        }
    };

    return (
        <div className="autorizacion-borrados">
            <header className="autorizacion-borrados__header">
                <div>
                    <span className="autorizacion-borrados__kicker">ZonaYummy</span>
                    <h1 className="autorizacion-borrados__title">Autorización de borrados</h1>
                    <p className="autorizacion-borrados__subtitle">
                        Solicitudes pendientes de eliminar comandas
                    </p>
                </div>
                <button
                    type="button"
                    className="autorizacion-borrados__refresh"
                    onClick={cargarSolicitudes}
                    disabled={loading}
                >
                    Actualizar
                </button>
            </header>

            {error && <div className="autorizacion-borrados__error">{error}</div>}

            {loading ? (
                <p className="autorizacion-borrados__empty">Cargando solicitudes…</p>
            ) : solicitudes.length === 0 ? (
                <p className="autorizacion-borrados__empty">No hay solicitudes de borrado pendientes.</p>
            ) : (
                <div className="autorizacion-borrados__list">
                    {solicitudes.map((solicitud) => (
                        <article key={solicitud._id} className="autorizacion-borrados__card">
                            <div className="autorizacion-borrados__card-main">
                                {solicitud.Imagen && (
                                    <img
                                        src={solicitud.Imagen}
                                        alt={solicitud.Platillo}
                                        className="autorizacion-borrados__img"
                                    />
                                )}
                                <div className="autorizacion-borrados__info">
                                    <h2 className="autorizacion-borrados__platillo">
                                        {solicitud.Platillo || 'Sin nombre'}
                                    </h2>
                                    <p className="autorizacion-borrados__meta">
                                        Pedido <strong>#{solicitud.OrderID}</strong>
                                        {solicitud.ComandaId != null && (
                                            <> · Comanda <strong>#{solicitud.ComandaId}</strong></>
                                        )}
                                    </p>
                                    <p className="autorizacion-borrados__meta">
                                        {solicitud.Categoria && <span>{solicitud.Categoria} · </span>}
                                        ${Number(solicitud.Precio || 0).toFixed(2)}
                                    </p>
                                    <p className="autorizacion-borrados__fecha">
                                        Solicitado: {formatFecha(solicitud.requestedAt)}
                                    </p>
                                    <p className="autorizacion-borrados__id">
                                        ID: {solicitud.comandaMongoId}
                                    </p>
                                </div>
                            </div>
                            <div className="autorizacion-borrados__actions">
                                <button
                                    type="button"
                                    className="autorizacion-borrados__btn autorizacion-borrados__btn--proceder"
                                    onClick={() => handleProceder(solicitud)}
                                    disabled={procesandoId === solicitud._id}
                                >
                                    {procesandoId === solicitud._id ? 'Procesando…' : 'Proceder'}
                                </button>
                                <button
                                    type="button"
                                    className="autorizacion-borrados__btn autorizacion-borrados__btn--rechazar"
                                    onClick={() => handleRechazar(solicitud)}
                                    disabled={procesandoId === solicitud._id}
                                >
                                    Rechazar
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AutorizacionBorradosPage;
