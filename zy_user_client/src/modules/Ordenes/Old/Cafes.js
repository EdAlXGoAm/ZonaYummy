import React, { useState } from 'react';

import DropDown from '../x10DropDown';

const Cafés = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    
    //Cafe
    const dessertOptions = [
        'Americano',
        'Americano con Leche',
        'De Olla',
        'Dalgona'
    ];
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedSaborCafe, setselectedSaborCafe] = useState(propiedadesComanda.selectedSaborCafe);

    const handleDropdownChange = (e) => {
        setselectedSaborCafe(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedSaborCafe = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    return (
        <div>
            <DropDown opciones_in={dessertOptions} selectedValue={selectedSaborCafe} onDropdownChange={handleDropdownChange} precios={[15, 20, 15, 25]}/>
        </div>
    );
};

export default Cafés;
