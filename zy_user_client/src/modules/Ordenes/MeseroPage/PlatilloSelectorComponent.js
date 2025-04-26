import './PlatilloSelector.css';
import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PlatilloSelector = ({addPlatilloToOrder, platillos}) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    // Lista de categorías fijas
    const categories = ["Postres", "Botanas", "Comida", "Bebidas", "Waffles"];
    const notify = (message) => toast(message);

    // Función para renderizar los botones de categorías
    const renderCategoryButtons = () => {
        return categories.map((cat, index) => (
            <button key={index} className="categoryButton" onClick={() => setSelectedCategory(cat)}>
                <div className="textCategoryButton">{cat}</div>
            </button>
        ));
    };

    // Función para renderizar los platillos filtrados por categoría
    const renderPlatillosButtons = () => {
        const filtered = platillos.filter(p => p.Categoria === selectedCategory);
        return filtered.map((p, index) => (
            p.Disponibilidad !== 0 ? (
                <button key={index} className="platilloButton" onClick={() => addPlatilloToOrder(p)}>
                    <div className="divImagePlatilloButton">
                        <img src={p.Imagen} alt={p.NombrePlatillo} style={{ width: '60px', height: '60px' }} />
                    </div>
                    <div className="textPlatilloButton">{p.NombrePlatillo}</div>
                </button>
            ) : (
                <button key={index} className="platilloButton disabled" onClick={() => notify("Platillo no disponible") }>
                    <div className="divImagePlatilloButton">
                        <img src={p.Imagen} alt={p.NombrePlatillo} style={{ width: '60px', height: '60px' }} />
                    </div>
                    <div className="textPlatilloButton">{p.NombrePlatillo}</div>
                </button>
            )
        ));
    };

    return (
        <div className="platillo-scroll-container">
            {selectedCategory === null
                ? renderCategoryButtons()
                : (
                    <>
                        <button className="backBubble" onClick={() => setSelectedCategory(null)}>←</button>
                        {renderPlatillosButtons()}
                    </>
                )
            }
            <ToastContainer />
        </div>
    )
}

export default PlatilloSelector;