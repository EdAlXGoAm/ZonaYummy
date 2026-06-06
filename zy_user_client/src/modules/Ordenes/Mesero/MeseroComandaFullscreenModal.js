import './MeseroComandaFullscreenModal.css';
import React from 'react';
import { createPortal } from 'react-dom';

const MeseroComandaFullscreenModal = ({ title, onClose, children }) => createPortal(
    <div className="mesero-comanda-fs" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mesero-comanda-fs__panel">
            <header className="mesero-comanda-fs__header">
                <h2 className="mesero-comanda-fs__title">{title}</h2>
                <button
                    type="button"
                    className="mesero-comanda-fs__close"
                    onClick={onClose}
                    title="Cerrar"
                    aria-label="Cerrar comanda"
                >
                    ✕
                </button>
            </header>
            <div className="mesero-comanda-fs__body">
                {children}
            </div>
        </div>
    </div>,
    document.body
);

export default MeseroComandaFullscreenModal;
