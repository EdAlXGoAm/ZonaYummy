import React, { useState } from 'react';

import DropDown from '../x10DropDown';

const Refrescos = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const dessertOptions = [
        'Coca 600 ml (Taquera)',
        'Sidral 600 ml (Taquera)',
        'Del Valle 600 ml (Taquera)',
        'Freska 600 ml (Taquera)',
        'Fanta 600 ml (Taquera)',
        'Coca Lata',
        'Boing 250 ml',
        'Boing 500 ml',
        'Otro'
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
            <DropDown opciones_in={dessertOptions} selectedValue={selectedTamano} onDropdownChange={handleDropdownChange} precios={[13, 11, 11, 11, 11, 19, 9, 13, 0]}/>
        </div>
    );
};

export default Refrescos;
