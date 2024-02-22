import React, { useState } from 'react';

import DropDown from '../x10DropDown';

const Refrescos = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const dessertOptions = [
        'Vaso',
        'Medio litro',
        'Litro'
    ];
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedTamano, setSelectedTamano] = useState(propiedadesComanda.selectedTamano);

    const handleDropdownChange = (e) => {
        setSelectedTamano(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedTamano = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    return (
        <div>
            <DropDown opciones_in={dessertOptions} selectedValue={selectedTamano} onDropdownChange={handleDropdownChange} precios={[20, 30, 0]}/>
        </div>
    );
};

export default Refrescos;
