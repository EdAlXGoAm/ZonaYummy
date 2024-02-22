import React, { useState } from 'react';

import DropDown from '../x10DropDown';

const Esquimos = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    
    //Esquimo
    const dessertOptions = [
        'Fresa',
        'Chocolate',
        'Pistache',
        'Moka',
        'Rompope',
        'Cajeta'
    ];
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedSaborEsquimo, setselectedSaborEsquimo] = useState(propiedadesComanda.selectedSaborEsquimo);

    const handleDropdownChange = (e) => {
        setselectedSaborEsquimo(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedSaborEsquimo = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    return (
        <div>
            <DropDown opciones_in={dessertOptions} selectedValue={selectedSaborEsquimo} onDropdownChange={handleDropdownChange} precios={[25, 25, 25, 25, 30, 30]}/>
        </div>
    );
};

export default Esquimos;
