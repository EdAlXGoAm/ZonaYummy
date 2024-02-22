import React, { useState } from 'react';

import DropDown from '../x10DropDown';
import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';

const BubbleWaffles = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const tamanoOptions = [
        'Brillitos',
        'Ferrero',
        'Unicornio',
        'Choco Fresa'
    ];
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedSaborWaffle, setselectedSaborWaffle] = useState(propiedadesComanda.selectedSaborWaffle);

    const handleDropdownChange = (e) => {
        setselectedSaborWaffle(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedSaborWaffle = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    return (
        <div>
            <div>
                <DropDown opciones_in={tamanoOptions} selectedValue={selectedSaborWaffle} onDropdownChange={handleDropdownChange} precios={[60, 70, 70, 70]}/>
            </div>
        </div>
    );
};

export default BubbleWaffles;
