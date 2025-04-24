import './PlatilloSelector.css';
import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PlatilloSelector = ({addPlatilloToOrder, platillos}) => {
    const notify = (message) => toast(message);
    const renderButtons = () => {
        const buttons = [];
        for (let i = 0; i < platillos.length; i++) {
            if (platillos[i].Disponibilidad !== 0) {
                buttons.push(
                    <button key={i} className="platilloButton" onClick={() => addPlatilloToOrder(platillos[i])}>
                        <div className="divImagePlatilloButton">
                            <img src={platillos[i].Imagen} alt={platillos[i].NombrePlatillo} style={{ width: '60px', height: '60px' }} />
                        </div>
                        <div className="textPlatilloButton">{platillos[i].NombrePlatillo}</div>
                    </button>
                );
            }
            else {
                buttons.push(
                    <button key={i} className="platilloButton disabled" onClick={() => notify("Platillo no disponible")}>
                        <div className="divImagePlatilloButton">
                            <img src={platillos[i].Imagen} alt={platillos[i].NombrePlatillo} style={{ width: '60px', height: '60px' }} />
                        </div>
                        <div className="textPlatilloButton">{platillos[i].NombrePlatillo}</div>
                    </button>
                );
            }
        }
        return buttons;
    };

    return (
        <div className="platillo-scroll-container">
            {renderButtons()}
            <ToastContainer />
        </div>
    )
}

export default PlatilloSelector;