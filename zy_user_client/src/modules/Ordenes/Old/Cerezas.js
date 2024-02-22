import React, { useState } from 'react';

import DropDown from '../x10DropDown';

const Cerezas = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const dessertOptions = [
        'Vaso de Cerezas',
        'Vaso con Crema Batida'
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
            <DropDown opciones_in={dessertOptions} selectedValue={selectedTamano} onDropdownChange={handleDropdownChange} precios={[40, 45]}/>
        </div>
    );
};

export default Cerezas;
