import React, { useState } from 'react';

import DropDown from '../x10DropDown';
import ToogleButton_CheckButtons from '../x11ToogleButton_CheckButtons';

const Doriesquites = ({ index, comanda, platillo, platillo_espacios, toggleChecked_Status, setToggleChecked_Status, propiedadesComanda, handleUpdatePropiedadesComanda}) => {
    const maruchanOptions = [
        'Camarón',
        'Camarón Habanero',
        'Camarón Piquin',
        'Pollo',
        'Res'
    ];
    const aderezos = [
        'Valentina',
        'Limón',
        'Sal',
        'Jugo Maggi',
    ];

    const [statusAderezos, setStatusAderezos] = useState(
        [
            propiedadesComanda.cb_valentina,
            propiedadesComanda.cb_limón,
            propiedadesComanda.cb_sal,
            propiedadesComanda.cb_jugomaggi
        ]);

    const handleUpdateStatusAderezos = (newStatus) => {
        setStatusAderezos(newStatus);
        const newPropiedades = propiedadesComanda;
        newPropiedades.cb_valentina = newStatus[0];
        newPropiedades.cb_limón = newStatus[1];
        newPropiedades.cb_sal = newStatus[2];
        newPropiedades.cb_jugomaggi = newStatus[3];
        handleUpdatePropiedadesComanda(newPropiedades);
    }
    
    
    // Estado para almacenar el valor seleccionado del dropdown
    const [selectedMaruchan, setSelectedMaruchan] = useState(propiedadesComanda.selectedMaruchan);

    const handleDropdownChangeMaruchan = (e) => {
        setSelectedMaruchan(e.value);

        const newPropiedades = propiedadesComanda;
        newPropiedades.precio = e.precio;
        newPropiedades.selectedMaruchan = e.value;
        handleUpdatePropiedadesComanda(newPropiedades);
    };

    return (
        <div>
            <div>
                <DropDown opciones_in={maruchanOptions} selectedValue={selectedMaruchan} onDropdownChange={handleDropdownChangeMaruchan} precios={[25, 25, 25, 25, 25]}/>
            </div>
            
            <div className="row">
                <div className="col">
                    <ToogleButton_CheckButtons index={index} platillo='MaruchanSola' tipo_ingrediente='aderezos' ingredientes_checkbutton={aderezos} despliegue='horizontal' toggleChecked_Status={toggleChecked_Status} setToggleChecked_Status={setToggleChecked_Status} statusCheckBoxes={statusAderezos} handleUpdateStatusCheckBoxes={handleUpdateStatusAderezos} />
                </div>
            </div>
        </div>
    );
};

export default Doriesquites;
