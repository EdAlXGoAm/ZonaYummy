import './MeseroPlatilloSelector.css';
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';

const CATEGORY_ORDER = ['Postres', 'Botanas', 'Comida', 'Bebidas', 'Waffles'];

const MeseroPlatilloSelector = ({ addPlatilloToOrder, platillos, floating = false, inHead = false }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const notify = (message) => toast(message);

    const platillosByCategory = useMemo(() => {
        const known = new Set(CATEGORY_ORDER);
        const extras = [...new Set(
            platillos
                .map((p) => p.Categoria)
                .filter((c) => c && !known.has(c))
        )];
        const orderedCategories = [...CATEGORY_ORDER, ...extras];

        return orderedCategories
            .map((name) => ({
                name,
                items: platillos.filter((p) => p.Categoria === name),
            }))
            .filter((section) => section.items.length > 0);
    }, [platillos]);

    const handleSelectPlatillo = (platillo) => {
        if (platillo.Disponibilidad === 0) {
            notify('Platillo no disponible');
            return;
        }
        addPlatilloToOrder(platillo);
        setModalOpen(false);
    };

    return (
        <div className={`mesero-platillo-selector${floating ? ' mesero-platillo-selector--floating' : ''}${inHead ? ' mesero-platillo-selector--in-head' : ''}`}>
            <button
                type="button"
                className={`mesero-add-platillo-btn${floating ? ' mesero-add-platillo-btn--fab' : ''}`}
                onClick={() => setModalOpen(true)}
                title="Agregar platillo"
                aria-label="Agregar platillo"
            >
                {floating ? (
                    <>
                        <span className="mesero-add-platillo-btn__icon" aria-hidden="true">+</span>
                        <span className="mesero-add-platillo-btn__label">Platillo</span>
                    </>
                ) : (
                    '+ Agregar platillo'
                )}
            </button>

            {modalOpen && createPortal(
                <div
                    className="platillo-modal-overlay"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="platillo-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="platillo-modal__header">
                            <span className="platillo-modal__title">Agregar platillo</span>
                            <button
                                type="button"
                                className="platillo-modal__close"
                                onClick={() => setModalOpen(false)}
                                title="Cerrar"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="platillo-modal__body">
                            {platillosByCategory.length === 0 ? (
                                <p className="platillo-modal__empty">No hay platillos disponibles.</p>
                            ) : (
                                platillosByCategory.map((section) => (
                                    <section key={section.name} className="platillo-modal__section">
                                        <h3 className="platillo-modal__category">{section.name}</h3>
                                        <div className="platillo-modal__grid">
                                            {section.items.map((platillo, index) => (
                                                <button
                                                    key={`${section.name}-${platillo.NombrePlatillo}-${index}`}
                                                    type="button"
                                                    className={`platillo-modal__item${platillo.Disponibilidad === 0 ? ' platillo-modal__item--disabled' : ''}`}
                                                    onClick={() => handleSelectPlatillo(platillo)}
                                                >
                                                    <img
                                                        src={platillo.Imagen}
                                                        alt={platillo.NombrePlatillo}
                                                    />
                                                    <span>{platillo.NombrePlatillo}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                ))
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
};

export default MeseroPlatilloSelector;
